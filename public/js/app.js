// ============ FocusFlow frontend ============
const $ = (s) => document.querySelector(s);

let user = null;
let viewDate = new Date(); // month shown in graph
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ---------- helpers ----------
async function api(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---------- boot ----------
(async function init() {
  try {
    const data = await api('/auth/me');
    user = data.user;
  } catch { user = null; }

  const err = new URLSearchParams(location.search).get('error');
  if (err) toast('Login error: ' + err.replace(/_/g, ' '));

  if (user) showApp(); else showAuth();
})();

function showAuth() {
  $('#authScreen').classList.remove('hidden');
  $('#app').classList.add('hidden');
}

function showApp() {
  $('#authScreen').classList.add('hidden');
  $('#app').classList.remove('hidden');

  $('#greeting').textContent = `Hey, ${user.name || 'Student'} 👋`;
  if (user.avatar_url) {
    $('#avatar').src = user.avatar_url;
    $('#avatar').classList.remove('hidden');
  }

  loadTasks();
  loadStats();
  loadGraph();
  loadQuotes();
}

// ---------- auth ----------
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $('#loginForm').classList.toggle('hidden', btn.dataset.tab !== 'login');
    $('#registerForm').classList.toggle('hidden', btn.dataset.tab !== 'register');
  });
});

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
    user = data.user;
    e.target.reset();
    showApp();
  } catch (err) { $('#loginError').textContent = err.message; }
});

$('#registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
    user = data.user;
    e.target.reset();
    showApp();
  } catch (err) { $('#registerError').textContent = err.message; }
});

$('#logoutBtn').addEventListener('click', async () => {
  await api('/auth/logout', { method: 'POST' }).catch(() => {});
  user = null;
  showAuth();
});

// ---------- tasks ----------
async function loadTasks() {
  const { tasks } = await api('/api/tasks');
  renderTasks(tasks);
}

function renderTasks(tasks) {
  const list = $('#taskList');
  list.innerHTML = '';
  const done = tasks.filter(t => t.completed).length;
  $('#taskProgress').textContent = tasks.length ? `${done}/${tasks.length} done` : '';
  $('#emptyTasks').classList.toggle('hidden', tasks.length > 0);

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' done' : '');
    li.innerHTML = `
      <button class="check" aria-label="toggle">✓</button>
      <div class="task-info">
        <div class="task-title">${esc(task.title)}</div>
        ${task.subject ? `<div class="task-meta">${esc(task.subject)} · ${task.priority} priority</div>` : `<div class="task-meta">${task.priority} priority</div>`}
      </div>
      <button class="task-del" aria-label="delete">🗑</button>
    `;

    li.querySelector('.check').addEventListener('click', async () => {
      const next = !task.completed;
      try {
        const { task: updated } = await api(`/api/tasks/${task.id}/toggle`, { method: 'PATCH', body: JSON.stringify({ completed: next }) });
        task.completed = updated.completed;
        li.classList.toggle('done', task.completed);
        toast(task.completed ? '✅ Completed! Streak updated 🔥' : 'Marked incomplete');
        loadStats();
        loadGraph();
      } catch (err) { toast(err.message); }
    });

    li.querySelector('.task-del').addEventListener('click', async () => {
      try {
        await api(`/api/tasks/${task.id}`, { method: 'DELETE' });
        li.remove();
        loadTasks(); loadStats();
      } catch (err) { toast(err.message); }
    });

    list.appendChild(li);
  });
}

$('#taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: $('#taskTitle').value,
        subject: $('#taskSubject').value,
        priority: $('#taskPriority').value,
      }),
    });
    e.target.reset();
    toast('Task added ✨');
    loadTasks();
  } catch (err) { toast(err.message); }
});

// ---------- stats ----------
async function loadStats() {
  const { stats } = await api('/api/stats');
  $('#statStreak').textContent = stats.streak;
  $('#statBest').textContent = stats.best;
  $('#statToday').textContent = stats.today_completed;
  $('#statTotal').textContent = stats.total_completed;
}

