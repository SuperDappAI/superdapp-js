import 'dotenv/config';
import { WebhookAgent } from '../../src';

async function main() {
  // Create a webhook-based agent
  const agent = new WebhookAgent({
    port: 4000,
    secret: process.env.WEBHOOK_SECRET,
    onInit: async () => console.log('[Agent] Initializing...'),
    onReady: async () => console.log('[Agent] Ready and listening!'),
    onShutdown: async () => console.log('[Agent] Shutting down...'),
  });

  // Register commands
  agent.addCommand('/start', async (event, req, res) => {
    res.writeHead(200);
    res.end('Hello! Webhook agent started.');
  });

  agent.addCommand('/ping', async (event, req, res) => {
    res.writeHead(200);
    res.end('Pong! 🏓');
  });

  // Register a generic message handler
  agent.onMessage(async (event, req, res) => {
    res.writeHead(200);
    res.end('Received your message!');
  });

  // Start the webhook server
  await agent.start();
}

main();
