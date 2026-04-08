import { AdvancedAIProvider } from '../../ai-service';
import {
  loadModel,
  loadAIConfig,
  isSupportedProvider,
  getSupportedProviders,
  AIConfigError,
} from '../../ai-service/config';

// Mock the AI SDK modules
jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn((config) => (model: string) => ({
    provider: 'openai',
    model,
    config,
  })),
}));

jest.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: jest.fn((config) => (model: string) => ({
    provider: 'anthropic',
    model,
    config,
  })),
}));

jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest.fn((config) => (model: string) => ({
    provider: 'google',
    model,
    config,
  })),
}));

// Mock AI SDK providers
jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(() =>
    jest.fn(() => ({
      specificationVersion: 'V2',
      provider: 'openai',
      modelId: 'gpt-4',
    }))
  ),
}));

describe('AI Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Clear AI-related env vars
    delete process.env.AI_PROVIDER;
    delete process.env.AI_MODEL;
    delete process.env.AI_API_KEY;
    delete process.env.AI_BASE_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('loadAIConfig', () => {
    it('should load configuration from environment variables', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.AI_MODEL = 'gpt-4';
      process.env.AI_API_KEY = 'sk-test123';
      process.env.AI_BASE_URL = 'https://api.custom.com';

      const config = loadAIConfig();

      expect(config).toEqual({
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'sk-test123',
        baseUrl: 'https://api.custom.com',
        agents: {
          enabled: false,
          streaming: false,
        },
      });
    });

    it('should prioritize provided config over environment variables', () => {
      process.env.AI_PROVIDER = 'google';
      process.env.AI_MODEL = 'gemini-pro';
      process.env.AI_API_KEY = 'env-key';

      const config = loadAIConfig({
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'config-key',
      });

      expect(config).toEqual({
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'config-key',
        agents: {
          enabled: false,
          streaming: false,
        },
      });
    });

    it('should default to openai provider if not specified', () => {
      process.env.AI_MODEL = 'gpt-4';
      process.env.AI_API_KEY = 'sk-test123';

      const config = loadAIConfig();

      expect(config.provider).toBe('openai');
    });

    it('should throw AIConfigError for missing API key', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.AI_MODEL = 'gpt-4';
      // Missing AI_API_KEY

      expect(() => loadAIConfig()).toThrow(AIConfigError);
      expect(() => loadAIConfig()).toThrow('AI_API_KEY is required');
    });

    it('should throw AIConfigError for missing model', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.AI_API_KEY = 'sk-test123';
      // Missing AI_MODEL

      expect(() => loadAIConfig()).toThrow(AIConfigError);
      expect(() => loadAIConfig()).toThrow('AI_MODEL is required');
    });

    it('should throw AIConfigError for unsupported provider', () => {
      process.env.AI_PROVIDER = 'unsupported';
      process.env.AI_MODEL = 'model';
      process.env.AI_API_KEY = 'key';

      expect(() => loadAIConfig()).toThrow(AIConfigError);
    });

    it('should throw AIConfigError for invalid base URL', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.AI_MODEL = 'gpt-4';
      process.env.AI_API_KEY = 'sk-test123';
      process.env.AI_BASE_URL = 'not-a-url';

      expect(() => loadAIConfig()).toThrow(AIConfigError);
    });

    it('should work without base URL', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.AI_MODEL = 'gpt-4';
      process.env.AI_API_KEY = 'sk-test123';

      const config = loadAIConfig();

      expect(config).toEqual({
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'sk-test123',
        agents: {
          enabled: false,
          streaming: false,
        },
      });
    });
  });

  describe('Agents configuration', () => {
    beforeEach(() => {
      // Clean up any existing agent-related env vars
      delete process.env.SUPERDAPP_AI_AGENTS;
      delete process.env.SUPERDAPP_AI_AGENTS_STREAMING;
      delete process.env.SUPERDAPP_AI_AGENTS_MAX_TURNS;
    });

    it('should enable agents when SUPERDAPP_AI_AGENTS=1', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.AI_MODEL = 'gpt-4';
      process.env.AI_API_KEY = 'sk-test123';
      process.env.SUPERDAPP_AI_AGENTS = '1';

      const config = loadAIConfig();

      expect(config.agents).toEqual({
        enabled: true,
        streaming: false,
      });
    });

    it('should enable agents when SUPERDAPP_AI_AGENTS=true', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.AI_MODEL = 'gpt-4';
      process.env.AI_API_KEY = 'sk-test123';
      process.env.SUPERDAPP_AI_AGENTS = 'true';

      const config = loadAIConfig();

      expect(config.agents).toEqual({
        enabled: true,
        streaming: false,
      });
    });

    it('should configure streaming and max turns', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.AI_MODEL = 'gpt-4';
      process.env.AI_API_KEY = 'sk-test123';
      process.env.SUPERDAPP_AI_AGENTS = '1';
      process.env.SUPERDAPP_AI_AGENTS_STREAMING = '1';
      process.env.SUPERDAPP_AI_AGENTS_MAX_TURNS = '15';

      const config = loadAIConfig();

      expect(config.agents).toEqual({
        enabled: true,
        streaming: true,
        maxTurns: 15,
      });
    });

    it('should prioritize provided config over environment for agents', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.AI_MODEL = 'gpt-4';
      process.env.AI_API_KEY = 'sk-test123';
      process.env.SUPERDAPP_AI_AGENTS = '1';
      process.env.SUPERDAPP_AI_AGENTS_STREAMING = '1';

      const config = loadAIConfig({
        agents: {
          enabled: false,
          streaming: false,
          maxTurns: 5,
        },
      });

      expect(config.agents).toEqual({
        enabled: false,
        streaming: false,
        maxTurns: 5,
      });
    });

    it('should disable agents by default', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.AI_MODEL = 'gpt-4';
      process.env.AI_API_KEY = 'sk-test123';
      // No SUPERDAPP_AI_AGENTS env var

      const config = loadAIConfig();

      expect(config.agents).toEqual({
        enabled: false,
        streaming: false,
      });
    });
  });

  describe('loadModel', () => {
    it('should load OpenAI model and return native AI SDK v5 model', async () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.AI_MODEL = 'gpt-4';
      process.env.AI_API_KEY = 'sk-test123';

      const model = await loadModel() as any;

      // The result should be a native AI SDK v5 model with V2 specification
      expect(model.specificationVersion).toBe('V2');
      expect(model.provider).toBe('openai');
      expect(model.modelId).toBe('gpt-4');
    });

    it('should load Anthropic model and return native AI SDK v5 model', async () => {
      const model = await loadModel({
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        apiKey: 'ant-test123',
      }) as any;

      // The result should be a native AI SDK v5 model (structure may vary by provider)
      expect(model).toBeDefined();
      expect(model).toBeTruthy();
    });

    it('should load Google model and return native AI SDK v5 model', async () => {
      const model = await loadModel({
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'google-test123',
      }) as any;

      // The result should be a native AI SDK v5 model (structure may vary by provider)
      expect(model).toBeDefined();
      expect(model).toBeTruthy();
    });

    it('should throw AIConfigError for unsupported provider', async () => {
      await expect(
        loadModel({
          provider: 'unsupported' as AdvancedAIProvider,
          model: 'model',
          apiKey: 'key',
        })
      ).rejects.toThrow(AIConfigError);

      await expect(
        loadModel({
          provider: 'unsupported' as AdvancedAIProvider,
          model: 'model',
          apiKey: 'key',
        })
      ).rejects.toThrow(
        'AI_PROVIDER must be one of: openai, anthropic, google'
      );
    });

    it('should throw AIConfigError for missing configuration', async () => {
      // No environment variables set
      await expect(loadModel()).rejects.toThrow(AIConfigError);
      await expect(loadModel()).rejects.toThrow('AI_MODEL is required');
    });
  });

  describe('isSupportedProvider', () => {
    it('should return true for supported providers', () => {
      expect(isSupportedProvider('openai')).toBe(true);
      expect(isSupportedProvider('anthropic')).toBe(true);
      expect(isSupportedProvider('google')).toBe(true);
    });

    it('should return false for unsupported providers', () => {
      expect(isSupportedProvider('unsupported')).toBe(false);
      expect(isSupportedProvider('gpt')).toBe(false);
      expect(isSupportedProvider('')).toBe(false);
    });
  });

  describe('getSupportedProviders', () => {
    it('should return list of supported providers', () => {
      const providers = getSupportedProviders();
      expect(providers).toEqual(['openai', 'anthropic', 'google']);
    });
  });

  describe('AIConfigError', () => {
    it('should create error with message and code', () => {
      const error = new AIConfigError('Test message', 'TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('AIConfigError');
    });

    it('should create error with message only', () => {
      const error = new AIConfigError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBeUndefined();
      expect(error.name).toBe('AIConfigError');
    });
  });

  describe('Error Handling', () => {
    it('should handle module import errors gracefully', async () => {
      // Mock import to throw an error
      jest.doMock('@ai-sdk/openai', () => {
        throw new Error('Module not found');
      });

      await expect(
        loadModel({
          provider: 'openai',
          model: 'gpt-4',
          apiKey: 'sk-test123',
        })
      ).rejects.toThrow(AIConfigError);
    });

    it('should provide helpful error messages for missing dependencies', async () => {
      jest.doMock('@ai-sdk/anthropic', () => {
        const error: any = new Error('Cannot find module @ai-sdk/anthropic');
        error.code = 'MODULE_NOT_FOUND';
        throw error;
      });

      await expect(
        loadModel({
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          apiKey: 'ant-test123',
        })
      ).rejects.toThrow('Failed to load Anthropic provider');
    });
  });
});
