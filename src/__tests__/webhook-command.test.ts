import { WebhookAgent } from '../webhook/agent';
// @ts-ignore
if (!globalThis.fetch) globalThis.fetch = require('node-fetch');

describe('WebhookAgent command dispatch', () => {
  let agent: WebhookAgent;
  const port = 5052;

  afterAll(async () => {
    if (agent) await agent.shutdown();
  });

  it('should dispatch registered command', async () => {
    agent = new WebhookAgent({ port });
    let called = false;
    agent.addCommand('/test', async (event, req, res) => {
      called = true;
      res.writeHead(200);
      res.end('ok');
    });
    await agent.start();
    const res = await fetch(`http://localhost:${port}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'chat', body: { m: { body: '/test' } } }),
    });
    const text = await res.text();
    expect(text).toBe('ok');
    expect(called).toBe(true);
  });
});
