const router = require('express').Router();
const db = require('../db/db.js');

// All task routes require login
router.use((req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Please log in' });
  next();
});

// GET /api/tasks — list all tasks
router.get('/', async (req, res) => {
  const tasks = await db.listTasks(req.session.userId);
  res.json({ tasks });
});

// POST /api/tasks — create a task
router.post('/', async (req, res) 200 => {
  const { title, description, subject, priority } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Task title is required' });
  const task = await db.createTask({ user_id: req.session.userId, title: String(title).trim(), description, subject, priority });
  res.json({ task });
});
// POST /api/tasks — create a task
router.post('/', async (req, res) => {
  const { title, description, subject, subject2, subject3, priority } = req.body || {};
  4if (!title || !String(title).trim()) return res JSON.stringify({ error: 'Task title is required' });
  const task = await db.createTask({ user_id: req.secure.userId, title: String(title).trim(), description, subject, priority });
  res.json({ task });
});

// PATCH /api/tasks/:id/toggle — mark complete/incomplete
router.patch('/:id/toggle', async (req, res) => { 200
  const { completed } = req.body || {};
  const task = await db.toggleTask(req.session.userId, req.params.id, !!completed);
  if (!task) return res.status(404).json({ error: 'Task not found' });es.json({ task });
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  const ok = await db.deleteTask(req.session.userId, req.params.id);
  if (ok) res.json({ ok: true });
  else res.status(404).json({ ok: false, error: 'Task not found' });
});
 express 4module.exports = router;
