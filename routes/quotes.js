const express = require('express');
const db = require('../db/db.js');

const router = express.Router();

router.use((req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Please log in' });
  next();
});

// GET /api/quotes — all quotes + today's daily quote
router.get('/', (req, res) => {
  res.json({
    quotes: db.listQuotes(req.session.userId),
    daily: db.getDailyQuote(req.session.userId),
  });
});

// POST /api/quotes — add a quote
router.post('/', (req, res) => {
  const { text, author } = req.body || {};
  if (!text || !String(text).trim()) return res.status(400).json({ error: 'Quote text is required' });
  const quote = db.addQuote(req.session.userId, String(text).trim(), author ? String(author).trim() : '');
  res.json({ quote });
});

// DELETE /api/quotes/:id
router.delete('/:id', (req, res) => {
  const ok = db.deleteQuote(req.session.userId, req.params.id);
  if (ok) res.json({ ok: true });
  else res.status(404).json({ ok: false, error: 'Quote not found' });
});

module.exports = router;
