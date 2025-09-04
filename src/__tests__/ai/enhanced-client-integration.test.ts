/**
 * Tests for Enhanced AI Client with OpenAI Agents SDK integration - Core functionality
 */

import { EnhancedAIClient, createEnhancedAIClient } from '../../ai/enhanced-client';
import { loadAIConfig } from '../../ai/config';

// Mock the config module
jest.mock('../../ai/config', () => ({
  loadAIConfig: jest.fn(),
}));

// Mock the basic AI client
const mockGenerateText = jest.fn();
jest.mock('../../ai/client', () => ({
  generateText: mockGenerateText,
}));

const loadAIConfigMock = loadAIConfig as jest.MockedFunction<typeof loadAIConfig>;

describe('Enhanced AI Client with OpenAI Agents Integration', () => {
  let client: EnhancedAIClient;

  const mockBaseConfig = {
    provider: 'openai' as const,
    model: 'gpt-4',
    apiKey: 'test-api-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    loadAIConfigMock.mockReturnValue(mockBaseConfig);
    mockGenerateText.mockResolvedValue('Fallback response');
  });

  describe('Feature flag logic', () => {
    it('should use generateText fallback when feature is disabled', async () => {
      const configWithoutAgents = {
        ...mockBaseConfig,
        agents: { enabled: false },
      };
      loadAIConfigMock.mockReturnValue(configWithoutAgents);
      
      client = new EnhancedAIClient(configWithoutAgents);

      const result = await client.runEnhancedAgent({
        instructions: 'Test fallback',
      });

      expect(result.outputText).toBe('Fallback response');
      expect(mockGenerateText).toHaveBeenCalled();
    });

    it('should use generateText fallback when provider is not OpenAI', async () => {
      const configWithAnthropicAndAgents = {
        provider: 'anthropic' as const,
        model: 'claude-3',
        apiKey: 'test-api-key',
        agents: { enabled: true },
      };
      loadAIConfigMock.mockReturnValue(configWithAnthropicAndAgents);
      
      client = new EnhancedAIClient(configWithAnthropicAndAgents);

      const result = await client.runEnhancedAgent({
        instructions: 'Test with Anthropic',
      });

      expect(result.outputText).toBe('Fallback response');
      expect(mockGenerateText).toHaveBeenCalled();
    });

    it('should attempt OpenAI Agents when feature is enabled for OpenAI provider', async () => {
      const configWithAgents = {
        ...mockBaseConfig,
        agents: { enabled: true },
      };
      loadAIConfigMock.mockReturnValue(configWithAgents);
      
      client = new EnhancedAIClient(configWithAgents);

      // This will attempt to use OpenAI Agents but fall back to generateText
      // since the actual SDK is not available in tests
      const result = await client.runEnhancedAgent({
        instructions: 'Test with OpenAI Agents',
      });

      expect(result.outputText).toBe('Fallback response');
      expect(mockGenerateText).toHaveBeenCalled();
    });
  });

  describe('Configuration and feature detection', () => {
    it('should check shouldUseOpenAIAgents correctly', async () => {
      const configWithAgents = {
        ...mockBaseConfig,
        agents: { enabled: true },
      };
      loadAIConfigMock.mockReturnValue(configWithAgents);
      
      client = new EnhancedAIClient(configWithAgents);
      
      // The shouldUseOpenAIAgents method should return true for OpenAI with agents enabled
      expect((client as any).shouldUseOpenAIAgents({ instructions: 'test' })).toBe(true);
    });

    it('should return false for non-OpenAI providers even with agents enabled', async () => {
      const configWithAnthropicAndAgents = {
        provider: 'anthropic' as const,
        model: 'claude-3',
        apiKey: 'test-api-key',
        agents: { enabled: true },
      };
      loadAIConfigMock.mockReturnValue(configWithAnthropicAndAgents);
      
      client = new EnhancedAIClient(configWithAnthropicAndAgents);
      
      expect((client as any).shouldUseOpenAIAgents({ instructions: 'test' })).toBe(false);
    });
  });

  describe('Guardrails and validation', () => {
    beforeEach(() => {
      const configWithAgents = {
        ...mockBaseConfig,
        agents: { enabled: true },
      };
      loadAIConfigMock.mockReturnValue(configWithAgents);
      client = new EnhancedAIClient(configWithAgents);
    });

    it('should apply input validation', async () => {
      await expect(
        client.runEnhancedAgent({
          instructions: 'This instruction is way too long for the validation rules to allow',
          guardrails: {
            inputValidation: {
              maxLength: 10,
            },
          },
        })
      ).rejects.toThrow('Input validation failed');
    });

    it('should apply output validation', async () => {
      mockGenerateText.mockResolvedValue('This response is too long for the validation rules');

      await expect(
        client.runEnhancedAgent({
          instructions: 'Short test',
          guardrails: {
            outputValidation: {
              maxLength: 10,
            },
          },
        })
      ).rejects.toThrow('Output validation failed');
    });
  });

  describe('Environment variable integration', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should enable OpenAI Agents when SUPERDAPP_AI_AGENTS=1', async () => {
      process.env.SUPERDAPP_AI_AGENTS = '1';

      const configWithEnvFlag = {
        ...mockBaseConfig,
        agents: { enabled: true }, // loadAIConfig should set this based on env
      };
      loadAIConfigMock.mockReturnValue(configWithEnvFlag);

      client = new EnhancedAIClient(configWithEnvFlag);

      // Should attempt to use OpenAI Agents (but will fallback)
      const result = await client.runEnhancedAgent({
        instructions: 'Test env flag',
      });

      expect(result.outputText).toBe('Fallback response');
      expect((client as any).shouldUseOpenAIAgents({ instructions: 'test' })).toBe(true);
    });
  });

  describe('createEnhancedAIClient factory function', () => {
    it('should create client with provided config', async () => {
      const config = {
        provider: 'openai' as const,
        model: 'gpt-4',
        apiKey: 'test-key',
        agents: { enabled: true },
      };
      loadAIConfigMock.mockReturnValue(config);

      const client = await createEnhancedAIClient(config);
      expect(client).toBeInstanceOf(EnhancedAIClient);
      expect(loadAIConfigMock).toHaveBeenCalledWith(config);
    });

    it('should create client with default config when none provided', async () => {
      loadAIConfigMock.mockReturnValue(mockBaseConfig);

      const client = await createEnhancedAIClient();
      expect(client).toBeInstanceOf(EnhancedAIClient);
      expect(loadAIConfigMock).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Tracing functionality', () => {
    beforeEach(() => {
      const configWithAgents = {
        ...mockBaseConfig,
        agents: { enabled: true },
      };
      loadAIConfigMock.mockReturnValue(configWithAgents);
      client = new EnhancedAIClient(configWithAgents);
    });

    it('should preserve existing tracing functionality', async () => {
      client.setTracing(true);
      
      const result = await client.runEnhancedAgent({
        instructions: 'Test tracing',
      });

      expect(result.outputText).toBe('Fallback response');
      
      const tracingData = client.getTracingData();
      expect(tracingData).toBeTruthy();
      expect(tracingData?.events.length).toBeGreaterThan(0);
    });

    it('should not include tracing when disabled', async () => {
      client.setTracing(false);
      
      await client.runEnhancedAgent({
        instructions: 'Test no tracing',
      });
      
      const tracingData = client.getTracingData();
      expect(tracingData).toBeNull();
    });
  });

  describe('Streaming functionality', () => {
    beforeEach(() => {
      const configWithAgents = {
        ...mockBaseConfig,
        agents: { enabled: true, streaming: true },
      };
      loadAIConfigMock.mockReturnValue(configWithAgents);
      client = new EnhancedAIClient(configWithAgents);
    });

    it('should provide streaming functionality', async () => {
      const events = [];
      for await (const event of client.streamAgentEvents({
        instructions: 'Stream test',
      })) {
        events.push(event);
        // Only collect a few events to avoid infinite loops
        if (events.length >= 3) break;
      }

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBeDefined();
    });
  });
});