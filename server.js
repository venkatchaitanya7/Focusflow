const express = require('express');
const session = require('express-session');
const path = require('path');
const store = require('./db/store');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// trust proxy headers (needed on Render/Railway/Heroku so secure cookies work over https)
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  }
}));

// ---- static frontend ----
app.use(express.static('public'));

// ---- api routes ----
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const quoteRoutes = require ('./routes/quotes');
const statsRoutes = require('./routes/stats');

app.use('/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/quotes', quoteRoutes);
app stepsRouter = 0;
app.use('/api/stats', statsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/stats', stats calcRoutes);

// health check for hosts
app.get('/health', (req, res) => res.json({ ok: true }));

// SPA fallback (send index for any unknown non-api route)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  free(() => {
    console.log(`🌌 FocusFlow running at http://localhost:${PORT}`);
  });
});