// ---------- monthly graph (pure SVG) ----------
async function loadGraph() {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  const { data } = await api(`/api/stats/monthly?year=${year}&month=${month}`);
  $('#monthLabel').textContent = `${MONTHS[month - 1]} ${year}`;

  const W = 640, H = 220, padL = 28, padB = 24, padT = 10;
  const max = Math.max(4, ...data.map(d => d.count));
  const bw = (W - padL - 8) / data.length;

  const today = new Date();
  const isCurrent = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDay = today.getDate();

  let bars = '';
  let labels = '';
  data.forEach((d, i) => {
    const x = padL + i * bw;
    const h = (d.count / max) * (H - padB - padT);
    const y = H - padB - h;
    const isToday = isCurrent && d.day === todayDay;
    if (d.count > 0) {
      bars += `<rect class="bar${isToday ? ' today' : ''}" x="${x + 2}" y="${y}" width="${bw - 4}" height="${h}" rx="4"><title>${d.day} ${MONTHS[month-1]}: ${d.count} completed</title></rect>`;
    } else {
      bars += `<rect x="${x + 2}" y="${H - padB - 3}" width="${bw - 4}" height="3" rx="1.5" fill="rgba(139,147,176,0.25)"><title>${d.day}: 0</title></rect>`;
    }
    if (d.day === 1 || d.day % 5 === 0) {
      labels += `<text class="axis" x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${d.day}</text>`;
    }
  });

  const grid = [0.25, 0.5, 0.75, 1].map(f => {
    const y = H - padB - f * (H - padB - padT);
    return `<line x1="${padL}" y1="${y}" x2="${W}" y2="${y}" stroke="rgba(139,147,176,0.12)" stroke-width="1"/>
            <text class="axis" x="${padL - 6}" y="${y + 3}" text-anchor="end">${Math.round(max * f)}</text>`;
  }).join('');

  $('#graph').innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#7c5cff"/>
          <stop offset="100%" stop-color="#38e8ff"/>
        </linearGradient>
      </defs>
      ${grid}
      <line x1="${padL}" y1="${H - padB}" x2="${W}" y2="${H - padB}" stroke="rgba(139,147,176,0.3)" stroke-width="1"/>
      ${bars}
      ${labels}
    </svg>`;
}

$('#prevMonth').addEventListener('click', () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  loadGraph();
});
$('#nextMonth').addEventListener('click', () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  loadGraph();
});

// ---------- quotes ----------
async function loadQuotes() {
  const { quotes, daily } = await api('/api/quotes');

  if (daily) {
    $('#dailyQuote').textContent = `“${daily.text}”`;
    $('#dailyQuoteAuthor').textContent = daily.author ? `— ${daily.author}` : '';
  }

  $('#quoteCount').textContent = quotes.length ? `${quotes.length} saved` : '';
  $('#emptyQuotes').classList.toggle('hidden', quotes.length > 0);

  const list = $('#quoteList');
  list.innerHTML = '';
  quotes.forEach(q => {
    const li = document.createElement('li');
    li.className = 'quote-item';
    li.innerHTML = `
      <span class="q-text">“${esc(q.text)}”</span>
      ${q.author ? `<span class="q-author">— ${esc(q.author)}</span>` : ''}
      <button class="task-del" aria-label="delete quote">🗑</button>
    `;
    li.querySelector('.task-del').addEventListener('click', async () => {
      try {
        await api(`/api/quotes/${q.id}`, { method: 'DELETE' });
        loadQuotes();
        toast('Quote removed');
      } catch (err) { toast(err.message); }
    });
    list.appendChild(li);
  });
}

$('#quoteForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/quotes', {
      method: 'POST',
      body: JSON.stringify({ text: $('#quoteText').value, author: $('#quoteAuthor').value }),
    });
    e.target.reset();
    toast('Quote added 💬');
    loadQuotes();
  } catch (err) { toast(err.message); }
});
