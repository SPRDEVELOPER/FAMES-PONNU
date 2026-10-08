# 🔥 ꜰʟᴀᴍᴇꜱ ʙᴏᴛ

A production-ready Telegram bot for the classic **FLAMES** relationship game.
Node.js · Telegraf · MongoDB · inline keyboards · anime artwork support · admin tools.

> ⚠️ Just a fun entertainment game, not a real relationship prediction.

## Features
- Deterministic FLAMES algorithm (same two names → always the same result), fully unit-tested
- Inline-keyboard UI, animated "calculating" messages, six unique result cards, share button
- Per-user stats, paginated leaderboard (shows first names only), game history in MongoDB
- Anti-spam: rate limit, game cooldown, atomic state (no double-submits), full input validation
- Admin: dashboard, users list, confirm-before-send broadcast, ban / unban
- Polling **and** webhook mode, `/health` endpoint, graceful shutdown, Docker support
- **All bot text and buttons are in small caps** (`ꜱᴍᴀʟʟ ᴄᴀᴘꜱ`)

### About the small-caps font
Every message, button, and command *description* is rendered in Unicode small caps by `src/utils/smallcaps.js`.
Telegram itself only allows **lowercase ASCII** command names (`/start`, `/flames` …), so the commands
you type stay normal; their descriptions in the "/" menu are small caps.

## Project structure
```
flames-bot/
├── src/
│   ├── index.js            # entry: DB, bot, polling/webhook, health server
│   ├── bot/                # bot factory + middleware (spam, bans, errors)
│   ├── commands/           # user.js, admin.js
│   ├── handlers/           # buttons, text input, screens (photo/text), views
│   ├── games/              # flames.js (pure logic), results.js, session.js
│   ├── database/           # mongoose models + userService
│   ├── utils/              # smallcaps, validate, ui (all messages), logger
│   └── config/             # env config, image loader
├── test/                   # automated tests (node:test)
├── assets/                 # put your anime-girl pictures here (see assets/README.md)
├── .env.example  Dockerfile  docker-compose.yml  render.yaml
└── package.json
```

## Commands
| Command | What it does |
|---|---|
| `/start` | welcome + main menu |
| `/help` | how to play |
| `/flames` | start a game |
| `/result` | latest result |
| `/stats` | your stats |
| `/leaderboard` | top players |
| `/cancel` | cancel current game |
| `/admin` | dashboard (admin) |
| `/stats all` | dashboard (admin) |
| `/users [page]` | list users (admin) |
| `/broadcast <text>` | preview → confirm → send to all (admin) |
| `/ban <id>` · `/unban <id>` | moderation (admin) |

## Configuration (`.env`)
```
BOT_TOKEN=            # from @BotFather
MONGODB_URI=          # MongoDB Atlas or local
ADMIN_ID=             # your Telegram numeric ID (comma-separate several). Get it from @userinfobot
BOT_USERNAME=         # optional, without @ (auto-detected otherwise)
WEBHOOK_URL=          # empty = polling; https URL = webhook
```
Optional: `WEBHOOK_SECRET`, `PORT`, `GAME_COOLDOWN_SECONDS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SECONDS`, `IMG_*`.
The token is read **only** from the environment.

## 1 · Local development
```bash
git clone <your-repo-url> flames-bot && cd flames-bot
npm install
cp .env.example .env        # fill BOT_TOKEN, MONGODB_URI, ADMIN_ID
npm run dev                 # polling mode
npm test                    # run the tests
```
Free MongoDB: create a cluster on **MongoDB Atlas**, allow your IP (or 0.0.0.0/0 for cloud hosts),
copy the connection string into `MONGODB_URI`.

## 2 · GitHub
```bash
git init && git add . && git commit -m "FLAMES bot"
git branch -M main
git remote add origin https://github.com/<you>/flames-bot.git
git push -u origin main
```
`.env` is git-ignored — never commit your token.

## 3 · Render (free web service)
1. Render → **New → Blueprint** (uses `render.yaml`) or **New → Web Service** → connect the repo.
2. Build: `npm install` · Start: `npm start` · Health check path: `/health`.
3. Add env vars: `BOT_TOKEN`, `MONGODB_URI`, `ADMIN_ID`, `BOT_USERNAME`.
4. For webhook mode set `WEBHOOK_URL=https://<your-service>.onrender.com`.
   (Free services sleep when idle; webhook mode wakes them on the next message. Polling mode will stay asleep.)

## 4 · Railway
1. **New Project → Deploy from GitHub repo** (the Dockerfile is detected automatically).
2. Add the same variables. Railway sets `PORT` for you.
3. Webhook mode: **Settings → Networking → Generate Domain**, then `WEBHOOK_URL=https://<domain>`.
   Or leave `WEBHOOK_URL` empty to use polling.

## 5 · Docker
```bash
# bot + local MongoDB in one go
cp .env.example .env            # fill BOT_TOKEN, ADMIN_ID (MONGODB_URI is overridden by compose)
docker compose up -d --build
docker compose logs -f bot

# or only the bot image with your own MongoDB
docker build -t flames-bot .
docker run -d --env-file .env -p 3000:3000 --name flames-bot flames-bot
```

## Polling vs webhook
- **Polling** (`WEBHOOK_URL` empty): easiest, works anywhere, including your laptop.
- **Webhook** (`WEBHOOK_URL=https://…`): the bot registers `…/webhook` with Telegram and verifies Telegram's secret header.
  Needs a public HTTPS URL.

## FLAMES algorithm
1. lowercase both names, keep letters only
2. cancel matching letters one-for-one (`aab` vs `ab` leaves one `a`)
3. count = unmatched letters of both names
4. circular elimination over `F L A M E S` using that count until one letter remains
5. count `0` (identical letters) resolves to **F** — documented design choice

Compatibility % is derived from a hash of the two names (order-independent) within a range per result — consistent, never random.

## Database
- `users`: telegramId, username, firstName, totalGames, per-result counters, state, banned, timestamps
- `games`: telegramId, player1, player2, result, percent, createdAt

Private data (IDs, usernames) is never shown publicly — the leaderboard shows first names only; IDs are visible only to admins via `/users`.

## Notes
- "Games Today" in the dashboard uses the server's timezone (UTC on most hosts).
- Telegram caption limit is 1024 chars; every result card is far below it.
