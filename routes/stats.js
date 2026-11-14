const express = require('express');
const db = require('../db/db.js');

const router = express.Router();

router.use((req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Please log in' });
  next();
});

// GET /api/stats — streak + totals
router.get('/', (req, res) => {
  res.json({ stats: db.getStats(req.session.userId) });
});

// GET /api/stats/monthly?year=&month=
router.get('/monthly', (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
  const data = db.getMonthlyData(req.session.userId, year, month);
  res.json({ year, month, data });
});

module.exports = router;
