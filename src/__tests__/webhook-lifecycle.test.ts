import { WebhookAgent } from '../webhook/agent';
import http from 'http';

describe('WebhookAgent lifecycle', () => {
  let agent: WebhookAgent;
  let port = 5051;

  afterAll(async () => {
    if (agent) await agent.shutdown();
  });

  it('should call lifecycle hooks', async () => {
    let inited = false,
      ready = false,
      shutdown = false;
    let readyPromise: Promise<void>;
    let readyResolve: () => void;
    readyPromise = new Promise((resolve) => {
      readyResolve = resolve;
    });
    agent = new WebhookAgent({
      port,
      onInit: async () => {
        inited = true;
      },
      onReady: async () => {
        ready = true;
        readyResolve();
      },
      onShutdown: async () => {
        shutdown = true;
      },
    });
    await agent.start();
    await readyPromise;
    expect(inited).toBe(true);
    expect(ready).toBe(true);
    await agent.shutdown();
    expect(shutdown).toBe(true);
  });
});
