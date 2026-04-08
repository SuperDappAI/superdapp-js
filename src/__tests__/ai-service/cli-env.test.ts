import { validateAiConfig, createBotConfig } from '../../utils/env';
import { AIAgentConfig } from '../../types';

describe('AI CLI & Environment Support', () => {
  // Mock environment variables
  const originalEnv = process.env;
  const mockConsoleError = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    // Reset process.env to a clean state like other env tests
    process.env = {};
    // Mock console.error to avoid noisy test output
    console.error = mockConsoleError;
  });

  afterEach(() => {
    process.env = originalEnv;
    mockConsoleError.mockClear();
    console.error = originalEnv.console?.error || console.error;
  });

  describe('validateAiConfig', () => {
    test('should return valid for undefined config (AI is optional)', () => {
      const result = validateAiConfig(undefined);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should return error when provider is missing', () => {
      const config: AIAgentConfig = {
        model: 'gpt-4',
        apiKey: 'sk-test-key',
      };
      const result = validateAiConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('AI_PROVIDER is required');
    });

    test('should return error when model is missing', () => {
      const config: AIAgentConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
      };
      const result = validateAiConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('AI_MODEL is required');
    });

    test('should return error when apiKey is missing', () => {
      const config: AIAgentConfig = {
        provider: 'openai',
        model: 'gpt-4',
      };
      const result = validateAiConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('AI_API_KEY is required');
    });

    test('should validate OpenAI API key format', () => {
      const invalidConfig: AIAgentConfig = {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'invalid-key',
      };
      const result = validateAiConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('OpenAI API key should start with "sk-"');
    });

    test('should validate Anthropic API key format', () => {
      const invalidConfig: AIAgentConfig = {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        apiKey: 'invalid-key',
      };
      const result = validateAiConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Anthropic API key should start with "sk-ant-"');
    });

    test('should validate valid OpenAI config', () => {
      const config: AIAgentConfig = {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'sk-test-key-123',
      };
      const result = validateAiConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should validate valid Anthropic config', () => {
      const config: AIAgentConfig = {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        apiKey: 'sk-ant-test-key-123',
      };
      const result = validateAiConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should validate Google config without key format validation', () => {
      const config: AIAgentConfig = {
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'any-google-key-format',
      };
      const result = validateAiConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should return error for unsupported provider', () => {
      const config: AIAgentConfig = {
        provider: 'unsupported' as any,
        model: 'some-model',
        apiKey: 'some-key',
      };
      const result = validateAiConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported AI provider');
    });
  });

  describe('environment variable integration', () => {
    test('should read AI environment variables correctly', () => {
      process.env.API_TOKEN = 'test-api-token';
      process.env.AI_PROVIDER = 'openai';
      process.env.AI_MODEL = 'gpt-4';
      process.env.AI_API_KEY = 'sk-test-key';
      process.env.AI_BASE_URL = 'https://api.openai.com/v1';

      const config = createBotConfig();

      expect(config.ai).toBeDefined();
      expect(config.ai?.provider).toBe('openai');
      expect(config.ai?.model).toBe('gpt-4');
      expect(config.ai?.apiKey).toBe('sk-test-key');
      expect(config.ai?.baseUrl).toBe('https://api.openai.com/v1');
    });

    test('should not include AI config when variables are missing', () => {
      process.env.API_TOKEN = 'test-api-token';
      // No AI variables set

      const config = createBotConfig();

      expect(config.ai).toBeUndefined();
    });

    test('should not include AI config when only some variables are set', () => {
      process.env.API_TOKEN = 'test-api-token';
      process.env.AI_PROVIDER = 'openai';
      // Missing AI_MODEL and AI_API_KEY

      const config = createBotConfig();

      expect(config.ai).toBeUndefined();
    });

    test('should include AI config without baseUrl when not provided', () => {
      process.env.API_TOKEN = 'test-api-token';
      process.env.AI_PROVIDER = 'anthropic';
      process.env.AI_MODEL = 'claude-3-sonnet-20240229';
      process.env.AI_API_KEY = 'sk-ant-test-key';
      // No AI_BASE_URL set

      const config = createBotConfig();

      expect(config.ai).toBeDefined();
      expect(config.ai?.provider).toBe('anthropic');
      expect(config.ai?.model).toBe('claude-3-sonnet-20240229');
      expect(config.ai?.apiKey).toBe('sk-ant-test-key');
      expect(config.ai?.baseUrl).toBeUndefined();
    });
  });

  describe('validation error messages', () => {
    test('should provide clear error message for missing provider', () => {
      const config: AIAgentConfig = {
        model: 'gpt-4',
        apiKey: 'sk-test-key',
      };
      const result = validateAiConfig(config);
      expect(result.error).toContain('AI_PROVIDER is required');
      expect(result.error).toContain('openai, anthropic, google');
    });

    test('should provide clear error message for missing model', () => {
      const config: AIAgentConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
      };
      const result = validateAiConfig(config);
      expect(result.error).toContain('AI_MODEL is required');
      expect(result.error).toContain('gpt-4, claude-3-sonnet-20240229, gemini-pro');
    });

    test('should provide clear error message for missing API key', () => {
      const config: AIAgentConfig = {
        provider: 'openai',
        model: 'gpt-4',
      };
      const result = validateAiConfig(config);
      expect(result.error).toContain('AI_API_KEY is required');
      expect(result.error).toContain('Get your API key from your AI provider');
    });
  });
});