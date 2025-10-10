# Super Group Starter (Cloudflare‑ready)

A vibrant, Cloudflare Workers example that lets you build a social, group‑aware agent in minutes. It supports admin setup over DM, group interaction commands, D1 persistence, and a scheduled cron task.

This project is Cloudflare‑only (no Express server). The Worker source lives at `src/worker.ts`.

## Features

- Admin DM commands: `/start`, `/help`, `/setup`, `/announce <text>`, `/groups`
- Public group commands: `/hello`, `/faq`, `/ask <q>`, `/image`, `/joke`
- Cloudflare Workers + D1: group configuration persisted to `group_configs`
- Scheduler: cron every 15 minutes posts an image and a joke to connected groups
- Clean message routing: correct handling of channel vs. connection messages

## Get started

1) Install dependencies

```bash
cd examples/super-group-starter
npm install
```

2) Configure dev variables (wrangler will load `.dev.vars`)

```bash
cp .dev.vars.example .dev.vars
# edit API_TOKEN and optional API_BASE_URL
```

3) Create a D1 database (once)

```bash
wrangler d1 create super-group-starter-db
```

Update `wrangler.toml` or `wrangler.dev.toml` with the `database_id` under `[[d1_databases]]`.

4) Run locally

```bash
npm run dev:wrangler
  # Your local Worker runs on http://localhost:8788; webhook path is /webhook
  # Example: http://localhost:8788/webhook
```

Optional: open a tunnel for webhooks (set `NGROK_DOMAIN` for a static domain)

```bash
npm run dev:wrangler:tunnel
# or static
npm run dev:wrangler:tunnel:static
Note: Miniflare (used by wrangler dev) doesn't automatically trigger cron locally. To test the scheduled task, hit `/webhook` or deploy and wait for the cron.
```

5) Deploy

```bash
wrangler secret put API_TOKEN
npm run deploy
```

## D1 schema

File: `migrations/001_group_configs.sql`

```sql
CREATE TABLE IF NOT EXISTS group_configs (
  owner_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_group_configs_channel_id ON group_configs(channel_id);
```

Worker runs a minimal migration on first use (safe to re‑run). You can also execute migrations explicitly:

```bash
wrangler d1 execute super-group-starter-db --file=./migrations/001_group_configs.sql --local
```

## Commands (overview)

Admin DM:

- `/start` — welcome and instructions
- `/help` — help menu
- `/setup` — choose a group to connect (joins via API and persists to D1)
- `/announce <text>` — send announcement to the connected group
- `/groups` — list groups you own/admin

Public (in group):

- `/hello` — greet the group
- `/faq` — quick FAQ
- `/ask <q>` — demo answer
- `/image` — yes/no GIF via yesno.wtf (renders inline)
- `/joke` — random joke

## Wrangler configuration

Key bits from `wrangler.toml`:

- `main = "src/worker.ts"`
- `compatibility_flags = ["nodejs_compat"]`
- `[[d1_databases]]` with binding `DB`
- `crons = ["*/15 * * * *"]`

Set secrets before deploy:

```bash
wrangler secret put API_TOKEN
# Optionally set API_BASE_URL via [vars] or secrets
```

## Notes

- The Worker distinguishes DM vs. channel messages and applies admin/public commands accordingly.
- For clarity, only a small set of commands are included; extend freely.
- Keep secrets out of git. Use `.dev.vars` locally and `wrangler secret` in remote.
