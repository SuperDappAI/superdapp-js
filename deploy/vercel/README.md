# Vercel Deployment

This directory contains configuration for deploying SuperDapp agents to Vercel.

## Setup

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Set environment variables:
   ```bash
   vercel env add API_TOKEN
   vercel env add API_BASE_URL
   ```

## Deployment

Deploy to preview:
```bash
vercel
```

Deploy to production:
```bash
vercel --prod
```

## Configuration

- `vercel.json`: Vercel configuration
- Environment variables are managed through Vercel dashboard or CLI

## Features

- Automatic HTTPS
- Global CDN
- Serverless functions
- Built-in monitoring
- Easy rollbacks

## Monitoring

View deployments:
```bash
vercel ls
```

View logs:
```bash
vercel logs [deployment-url]
```

View function analytics in Vercel dashboard.
