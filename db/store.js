// In-memory session store for express-session (single-process free-tier deployments).
const session = require('express-session');

class MemoryStore extends session.Store {
  constructor() {
    super();
    this.sessions = new Map();
  }
  get(sid, cb) {
    const s = this.sessions.get(sid);
    if (!s) return cb(null, null);
    try { cb(null, JSON.parse(s)); } catch (e) { cb(e); }
  }
  set(sid, sess, cb) {
    this.sessions.set(sid, JSON.stringify(sess));
    cb && cb();
  }
  destroy(sid, cb) {
    this.sessions.delete(sid);
    cb && cb();
  }
  touch(sid, sess, cb) {
    this.sessions.set(sid, JSON.stringify(sess));
    cb && cb();
  }
}

module.exports = MemoryStore;
