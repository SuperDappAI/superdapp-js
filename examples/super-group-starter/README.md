# Super Group Starter
A vibrant, fun, and production-flavored example that showcases admin setup via DM, public group commands (including API calls), Cloudflare Worker + D1 persistence, and scheduled content.

This example shows a complete, minimal agent that supports:

- 1-2-1 admin DM (Connection) for private setup and owner/admin commands
- Joining a Super Group (Channel) you own/administer via /setup
- A public command set that anyone in the Super Group can use
- Cloudflare Workers ready entry (wrangler) and a Node local webhook server

The example agent theme is a simple Community Announcer that lets an owner set up a channel, announce updates, and lets members ask questions.

## Features

- Admin DM commands: /start, /help, /setup, /announce, /groups
- Public group commands: /hello, /faq, /ask <question>
- /setup command lets the owner/admin choose a group to connect the agent to. The agent will join that group and store the selection in memory for the session (simple demo).
- Cloudflare Worker handler at src/worker.ts and local Node server at index.ts

## Quick Start (Local Webhook)

1) Install deps and copy env

```
cd examples/super-group-starter
npm install
cp .env.example .env
```

2) Configure .env

```
API_TOKEN=your_superdapp_token
API_BASE_URL=https://api.superdapp.ai
PORT=3002
```

3) Run locally

```
npm run dev
# optional: open a tunnel for webhook
npm run dev:tunnel
You can run a tunnel in two ways:

- Random URL each run (default):

```
npm run dev:tunnel
```

- Static domain (for accounts with a fixed domain). Set NGROK_DOMAIN and run:

```
export NGROK_DOMAIN=your-name.ngrok-free.app
npm run dev:tunnel:static
```

```

Set your bot webhook URL to http://localhost:3002/webhook or the ngrok https URL shown.

## Cloudflare Workers

- Requires wrangler installed and configured
- Edit wrangler.toml if needed

Dev server:

```
npm run dev:wrangler
```

Deploy:

```
npm run deploy
```

Environment variables for Workers should be bound via wrangler secrets or [vars] in wrangler.toml (do not commit secrets).

## Commands

Admin DM (connection) commands:

- /start — Welcome and instructions
- /help — Show help
- /setup — List your owned/admin groups, choose one, and join it
- /announce <text> — Send an announcement to the configured group
- /groups — Show your groups we can post to

Public group commands:

## Cloudflare D1 (Group persistence)

This example stores the selected group per owner/admin in a Cloudflare D1 table group_configs. Migrations run automatically in the Worker on first use, and the scheduled job uses the table to broadcast content.

Schema (migrations/001_group_configs.sql):

```
CREATE TABLE IF NOT EXISTS group_configs (
  owner_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_group_configs_channel_id ON group_configs(channel_id);
```

To bind a D1 database locally and in production, update wrangler.toml accordingly (see below). Use wrangler d1 create to create a database and fill in the database_id. For local dev, wrangler will use your .env and a local D1 instance.

## Cloudflare Scheduler

This Worker registers a cron trigger every 15 minutes (wrangler.toml [triggers]) to fetch a yes/no image and a random joke, then post them to every configured channel found in group_configs. This lets developers see how to push periodic content without an external scheduler.

## Wrangler configuration

wrangler.toml is set to:

- main = src/worker.ts
- nodejs_compat flag enabled
- [triggers] crons = ["*/15 * * * *"]
- You must bind D1 in your local or environment-specific config, e.g.:

```
[[d1_databases]]
# The binding name your Worker will use (env.DB)
binding = "DB"
database_name = "super-group-starter-db"
database_id = "<YOUR_DATABASE_ID>"
```

Set secrets:

```
wrangler secret put API_TOKEN
# optionally set API_BASE_URL via [vars] or secrets
```

- /hello — Bot greets the group
- /faq — Shows simple FAQ
- /ask <question> — Echo-style Q&A demo for members
- /image — Fetch a random yes/no GIF (https://yesno.wtf/api)
- /joke — Fetch a random joke (https://official-joke-api.appspot.com/random_joke)

## Notes

- This example persists the chosen group in memory for the running process. For production, store it in a database keyed by admin/owner ID.
- The SDK’s SuperDappAgent automatically distinguishes between connection and channel messages. We route admin commands only in DM by checking message type and sender.
- The worker is intentionally minimal for clarity.



## Vibrant responses

## D1 setup and migrations

This example persists the selected group per owner/admin in a Cloudflare D1 database. You can run it locally via wrangler dev and remotely via wrangler deploy. The Worker runs a minimal migration on startup; you can also apply migrations using wrangler CLI.

1) Create the D1 database (once):

```
wrangler d1 create super-group-starter-db
```

Take note of the database_id and set it in wrangler.toml under [[d1_databases]].

2) Bind the database in wrangler.toml:

```
[[d1_databases]]
binding = "DB"
database_name = "super-group-starter-db"
database_id = "<YOUR_DATABASE_ID>"
```

3) Local development (wrangler dev):

- Use .dev.vars (or .dev.vars.example -> .dev.vars) for environment variables that wrangler loads in dev.
- Run:

```
cp .dev.vars.example .dev.vars
# edit API_TOKEN and optional API_BASE_URL
wrangler dev
```

During dev, the Worker runs the D1 migration automatically on first use. To explicitly execute the SQL in migrations (optional):

```
wrangler d1 execute super-group-starter-db --file=./migrations/001_group_configs.sql --local
```

4) Remote (preview/production):

- Ensure secrets are set:

```
wrangler secret put API_TOKEN
# optionally set API_BASE_URL as a secret or [vars]
```

- Deploy:

```
wrangler deploy
```

- Execute migrations remotely (optional; startup migrations are already built-in):

```
wrangler d1 execute super-group-starter-db --file=./migrations/001_group_configs.sql
```

5) Verifying the DB:

- Inspect tables:

```
wrangler d1 execute super-group-starter-db --command='SELECT * FROM group_configs;' --local
```

- In production (remove --local):

```
wrangler d1 execute super-group-starter-db --command='SELECT * FROM group_configs;'
```

Notes:
- The Worker includes a simple runMigrations that ensures the group_configs table and index exist. Using explicit migrations via wrangler d1 execute helps keep schema in sync across environments.
- Keep secrets out of git. Use .dev.vars locally and wrangler secret put for remote.

The example uses emojis and friendly wording in help menus and replies to make it more engaging:

- 🎉 Welcome and quick start
- 🧭 Help with sections for Admin vs. Public commands
- 🎛️ Setup prompts with inline buttons
- 📣 Announcements, 🎲 random image answers, 😂 jokes, and more
