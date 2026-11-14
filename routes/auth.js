const express = require('express');
const crypto = require('crypto');
const db = require('../db/db.js');

const router = express.Router();

// POST /auth/register
router.post('/register', (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Invalid email address' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  if (db.findUserByEmail(email)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const user = db.createUser({ email: String(email).toLowerCase().trim(), password: String(password), name });
  req.session.userId = user.id;
  res.json({ user });
});

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.findUserByEmail(String(email).toLowerCase().trim());
  if (!user || !db.verifyPassword(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  req.session.userId = user.id;
  res.json({ user: db.findUserById(user.id) });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// GET /auth/me
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  res.json({ user: db.findUserById(req.session.userId) });
});

// GET /auth/github — start OAuth
router.get('/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return res.redirect('/?error=github_oauth_not_configured');

  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;
  const redirect = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&scope=read:user%20user:email&state=${state}`;
  res.redirect(redirect);
});

// GET /auth/github/callback — finish OAuth
router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.redirect('/?error=missing_code');
  if (!req.session.oauthState || req.session.oauthState !== state) {
    return res.redirect('/?error=state_mismatch');
  }
  delete req.session.oauthState;

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) return res.redirect('/?error=token_exchange_failed');

    const profileRes = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'FocusFlow' },
    });
    const profile = await profileRes.json();

    let email = null;
    try {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'FocusFlow' },
      });
      const emails = await emailsRes.json();
      if (Array.isArray(emails)) email = (emails.find(e => e.primary) || emails[0] || {}).email || null;
    } catch (e) { /* email scope is optional */ }

    const user = db.upsertGithubUser({
      github_id: String(profile.id),
      name: profile.name || profile.login,
      avatar_url: profile.avatar_url,
      email,
    });

    req.session.userId = user.id;
    res.redirect('/');
  } catch (err) {
    console.error('GitHub OAuth error:', err);
    res.redirect('/?error=github_oauth_failed');
  }
});

module.exports = router;
