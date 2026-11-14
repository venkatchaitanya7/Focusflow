const path = require('path');
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const MemoryStore = require('./db/store');

const app = express();
const PORT = process.env.PORT || 3000;

// trust proxy headers (Render / Railway / Fly) so secure cookies work behind https
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  store: new MemoryStore(),
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));

// ---- static frontend ----
app.use(express.static(path.join(__dirname, 'public')));

// ---- api routes ----
app.use('/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/stats', require('./routes/stats'));

// health check for hosts
app.get('/health', (req, res) => res.json({ ok: true }));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌌 FocusFlow running at http://localhost:${PORT}`);
});
