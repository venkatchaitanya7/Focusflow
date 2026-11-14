const express = require('express');
const db = require('../db/db.js');

const router = express.Router();

// all task routes require login
router.use((req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Please log in' });
  next();
});

// GET /api/tasks
router.get('/', (req, res) => {
  res.json({ tasks: db.listTasks(req.session.userId) });
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, description, subject, priority } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Task title is required' });
  const task = db.createTask({
    user_id: req.session.userId,
    title: String(title).trim(),
    description, subject, priority,
  });
  res.json({ task });
});

// PATCH /api/tasks/:id/toggle
router.patch('/:id/toggle', (req, res) => {
  const { completed } = req.body || {};
  const task = db.toggleTask(req.session.userId, req.params.id, !!completed);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ task });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const ok = db.deleteTask(req.session.userId, req.params.id);
  if (ok) res.json({ ok: true });
  else res.status(404).json({ ok: false, error: 'Task not found' });
});

module.exports = router;
