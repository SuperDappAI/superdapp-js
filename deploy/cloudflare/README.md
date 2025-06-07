# Cloudflare Workers Deployment

This directory contains configuration for deploying SuperDapp agents to Cloudflare Workers.

## Setup

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Set your secrets:
   ```bash
   wrangler secret put API_TOKEN
   wrangler secret put API_BASE_URL
   ```

## Deployment

Deploy to staging:
```bash
npm run deploy:staging
```

Deploy to production:
```bash
npm run deploy:production
```

## Configuration

Edit `wrangler.toml` to customize:
- Worker name
- Environment variables
- Resource limits
- Durable Objects (for stateful agents)

## Monitoring

View logs:
```bash
wrangler tail
```

View analytics:
```bash
wrangler pages deployment list
```
