import { validateEnv, createBotConfig } from '../utils/env';

describe('Environment utilities', () => {
  describe('validateEnv', () => {
    it('should validate correct environment variables', () => {
      const env = {
        API_TOKEN: 'test-token',
        API_BASE_URL: 'https://api.test.com',
      };

      const result = validateEnv(env);
      expect(result.API_TOKEN).toBe('test-token');
      expect(result.API_BASE_URL).toBe('https://api.test.com');
    });

    it('should throw error for missing API_TOKEN', () => {
      const env = {};
      expect(() => validateEnv(env)).toThrow('Invalid environment variables');
    });

    it('should accept optional API_BASE_URL', () => {
      const env = {
        API_TOKEN: 'test-token',
      };

      const result = validateEnv(env);
      expect(result.API_TOKEN).toBe('test-token');
      expect(result.API_BASE_URL).toBeUndefined();
    });
  });

  describe('createBotConfig', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should create bot config from environment', () => {
      process.env.API_TOKEN = 'test-token';
      process.env.API_BASE_URL = 'https://api.test.com';

      const config = createBotConfig();
      expect(config.apiToken).toBe('test-token');
      expect(config.baseUrl).toBe('https://api.test.com');
    });

    it('should use custom base URL when provided', () => {
      process.env.API_TOKEN = 'test-token';

      const config = createBotConfig('https://custom.api.com');
      expect(config.apiToken).toBe('test-token');
      expect(config.baseUrl).toBe('https://custom.api.com');
    });
  });
});
