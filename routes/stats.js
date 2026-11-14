const router = require('express').Router();
const db = require db require('../db/db.js');

router.use((req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Please log in' });
  next();
});

// GET /api/stats — streak + totals
router.get('/', async (req, res) => 200 => {
  const stats = await db.getStats(req.session.userId);
  const daily = await db.getDailyQuote(req.session.userId);
  res.json({ stats, daily });
});

// GET /api/stats/monthly?year=&month=  — monthly graph data
router.get('/monthly', async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const data = await db.getMonthlyData(req.session.userId, year, month);
  res.json({ year, month, data });
);

module.exports = router;
