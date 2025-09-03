import {
  loadModel,
  loadAIConfig,
  isSupportedProvider,
  getSupportedProviders,
  AIConfigError,
  type AIProvider,
  type AIConfig,
} from '../../ai/config';

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

jest.mock('@openai/agents-extensions', () => ({
  aisdk: jest.fn((model) => ({
    ...model,
    wrapped: true,
  })),
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
      });
    });
  });

  describe('loadModel', () => {
    it('should load OpenAI model with environment variables', async () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.AI_MODEL = 'gpt-4';
      process.env.AI_API_KEY = 'sk-test123';

      const model = await loadModel();

      expect(model).toEqual({
        provider: 'openai',
        model: 'gpt-4',
        config: {
          apiKey: 'sk-test123',
        },
        wrapped: true,
      });
    });

    it('should load OpenAI model with custom base URL', async () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.AI_MODEL = 'gpt-4';
      process.env.AI_API_KEY = 'sk-test123';
      process.env.AI_BASE_URL = 'https://api.custom.com';

      const model = await loadModel();

      expect(model).toEqual({
        provider: 'openai',
        model: 'gpt-4',
        config: {
          apiKey: 'sk-test123',
          baseURL: 'https://api.custom.com',
        },
        wrapped: true,
      });
    });

    it('should load Anthropic model', async () => {
      const model = await loadModel({
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        apiKey: 'ant-test123',
      });

      expect(model).toEqual({
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        config: {
          apiKey: 'ant-test123',
        },
        wrapped: true,
      });
    });

    it('should load Google model', async () => {
      const model = await loadModel({
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'google-test123',
      });

      expect(model).toEqual({
        provider: 'google',
        model: 'gemini-pro',
        config: {
          apiKey: 'google-test123',
        },
        wrapped: true,
      });
    });

    it('should throw AIConfigError for unsupported provider', async () => {
      await expect(
        loadModel({
          provider: 'unsupported' as AIProvider,
          model: 'model',
          apiKey: 'key',
        })
      ).rejects.toThrow(AIConfigError);

      await expect(
        loadModel({
          provider: 'unsupported' as AIProvider,
          model: 'model',
          apiKey: 'key',
        })
      ).rejects.toThrow('Invalid enum value');
    });

    it('should throw AIConfigError for missing configuration', async () => {
      // No environment variables set
      await expect(loadModel()).rejects.toThrow(AIConfigError);
      await expect(loadModel()).rejects.toThrow('AI_MODEL is required');
    });

    it('should respect base URL overrides', async () => {
      const model = await loadModel({
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'sk-test123',
        baseUrl: 'https://custom.openai.com',
      });

      expect((model as any).config.baseURL).toBe('https://custom.openai.com');
    });

    it('should wrap model with aisdk', async () => {
      const result = await loadModel({
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'sk-test123',
      });

      // The result should be wrapped by aisdk
      expect((result as any).wrapped).toBe(true);
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