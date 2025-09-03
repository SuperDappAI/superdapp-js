import { AI_PROVIDERS, AIConfig, AIProvider } from '../ai';

describe('AI Module', () => {
  describe('AI_PROVIDERS constant', () => {
    it('should contain expected providers', () => {
      expect(AI_PROVIDERS).toContain('openai');
      expect(AI_PROVIDERS).toContain('anthropic');
      expect(AI_PROVIDERS).toContain('google');
      expect(AI_PROVIDERS).toHaveLength(3);
    });
  });

  describe('AIConfig interface', () => {
    it('should accept valid configuration', () => {
      const config: AIConfig = {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000,
      };

      expect(config.provider).toBe('openai');
      expect(config.apiKey).toBe('test-key');
      expect(config.model).toBe('gpt-4o-mini');
      expect(config.temperature).toBe(0.7);
      expect(config.maxTokens).toBe(1000);
    });

    it('should accept minimal configuration', () => {
      const config: AIConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      };

      expect(config.provider).toBe('openai');
      expect(config.apiKey).toBe('test-key');
      expect(config.model).toBeUndefined();
      expect(config.temperature).toBeUndefined();
      expect(config.maxTokens).toBeUndefined();
    });
  });

  describe('AIProvider type', () => {
    it('should accept valid provider values', () => {
      const openaiProvider: AIProvider = 'openai';
      const anthropicProvider: AIProvider = 'anthropic';
      const googleProvider: AIProvider = 'google';

      expect(openaiProvider).toBe('openai');
      expect(anthropicProvider).toBe('anthropic');
      expect(googleProvider).toBe('google');
    });
  });

  describe('AI module exports', () => {
    it('should export AI constants and types', async () => {
      const aiModule = await import('../ai');
      
      expect(aiModule.AI_PROVIDERS).toBeDefined();
      expect(Array.isArray(aiModule.AI_PROVIDERS)).toBe(true);
      expect(aiModule.default).toBeDefined();
      expect(typeof aiModule.default).toBe('object');
    });

    it('should export openai provider', async () => {
      const aiModule = await import('../ai');
      
      // Access through any to avoid TypeScript issues in tests
      expect(typeof (aiModule as any).openai).toBe('function');
    });

    it('should export AI functions through wildcard exports', async () => {
      const aiModule = await import('../ai');
      
      // Check that key functions exist through wildcard export
      expect(typeof (aiModule as any).generateText).toBe('function');
      expect(typeof (aiModule as any).generateObject).toBe('function');
      expect(typeof (aiModule as any).streamText).toBe('function');
      expect(typeof (aiModule as any).streamObject).toBe('function');
    });
  });
});