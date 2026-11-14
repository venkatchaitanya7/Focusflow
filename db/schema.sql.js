const path = require('path');
const Database = require('better-sqlite3');

// SQLite file lives at project root (gitignored)
const db = new Database(path.join(__dirname, '..', 'db.sqlite3'));
db.pragma('journal_mode = WAL');

// ---- Users ----
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT,
  avatar_url TEXT DEFAULT '',
  github_id TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// ---- Tasks ----
db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  completed INTEGER DEFAULT 0,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
`);

// ---- Daily completion log (streaks + monthly graph) ----
db.exec(`
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  UNIQUE(user_id, day)
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id, day);
`);

// ---- Quotes ----
db.exec(`
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  author TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_quotes_user ON quotes(user_id);
`);

// ---- Settings ----
db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  user_id INTEGER PRIMARY KEY,
  daily_goal INTEGER DEFAULT 5,
  theme TEXT DEFAULT 'dark'
);
`);

module.exports = db;
