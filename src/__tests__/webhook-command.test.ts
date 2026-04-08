import { WebhookAgent } from '../webhook/agent';
import { Message } from '../types';

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

  it('should dispatch command with arguments', async () => {
    agent = new WebhookAgent();
    let called = false;

    agent.addCommand('/test', async (event) => {
      called = true;
      if (typeof event.body.m === 'string') {
        expect(event.body.m).toBe('/test foo bar');
      } else {
        expect(event.body.m?.body).toBe('/test foo bar');
      }
    });

    const testBody = {
      id: 'test-message-id-args',
      senderId: 'test-sender-id-args',
      body: {
        t: 'chat' as const,
        m: {
          text: '/test foo bar',
          body: '/test foo bar',
        },
      },
      timestamp: new Date().toISOString(),
      isBot: false,
    };

    await agent.processRequest(testBody);
    expect(called).toBe(true);
  });

  it('should dispatch command when message body is nested object', async () => {
    agent = new WebhookAgent();
    let called = false;

    agent.addCommand('/test', async () => {
      called = true;
    });

    const testBody = {
      id: 'test-message-id-nested',
      senderId: 'test-sender-id-nested',
      body: {
        t: 'chat' as const,
        m: {
          body: {
            body: '/test with extra',
          },
        },
      },
      timestamp: new Date().toISOString(),
      isBot: false,
    } as unknown as Message;

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
