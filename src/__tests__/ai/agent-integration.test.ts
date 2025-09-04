import { SuperDappAgent } from '../../core/agent';
import { BotConfig } from '../../types';

// Mock the AI client module
jest.mock('../../ai/client', () => ({
  generateText: jest.fn().mockResolvedValue('Generated AI response'),
  streamText: jest.fn().mockResolvedValue(
    (async function* () {
      yield 'chunk1';
      yield 'chunk2';
    })()
  ),
  runAgent: jest.fn().mockResolvedValue({ outputText: 'Agent response' }),
}));

describe('SuperDappAgent AI Integration', () => {
  const baseConfig: BotConfig = {
    apiToken: 'test-token',
    baseUrl: 'https://api.test.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with AI configuration', () => {
    it('should provide AI client when configured', async () => {
      const configWithAI: BotConfig = {
        ...baseConfig,
        ai: {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: 'sk-test123',
        },
      };

      const agent = new SuperDappAgent(configWithAI);
      const aiClient = await agent.getAiClient();

      expect(aiClient).toBeDefined();
      expect(typeof aiClient.generateText).toBe('function');
      expect(typeof aiClient.streamText).toBe('function');
      expect(typeof aiClient.runAgent).toBe('function');
    });

    it('should call generateText through AI client', async () => {
      const configWithAI: BotConfig = {
        ...baseConfig,
        ai: {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: 'sk-test123',
        },
      };

      const agent = new SuperDappAgent(configWithAI);
      const aiClient = await agent.getAiClient();

      const result = await aiClient.generateText('Hello, AI!');
      expect(result).toBe('Generated AI response');

      // Verify the mock was called with the right arguments
      const aiClientModule = jest.requireMock('../../ai/client');
      expect(aiClientModule.generateText).toHaveBeenCalledWith('Hello, AI!', {
        config: configWithAI.ai,
      });
    });

    it('should call streamText through AI client', async () => {
      const configWithAI: BotConfig = {
        ...baseConfig,
        ai: {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: 'sk-test123',
        },
      };

      const agent = new SuperDappAgent(configWithAI);
      const aiClient = await agent.getAiClient();

      const messages = [{ role: 'user' as const, content: 'Tell me a story' }];
      const stream = await aiClient.streamText(messages);

      const chunks: string[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['chunk1', 'chunk2']);

      // Verify the mock was called with the right arguments
      const aiClientModule = jest.requireMock('../../ai/client');
      expect(aiClientModule.streamText).toHaveBeenCalledWith(messages, {
        config: configWithAI.ai,
      });
    });

    it('should call runAgent through AI client', async () => {
      const configWithAI: BotConfig = {
        ...baseConfig,
        ai: {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: 'sk-test123',
        },
      };

      const agent = new SuperDappAgent(configWithAI);
      const aiClient = await agent.getAiClient();

      const options = {
        instructions: 'You are a helpful assistant',
        messages: [{ role: 'user' as const, content: 'Help me code' }],
      };

      const result = await aiClient.runAgent(options);
      expect(result).toEqual({ outputText: 'Agent response' });

      // Verify the mock was called with the right arguments
      const aiClientModule = jest.requireMock('../../ai/client');
      expect(aiClientModule.runAgent).toHaveBeenCalledWith({
        ...options,
        config: configWithAI.ai,
      });
    });

    it('should use AI client in command handler', async () => {
      const configWithAI: BotConfig = {
        ...baseConfig,
        ai: {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: 'sk-test123',
        },
      };

      const agent = new SuperDappAgent(configWithAI);

      // Add a command that uses AI
      agent.addCommand('/ask', async ({ message, roomId }) => {
        const aiClient = await agent.getAiClient();

        // Handle different message body formats
        let prompt = 'Hello';
        if (typeof message.body.m === 'object' && message.body.m?.body) {
          const bodyContent =
            typeof message.body.m.body === 'string'
              ? message.body.m.body
              : message.body.m.body;
          if (typeof bodyContent === 'string') {
            prompt = bodyContent.split(' ').slice(1).join(' ') || 'Hello';
          }
        } else if (typeof message.body.m === 'string') {
          prompt = message.body.m.split(' ').slice(1).join(' ') || 'Hello';
        }

        const response = await aiClient.generateText(prompt);
        await agent.sendConnectionMessage(roomId, response);
      });

      // Verify the command was added
      const commands = agent.getCommands();
      expect(commands).toContain('/ask');
    });

    it('should lazy load AI client on first access', async () => {
      const configWithAI: BotConfig = {
        ...baseConfig,
        ai: {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: 'sk-test123',
        },
      };

      const agent = new SuperDappAgent(configWithAI);

      // First call should create the client
      const aiClient1 = await agent.getAiClient();
      // Second call should return the same instance
      const aiClient2 = await agent.getAiClient();

      expect(aiClient1).toBe(aiClient2);
    });
  });

  describe('without AI configuration', () => {
    it('should throw clear error when AI not configured', async () => {
      const agent = new SuperDappAgent(baseConfig);

      await expect(agent.getAiClient()).rejects.toThrow(
        'AI is not configured for this agent. Please provide ai configuration in BotConfig to use AI features.'
      );
    });

    it('should work normally without AI configuration', () => {
      const agent = new SuperDappAgent(baseConfig);

      // Basic agent functionality should still work
      agent.addCommand('/ping', async ({ roomId }) => {
        await agent.sendConnectionMessage(roomId, 'Pong!');
      });

      const commands = agent.getCommands();
      expect(commands).toContain('/ping');

      // Should be able to get the regular client
      const client = agent.getClient();
      expect(client).toBeDefined();
    });
  });
});
