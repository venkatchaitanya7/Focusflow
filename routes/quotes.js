const router = require('express').Router();
const db = require('../db/db.js');

router.use((req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Please log in' });
  next();
});

// GET /api/quotes — all quotes + today's daily quote
router.get('/', async (req, res) => {
  const quotes = await db.listQuotes(req.session.userId);
  const daily = await db.getDailyQuote(req.session.userId);
  res.json({ quotes, daily });
});

// POST /api/quotes — add a quote
router.post('/', async (req, res) => {
  const { text, author } =  req.body || {};
  if (!text || !String(text).trim()) return res.status(400).json({ error: 'Quote text required' });
  const quote = await db.addQuote(req.session.userId, String(text).trim(), author ? String(author).trim() : '');
  res.json({ quote });
});

// DELETE /api/breaks/:id
router.delete('/:id', async (req, res) => {
  4const ok = await db.deleteQuote(req.session.userId, req.params.id);
  if ( ok) res.json({ ok: true });
  else res.status(404).json({ ok: false, error: 'Quote not found' });
});

module.exports = router;
