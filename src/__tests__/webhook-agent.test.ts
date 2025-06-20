import { WebhookAgent } from '../webhook/agent';
// @ts-ignore
if (!globalThis.fetch) globalThis.fetch = require('node-fetch');
import http from 'http';

describe('WebhookAgent', () => {
  let agent: WebhookAgent;
  let server: http.Server;

  beforeAll(async () => {
    agent = new WebhookAgent({ port: 5050 });
    agent.addCommand('/test', async (event, req, res) => {
      res.writeHead(200);
      res.end('Test command received');
    });
    agent.onMessage(async (event, req, res) => {
      res.writeHead(200);
      res.end('Generic message received');
    });
    await agent.start();
    // @ts-ignore
    server = agent.server?.server;
  });

  afterAll(async () => {
    await agent.shutdown();
  });

  it('should respond to a registered command', async () => {
    const res = await fetch('http://localhost:5050/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'chat', body: { m: { body: '/test' } } }),
    });
    const text = await res.text();
    expect(text).toBe('Test command received');
  });

  it('should respond to a generic message', async () => {
    const res = await fetch('http://localhost:5050/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'chat', body: { m: { body: 'hello' } } }),
    });
    const text = await res.text();
    expect(text).toBe('Generic message received');
  });
});
