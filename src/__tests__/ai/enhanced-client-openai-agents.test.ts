import { 
  EnhancedAIClient, 
  createEnhancedAIClient,
  EnhancedAgentRunOptions 
} from '../../ai/enhanced-client';
import * as configModule from '../../ai/config';
import * as openaiAgentsProvider from '../../ai/providers/openai-agents';
import * as aiClient from '../../ai/client';

// Mock dependencies
jest.mock('../../ai/config');
jest.mock('../../ai/providers/openai-agents');
jest.mock('../../ai/client');

const mockConfigModule = configModule as jest.Mocked<typeof configModule>;
const mockIsOpenAIAgentsAvailable = openaiAgentsProvider.isOpenAIAgentsAvailable as jest.MockedFunction<typeof openaiAgentsProvider.isOpenAIAgentsAvailable>;
const mockRunOpenAIAgent = openaiAgentsProvider.runOpenAIAgent as jest.MockedFunction<typeof openaiAgentsProvider.runOpenAIAgent>;
const mockStreamOpenAIAgent = openaiAgentsProvider.streamOpenAIAgent as jest.MockedFunction<typeof openaiAgentsProvider.streamOpenAIAgent>;
const mockCreateOpenAIAgentOptions = openaiAgentsProvider.createOpenAIAgentOptions as jest.MockedFunction<typeof openaiAgentsProvider.createOpenAIAgentOptions>;
const mockGenerateText = aiClient.generateText as jest.MockedFunction<typeof aiClient.generateText>;

