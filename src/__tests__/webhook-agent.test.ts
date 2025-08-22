import { WebhookAgent } from '../webhook/agent';

describe('WebhookAgent', () => {
  let agent: WebhookAgent;

  beforeEach(() => {
    agent = new WebhookAgent();
  });

  it('should respond to a registered command', async () => {
    let commandHandled = false;

    agent.addCommand('/test', async (event) => {
      commandHandled = true;
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
    expect(commandHandled).toBe(true);
  });

  it('should respond to a generic message', async () => {
    let messageHandled = false;

    agent.onMessage(async (event) => {
      messageHandled = true;
      expect(event.body).toBeDefined();
    });

    const testBody = {
      id: 'test-message-id-2',
      senderId: 'test-sender-id-2',
      body: {
        t: 'chat' as const,
        m: {
          text: 'hello',
          body: 'hello',
        },
      },
      timestamp: new Date().toISOString(),
      isBot: false,
    };

    await agent.processRequest(testBody);
    expect(messageHandled).toBe(true);
  });

  it('should handle multiple commands', async () => {
    let command1Handled = false;
    let command2Handled = false;

    agent.addCommand('/test1', async () => {
      command1Handled = true;
    });

    agent.addCommand('/test2', async () => {
      command2Handled = true;
    });

    const testBody1 = {
      id: 'test-message-id-3',
      senderId: 'test-sender-id-3',
      body: {
        t: 'chat' as const,
        m: {
          text: '/test1',
          body: '/test1',
        },
      },
      timestamp: new Date().toISOString(),
      isBot: false,
    };

    const testBody2 = {
      id: 'test-message-id-4',
      senderId: 'test-sender-id-4',
      body: {
        t: 'chat' as const,
        m: {
          text: '/test2',
          body: '/test2',
        },
      },
      timestamp: new Date().toISOString(),
      isBot: false,
    };

    await agent.processRequest(testBody1);
    await agent.processRequest(testBody2);

    expect(command1Handled).toBe(true);
    expect(command2Handled).toBe(true);
  });
});
