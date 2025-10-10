# Super Group Starter Agent (Cloudflare ready)

We just shipped a brand‑new “Super Group Starter” agent example in `[superdapp-js/examples](https://github.com/SuperDappAI/superdapp-js/tree/releases/v1.1.0/examples/super-group-starter)` — a vibrant, Cloudflare‑ready template that lets builders go from zero to a social, group‑aware agent in minutes.

## What it does

- One‑to‑one admin setup: In a DM with the agent, use `/setup` to list your owned/admin super groups and connect the agent to one or more groups. It auto‑posts a welcome announcement once connected.
- Group interactions: Members in the super group can talk to the agent directly. Public commands include `/image` (yes/no GIF via yesno.wtf) and `/joke` (random joke via official‑joke‑api). There’s also a friendly `/help` menu with emojis to guide users.
- Cloudflare Workers + D1: Fully deployable as a Worker, with group configuration persisted in a D1 database. We include a groups table, SQL migration, and clear README instructions for local and remote migrations.
- Scheduler: A Worker cron triggers every 15 minutes so the agent can auto‑post content (e.g., jokes/images) to the connected group(s) without manual input.
- Clean routing: The example shows both admin/DM commands (setup, list groups, announce) and public/group commands, with correct channel vs. connection message handling.
- Tunnels for local dev: Support for both existing tunnel flow and a static ngrok domain script, so you can run locally the way that suits your workflow.
- Developer‑first docs: README covers D1 setup, migrations, `wrangler.dev.toml` usage, `.dev.vars.example` for local envs, and how to run both Node local server and Cloudflare Worker.

## Why it matters

This is the example we were missing: a production‑flavored template that joins an agent to a super group, persists config in a real database, supports scheduled posts, and separates admin vs. public command sets. It gives developers a robust starting point and better building blocks to ship their own agents faster.