describe('Enhanced AI Client - OpenAI Agents Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockConfigModule.loadAIConfig.mockReturnValue({
      provider: 'openai',
      model: 'gpt-4',
      apiKey: 'sk-test',
    });

    (mockConfigModule as any).loadModel = jest.fn().mockResolvedValue('mock-model');
    mockIsOpenAIAgentsAvailable.mockResolvedValue(true);
    mockGenerateText.mockResolvedValue('Fallback response');
    
    mockCreateOpenAIAgentOptions.mockImplementation((config, model, options) => ({
      model,
      ...options,
    }));

    mockRunOpenAIAgent.mockResolvedValue({
      outputText: 'OpenAI Agent response',
      usage: { totalTokens: 100 },
      finishReason: 'stop',
    });

    // Mock streaming
    mockStreamOpenAIAgent.mockImplementation(async function* () {
      yield { type: 'text', data: { message: 'Streaming...' }, timestamp: new Date() };
      yield { type: 'text', data: { content: 'Stream response' }, timestamp: new Date() };
      yield { type: 'done', data: { completed: true }, timestamp: new Date() };
    });
  });

  describe('runEnhancedAgent with OpenAI Agents enabled', () => {
    it('should use OpenAI Agents SDK when enabled and available', async () => {
      const config = {
        provider: 'openai' as const,
        model: 'gpt-4',
        apiKey: 'sk-test',
        agents: {
          enabled: true,
        },
      };
      
      mockConfigModule.loadAIConfig.mockReturnValue(config);
      
      const client = new EnhancedAIClient(config);
      client.setTracing(true);

      const options: EnhancedAgentRunOptions = {
        instructions: 'Test instructions',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const result = await client.runEnhancedAgent(options);

      expect(result.outputText).toBe('OpenAI Agent response');
      expect(mockIsOpenAIAgentsAvailable).toHaveBeenCalled();
      expect(mockRunOpenAIAgent).toHaveBeenCalled();
      expect(mockGenerateText).not.toHaveBeenCalled();
      
      // Check tracing events
      const tracing = result.tracing;
      expect(tracing).toBeDefined();
      expect(tracing!.events.some(e => e.data && typeof e.data === 'object' && 'type' in e.data && e.data.type === 'using_openai_agents')).toBe(true);
    });

    it('should fallback to generateText when OpenAI Agents is not available', async () => {
      const config = {
        provider: 'openai' as const,
        model: 'gpt-4',
        apiKey: 'sk-test',
        agents: {
          enabled: true,
        },
      };
      
      mockConfigModule.loadAIConfig.mockReturnValue(config);
      mockIsOpenAIAgentsAvailable.mockResolvedValue(false);
      
      const client = new EnhancedAIClient(config);
      client.setTracing(true);

      const options: EnhancedAgentRunOptions = {
        instructions: 'Test instructions',
      };

      const result = await client.runEnhancedAgent(options);

      expect(result.outputText).toBe('Fallback response');
      expect(mockIsOpenAIAgentsAvailable).toHaveBeenCalled();
      expect(mockRunOpenAIAgent).not.toHaveBeenCalled();
      expect(mockGenerateText).toHaveBeenCalled();

      // Check tracing shows fallback
      const tracing = result.tracing;
      expect(tracing).toBeDefined();
      expect(tracing!.events.some(e => e.data && typeof e.data === 'object' && 'type' in e.data && e.data.type === 'fallback_to_generatetext')).toBe(true);
    });

    it('should fallback when OpenAI Agents throws NotAvailableError', async () => {
      const config = {
        provider: 'openai' as const,
        model: 'gpt-4',
        apiKey: 'sk-test',
        agents: {
          enabled: true,
        },
      };
      
      mockConfigModule.loadAIConfig.mockReturnValue(config);
      
      const notAvailableError = new openaiAgentsProvider.OpenAIAgentsNotAvailableError();
      notAvailableError.name = 'OpenAIAgentsNotAvailableError'; // Make sure the name property is set correctly
      mockRunOpenAIAgent.mockRejectedValue(notAvailableError);
      
      const client = new EnhancedAIClient(config);
      client.setTracing(true);

      const options: EnhancedAgentRunOptions = {
        instructions: 'Test instructions',
      };

      const result = await client.runEnhancedAgent(options);

      expect(result.outputText).toBe('Fallback response');
      expect(mockRunOpenAIAgent).toHaveBeenCalled();
      expect(mockGenerateText).toHaveBeenCalled();
    });

    it('should use generateText when agents are disabled', async () => {
      const config = {
        provider: 'openai' as const,
        model: 'gpt-4',
        apiKey: 'sk-test',
        agents: {
          enabled: false,
        },
      };
      
      mockConfigModule.loadAIConfig.mockReturnValue(config);
      
      const client = new EnhancedAIClient(config);
      client.setTracing(true);

      const options: EnhancedAgentRunOptions = {
        instructions: 'Test instructions',
      };

      const result = await client.runEnhancedAgent(options);

      expect(result.outputText).toBe('Fallback response');
      expect(mockIsOpenAIAgentsAvailable).not.toHaveBeenCalled();
      expect(mockRunOpenAIAgent).not.toHaveBeenCalled();
      expect(mockGenerateText).toHaveBeenCalled();

      // Check tracing shows basic path
      const tracing = result.tracing;
      expect(tracing).toBeDefined();
      expect(tracing!.events.some(e => e.data && typeof e.data === 'object' && 'type' in e.data && e.data.type === 'using_generatetext')).toBe(true);
    });

    it('should use generateText for non-OpenAI providers', async () => {
      const config = {
        provider: 'anthropic' as const,
        model: 'claude-3',
        apiKey: 'sk-test',
        agents: {
          enabled: true, // Even if enabled, non-OpenAI providers don't use Agents SDK
        },
      };
      
      mockConfigModule.loadAIConfig.mockReturnValue(config);
      
      const client = new EnhancedAIClient(config);
      client.setTracing(true);

      const options: EnhancedAgentRunOptions = {
        instructions: 'Test instructions',
      };

      const result = await client.runEnhancedAgent(options);

      expect(result.outputText).toBe('Fallback response');
      expect(mockIsOpenAIAgentsAvailable).not.toHaveBeenCalled();
      expect(mockRunOpenAIAgent).not.toHaveBeenCalled();
      expect(mockGenerateText).toHaveBeenCalled();
    });

    it('should pass usage information to tracing when available', async () => {
      const config = {
        provider: 'openai' as const,
        model: 'gpt-4',
        apiKey: 'sk-test',
        agents: {
          enabled: true,
        },
      };
      
      mockConfigModule.loadAIConfig.mockReturnValue(config);
      
      const client = new EnhancedAIClient(config);
      client.setTracing(true);

      const result = await client.runEnhancedAgent({
        instructions: 'Test instructions',
      });

      const tracing = result.tracing;
      expect(tracing).toBeDefined();
      expect(tracing!.events.some(e => 
        e.data && typeof e.data === 'object' && 'type' in e.data && e.data.type === 'usage_info' && 'usage' in e.data
      )).toBe(true);
    });
  });

  describe('streamAgentEvents with OpenAI Agents streaming', () => {
    it('should stream from OpenAI Agents when streaming is enabled', async () => {
      const config = {
        provider: 'openai' as const,
        model: 'gpt-4',
        apiKey: 'sk-test',
        agents: {
          enabled: true,
          streaming: true,
        },
      };
      
      mockConfigModule.loadAIConfig.mockReturnValue(config);
      
      const client = new EnhancedAIClient(config);

      const options: EnhancedAgentRunOptions = {
        instructions: 'Test streaming',
      };

      const events = [];
      for await (const event of client.streamAgentEvents(options)) {
        events.push(event);
      }

      expect(events).toHaveLength(4); // Start + 3 streamed events
      expect(events[0].data).toContain('OpenAI Agents streaming');
      expect(mockStreamOpenAIAgent).toHaveBeenCalled();
    });

    it('should fallback to basic execution when streaming not enabled', async () => {
      const config = {
        provider: 'openai' as const,
        model: 'gpt-4',
        apiKey: 'sk-test',
        agents: {
          enabled: true,
          streaming: false, // Streaming disabled
        },
      };
      
      mockConfigModule.loadAIConfig.mockReturnValue(config);
      
      const client = new EnhancedAIClient(config);

      const options: EnhancedAgentRunOptions = {
        instructions: 'Test non-streaming',
      };

      const events = [];
      for await (const event of client.streamAgentEvents(options)) {
        events.push(event);
        if (events.length >= 2) break; // Limit for test
      }

      expect(events[0].data).toContain('basic agent execution');
      expect(mockStreamOpenAIAgent).not.toHaveBeenCalled();
    });

    it('should handle streaming errors gracefully', async () => {
      const config = {
        provider: 'openai' as const,
        model: 'gpt-4',
        apiKey: 'sk-test',
        agents: {
          enabled: true,
          streaming: true,
        },
      };
      
      mockConfigModule.loadAIConfig.mockReturnValue(config);
      mockStreamOpenAIAgent.mockImplementation(async function* () {
        throw new Error('Streaming error');
      });
      
      const client = new EnhancedAIClient(config);

      const options: EnhancedAgentRunOptions = {
        instructions: 'Test error handling',
      };

      const events = [];
      for await (const event of client.streamAgentEvents(options)) {
        events.push(event);
      }

      // Should fall back to basic execution after error
      expect(events.some(e => e.data && typeof e.data === 'string' && e.data.includes('falling back to basic execution'))).toBe(true);
    });
  });

  describe('createEnhancedAIClient', () => {
    it('should create client with loaded config', async () => {
      const config = {
        provider: 'openai' as const,
        model: 'gpt-4',
        apiKey: 'sk-test',
        agents: {
          enabled: true,
        },
      };
      
      mockConfigModule.loadAIConfig.mockReturnValue(config);

      const client = await createEnhancedAIClient({
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'sk-test',
      });

      expect(client).toBeInstanceOf(EnhancedAIClient);
      expect(mockConfigModule.loadAIConfig).toHaveBeenCalledWith({
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'sk-test',
      });
    });
  });

  describe('Feature flag behavior', () => {
    it('should read agents config from environment variables', async () => {
      // This test verifies the environment variable integration
      // The actual env var reading is tested in config.test.ts
      const config = {
        provider: 'openai' as const,
        model: 'gpt-4',
        apiKey: 'sk-test',
        agents: {
          enabled: true, // Would be set from SUPERDAPP_AI_AGENTS=1
          streaming: true, // Would be set from SUPERDAPP_AI_AGENTS_STREAMING=1
          maxTurns: 10, // Would be set from SUPERDAPP_AI_AGENTS_MAX_TURNS=10
        },
      };
      
      mockConfigModule.loadAIConfig.mockReturnValue(config);
      
      const client = new EnhancedAIClient(config);
      client.setTracing(true);

      const options: EnhancedAgentRunOptions = {
        instructions: 'Test with env config',
      };

      await client.runEnhancedAgent(options);

      expect(mockCreateOpenAIAgentOptions).toHaveBeenCalledWith(
        config,
        'mock-model',
        expect.objectContaining({
          maxTurns: 10, // Should use the config value
        })
      );
    });
  });
});