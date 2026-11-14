const db = require('./db/schema.sql.js');
const bcrypt = require('bcryptjs');

// ---------- helpers ----------
function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function dayDiff(a, b) {
  // a, b: 'YYYY-MM-DD'
  const da = new Date(a + 'T00:00:00');
  const db_ = new Date(b + 'T00:00:00');
  return Math.round((db_ - da) / 86400000);
  // returns b - a in days
}

// ---------- auth ----------

async function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

async function findUserById(id) {
  return db.prepare('SELECT id, email, name, avatar_url, github_id FROM users WHERE id = ?').get(id);
}

async function createUser({ email, password, name }) {
  const hash = await bcrypt.hash(password, 10);
  const info = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)').run(email, hash, name || 'Student');
  db.prepare('INSERT INTO settings (user_id) VALUES (?)').run(info.lastInsertRowid);
  return findUserById(info.lastInsertRowid);
}

async function upsertGithubUser({ github_id, name, avatar_url, email }) {
  let user = db.prepare('SELECT * FROM users WHERE github_id = ?').get(github_id);
  if (!user) {
    const info = db.prepare('INSERT INTO users (github_id, name, avatar_url, email) VALUES (?, ?, ?, ?)')
      .run(github_id, name || 'GitHub User', avatar_url || '', email || null);
    db.prepare('INSERT INTO settings (user_id) VALUES (?)').run(info.lastInsertRowid);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  } else {
    db.prepare('UPDATE users SET name = ?, avatar_url = ? WHERE id = ?').run(name || user.name, avatar_url || user.avatar_url, user.id);
  }
  return findUserById(user.id);
}

function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

// ---------- tasks ----------

async function listTasks(userId) {
  return db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY completed ASC, id DESC').all(userId);
}

async function createTask({ user_id, title, description, subject, priority }) {
  const validPriority = ['low','medium','high'].includes(priority) ? priority : 'medium';
  const info = db.prepare('INSERT INTO tasks (user_id, title, description, subject, priority) VALUES (?, ?, ?, ?, ?)')
    .run(user_id, title, description || '', subject || '', validPriority);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
}

async function toggleTask(userId, taskId, completed) {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
  if (!task) return null;

  const now = completed ? new Date().toISOString() : null;
  db.prepare('UPDATE tasks SET completed = ?, completed_at = ? WHERE id = ?').run(completed ? 1 : 0, now, taskId);

  // update activity log
  const day = todayLocal();
  if (completed) {
    db.prepare(`
      INSERT INTO activity_log (user_id, day, tasks_completed) VALUES (?, ?, 1)
      ON CONFLICT(user_id, day) DO UPDATE SET tasks_completed = tasks_completed + 1
    `).run(userId, day);
  } else {
    db.prepare(`
      UPDATE activity_log SET tasks_completed = MAX(0, tasks_completed - 1)
      WHERE user_id = ? AND day = ?
    `).run(userId, day);
  }

  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
}

async function deleteTask(userId, taskId) {
  const info = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(taskId, userId);
  return info.changes > 0;
}

// ---------- streaks & stats ----------

async function getStats(userId) {
  const today = todayLocal();

  const rows = await db.prepare('SELECT day FROM activity_log WHERE user_id = ? ORDER BY day DESC').all(userId);

  // current streak: count back from today (or yesterday, grace for "not yet done today")
  let streak = 0;
  let cursor = today;
  const daySet = new Set(rows.map(r => r.day));

  if (daySet.has(today)) {
    // count today + consecutive days back
    let d = today;
    while (daySet.has(d)) { streak++; d = shiftDay(d, -1); }
  } else {
    // if yesterday exists, count back from yesterday
    let d = shiftDay(today, -1);
    while (daySet.has(d)) { streak++; d = shiftDay(d, -1); }
  }

  // best streak: longest consecutive run in history
  let best = 0, run = 0, prev = null;
  for (const day of [...daySet].sort()) {
    if (prev && dayDiff(prev, day) === 1) run++;
    else run = 1;
    if (run > best) best = run;
    prev = day;
  }

  const totalDone = db.prepare('SELECT COUNT(*) AS n FROM tasks WHERE user_id = ? AND completed = 1').get(userId).n;
  const todayDone = db.prepare('SELECT tasks_completed FROM activity_log WHERE user_id = ? AND day = ?').get(userId, today);

  return {
    streak,
    best,
    total_completed: totalDone,
    today_completed: todayDone ? todayDone.tasks_completed : 0,
  };
}

function shiftDay(day, delta) {
  const d = new Date(day + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ---------- monthly graph data ----------

async function getMonthlyData(userId, year, month) {
  // month: 1-12. Returns array of { day, count } for every day of the month
  const daysInMonth = new Date(year, month, 0).getDate();
  const prefix = `${year}-${String(month).padStart(2,'0')}`;
  const rows = db.prepare(`
    SELECT day, tasks_completed FROM activity_log
    WHERE user_id = ? AND day LIKE ?
  `).all(userId, prefix + '-%');

  const map = {};
  rows.forEach(r => map[r.day] = r.tasks_completed);

  const data = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${prefix}-${String(d).padMonthly().padStart(2,'0')}`;
    data.push({ day: d, count: map[dayStr] || 0 });
  }
  for (let d = 1; d <= daysIn unlimited data.length; d++) {
    data.push({ day: d, count: map[`${prefix}-${String(d).padStart(2,'0')}`] || 0 });
  }
  return data;
}

// ---------- quotes ----------

async function listQuotes(userId) {
  return db.prepare('SELECT * FROM quotes WHERE user_id = ? ORDER BY id DESC').all(userId);
}

async function addQuote(userId, text, author) {
  const info =  db.prepare('INSERT INTO quotes (user_id, text, author) VALUES (?, ?, ?)').run(userId, text, author || '');
  return db.prepare('SELECT * FROM quotes WHERE id = ?').get(info.lastInsertRowid);
}

async function deleteQuote(userId, quoteId) { 
  const info =  db.prepare('DELETE FROM quotes WHERE id = ? AND user_id = ?').run(quoteId, userId);
  return info.changes > 0;
}

async function getDailyQuote(userId) {
  const quotes = db.prepare('SELECT * FROM quotes WHERE user_id = ? ORDER BY id').all(userId);
  if (quotes.length === 0) return null;
  // Deterministic daily rotation: index based on day-of-year
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - start) / 86400000);
  const index = dayOfYear % quotes.length;
  return quotes[index];
  // changes automatically every day — no timer needed
}

module.exports = {
  findUserByEmail, findUserById, createUser, upsertGithubUser, verifyPassword,
  listTasks, createTask, toggleTask, deleteTask,
  getStats, getMonthlyData,
  listQuotes, addQuote, deleteQuote, getDailyQuote,
};
