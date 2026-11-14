# 🌌 FocusFlow

**FocusFlow** is a dark-themed study planner built for students. Plan tasks, crush checklists, watch your monthly progress graph grow, keep streaks alive, and get hit with a fresh motivational quote every single day.

> Built to feel *unique* — glowing nebulas, aurora gradients, glass panels, and a flow that makes productivity genuinely addictive.

---

## ✨ Features

- 🌑 **Dark, cinematic UI** — deep-space background, aurora gradient accents, glassmorphism cards
- ✅ **Smart Checklists** — add tasks with title, description, subject, and priority; mark complete with one click
- 📊 **Monthly Progress Graph** — interactive chart tracking completed tasks per day
- 🔥 **Streak Tracker** — daily streak + best streak, resets if you miss a day
- 💬 **Personal Quote Vault** — add as many motivational quotes as you want; one shows up automatically each day (changes daily)
- 🔐 **Login / Logout** — secure sessions with cookies, bcrypt password hashing
- 🐙 **GitHub OAuth login** — sign in with your GitHub account
- 🗄️ **SQLite database** — safe, file-based data storage; zero cost
- 📱 **Fully responsive** — works on phone, tablet, desktop

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, better-sqlite3 |
| Auth | bcryptjs + express-session + GitHub OAuth |
| Frontend | Vanilla JS + HTML/CSS (no build step) |
| Charts | Custom SVG (zero dependencies) |
| DB | SQLite (file-based, free forever) |

---
## 🚀 Quick Start (Local)

```bash
# 1. Clone the repository
git clone https://github.com/venkatchaitanya7/Focusflow.git
cd Focusflow

# 2. Install dependencies
npm install

# 3. Run the app
npm start

# 4. Open your browser
# http://localhost:3000
```

db.sqlite3 is auto-created with all tables on first run.

---

## 🔑 Setting up GitHub Login (free)

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers) → **New OAuth App**
2. Fill in:
   - **Application name:** FocusFlow
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/auth/github/callback`
3. After creation, click **Generate a new client secret**
4. Create a file `.env` in the project root with:

```env
SESSION_SECRET=some-long-random-string
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
PORT=3000
```

5. Restart the app. You'll see the **Sign in with GitHub** button working.

> ⚠️ Keep `.env` and `db.sqlite3` out of git (already in `.gitignore`).

---

## ☁️ Deploy (Free Options)

FocusFlow is a single Node app. Any Node host works:

- **Render.com** — free tier: New Web Service → connect the FocusFlow repo → Build: `npm install` → Start: `npm start`. Add `SESSION_SECRET` in the Environment tab.
- **Railway** — connect repo, done.
- **Fly.io** — `fly launch` from repo root.
- **GitHub OAuth note:** set the OAuth App's callback URL to `https://your-deployed-url/auth/github/callback`.

> SQLite is file-based; on platforms that wipe disk between deploys (like Render free tier), use Neon/Supabase (both free Postgres) or attach a persistent disk. Free SQLite-on-disk deployment works great on Railway/Fly/your own VPS.

---

## 📜 License

MIT — do whatever you want, just keep the credit.

---

## 🙌 Author

**venkatchaitanya7** — built with FocusFlow, using FocusFlow 😄
