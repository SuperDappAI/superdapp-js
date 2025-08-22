import { WebhookAgent } from '../webhook/agent';

describe('WebhookAgent command dispatch', () => {
  let agent: WebhookAgent;

  it('should dispatch registered command', async () => {
    agent = new WebhookAgent();
    let called = false;

    agent.addCommand('/test', async (event) => {
      called = true;
      expect(event.body).toBeDefined();
    });

    const testBody = {
      id: 'test-message-id',
      senderId: 'test-sender-id',
      body: {
        t: 'chat' as const,
        m: {
          text: '/test',
          body: '/test',
        },
      },
      timestamp: new Date().toISOString(),
      isBot: false,
    };

    await agent.processRequest(testBody);
    expect(called).toBe(true);
  });

  it('should handle callback queries', async () => {
    agent = new WebhookAgent();
    let callbackHandled = false;

    agent.addCommand('callback_query', async (event) => {
      callbackHandled = true;
      expect(event.body).toBeDefined();
    });

    const testBody = {
      id: 'test-message-id-2',
      senderId: 'test-sender-id-2',
      body: {
        t: 'chat' as const,
        m: {
          body: {
            callback_query: 'test:data',
          },
        },
      },
      timestamp: new Date().toISOString(),
      isBot: false,
    };

    await agent.processRequest(testBody);
    expect(callbackHandled).toBe(true);
  });
});
