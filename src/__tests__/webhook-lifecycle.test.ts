import { WebhookAgent } from '../webhook/agent';

describe('WebhookAgent', () => {
  let agent: WebhookAgent;

  it('should process webhook requests', async () => {
    let messageReceived = false;

    agent = new WebhookAgent();

    agent.onMessage(async (event) => {
      messageReceived = true;
      expect(event.body).toBeDefined();
    });

    const testBody = {
      id: 'test-message-id',
      senderId: 'test-sender-id',
      body: {
        t: 'chat' as const,
        m: {
          text: 'Hello bot',
          body: 'Hello bot',
        },
      },
      timestamp: new Date().toISOString(),
      isBot: false,
    };

    await agent.processRequest(testBody);
    expect(messageReceived).toBe(true);
  });

  it('should handle commands', async () => {
    let commandHandled = false;

    agent = new WebhookAgent();

    agent.addCommand('test', async (event) => {
      commandHandled = true;
      expect(event.body).toBeDefined();
    });

    const testBody = {
      id: 'test-message-id-2',
      senderId: 'test-sender-id-2',
      body: {
        t: 'chat' as const,
        m: {
          text: 'test',
          body: 'test',
        },
      },
      timestamp: new Date().toISOString(),
      isBot: false,
    };

    await agent.processRequest(testBody);
    expect(commandHandled).toBe(true);
  });
});
