# Public tunneling for local webhooks (ngrok)

Use ngrok to expose your local webhook server to the internet so SuperDapp can deliver events to your agent while developing locally.

## Prerequisites
- A running local server (examples use Express and listen on PORT from .env)
- An ngrok account and auth token (free tier works)

## One-time ngrok setup
```bash
# Install ngrok CLI (Linux)
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Or use npx (no install)
# npx ngrok config add-authtoken <YOUR_TOKEN>

# Set your auth token
ngrok config add-authtoken <YOUR_TOKEN>
```

## Start your local agent
```bash
# In the example folder
cp .env.example .env   # if available, then edit PORT/API_TOKEN
npm run dev
```
Ensure your health endpoint responds, e.g. http://localhost:3000/health.

## Start ngrok tunnel
```bash
# Tunnel your local port (replace 3000 with your PORT)
ngrok http 3000 --log=stdout
```
ngrok will print a forwarding URL like:
```
Forwarding                    https://<random>.ngrok.io -> http://localhost:3000
```

Use this public URL as your webhook base, e.g.:
- Webhook: https://<random>.ngrok.io/webhook
- Health:  https://<random>.ngrok.io/health

Set this Webhook URL in your SuperDapp dev/test admin where you configure your agent/bot.

## Scripts (optional)
Both examples include convenience scripts:
- `npm run tunnel` – starts ngrok on PORT
- `npm run dev:tunnel` – starts the local server and ngrok, and waits for health before starting the tunnel

Note: If your server auto-selects another free port, make sure PORT in your `.env` matches the ngrok port, or stop the other process to keep your preferred port free.

## Alternatives
- Cloudflared: `cloudflared tunnel --url http://localhost:3000`
- Localtunnel: `npx localtunnel --port 3000`

## Troubleshooting
- 502/504 from ngrok: verify your local server is up and health endpoint works
- Wrong port: align PORT in `.env` and ngrok command
- Authentication error: run `ngrok config add-authtoken <TOKEN>` again
