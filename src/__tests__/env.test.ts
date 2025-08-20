import {
  validateEnv,
  createBotConfig,
  loadEnvFromFile,
  loadEnvConfigFromFile,
  createBotConfigFromFile,
} from '../utils/env';

// Mock fs module
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

import { readFile } from 'fs/promises';

describe('Environment utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset process.env to a clean state
    process.env = {};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

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

  describe('loadEnvFromFile', () => {
    it('should parse dotenv format correctly', async () => {
      const dotenvContent = `# SuperDapp Agent Configuration
API_TOKEN=test-token-123
API_BASE_URL=https://api.test.com
NODE_ENV=development
PORT=8787
`;
      (readFile as jest.Mock).mockResolvedValue(dotenvContent);

      const result = await loadEnvFromFile('test.env', 'dotenv');
      expect(result.API_TOKEN).toBe('test-token-123');
      expect(result.API_BASE_URL).toBe('https://api.test.com');
      expect(result.NODE_ENV).toBe('development');
      expect(result.PORT).toBe('8787');
    });

    it('should parse json format correctly (AWS Lambda)', async () => {
      const jsonContent = JSON.stringify({
        myBotFunction: {
          API_TOKEN: 'test-token-123',
          API_BASE_URL: 'https://api.test.com',
          NODE_ENV: 'production',
        },
      });
      (readFile as jest.Mock).mockResolvedValue(jsonContent);

      const result = await loadEnvFromFile('test.json', 'json');
      expect(result.API_TOKEN).toBe('test-token-123');
      expect(result.API_BASE_URL).toBe('https://api.test.com');
      expect(result.NODE_ENV).toBe('production');
    });

    it('should parse devvars format correctly (Cloudflare Workers)', async () => {
      const devvarsContent = `API_TOKEN=test-token-123
API_BASE_URL=https://api.test.com
NODE_ENV=development
`;
      (readFile as jest.Mock).mockResolvedValue(devvarsContent);

      const result = await loadEnvFromFile('test.dev.vars', 'devvars');
      expect(result.API_TOKEN).toBe('test-token-123');
      expect(result.API_BASE_URL).toBe('https://api.test.com');
      expect(result.NODE_ENV).toBe('development');
    });

    it('should handle quoted values in dotenv', async () => {
      const dotenvContent = `API_TOKEN="test-token-123"
API_BASE_URL='https://api.test.com'
`;
      (readFile as jest.Mock).mockResolvedValue(dotenvContent);

      const result = await loadEnvFromFile('test.env', 'dotenv');
      expect(result.API_TOKEN).toBe('test-token-123');
      expect(result.API_BASE_URL).toBe('https://api.test.com');
    });

    it('should skip comments and empty lines in dotenv', async () => {
      const dotenvContent = `# This is a comment
API_TOKEN=test-token-123

# Another comment
API_BASE_URL=https://api.test.com
`;
      (readFile as jest.Mock).mockResolvedValue(dotenvContent);

      const result = await loadEnvFromFile('test.env', 'dotenv');
      expect(result.API_TOKEN).toBe('test-token-123');
      expect(result.API_BASE_URL).toBe('https://api.test.com');
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        loadEnvFromFile('test.txt', 'invalid' as 'dotenv' | 'json' | 'devvars')
      ).rejects.toThrow('Unsupported environment format: invalid');
    });

    it('should throw error when file read fails', async () => {
      (readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(loadEnvFromFile('test.env', 'dotenv')).rejects.toThrow(
        'Failed to load environment file test.env: File not found'
      );
    });
  });

  describe('loadEnvConfigFromFile', () => {
    it('should load and validate environment config from dotenv file', async () => {
      const dotenvContent = `API_TOKEN=test-token-123
API_BASE_URL=https://api.test.com
NODE_ENV=development
`;
      (readFile as jest.Mock).mockResolvedValue(dotenvContent);

      const result = await loadEnvConfigFromFile('test.env', 'dotenv');
      expect(result.API_TOKEN).toBe('test-token-123');
      expect(result.API_BASE_URL).toBe('https://api.test.com');
      expect(result.NODE_ENV).toBe('development');
    });

    it('should merge with process.env', async () => {
      process.env.EXISTING_VAR = 'existing-value';

      const dotenvContent = `API_TOKEN=test-token-123
API_BASE_URL=https://api.test.com
`;
      (readFile as jest.Mock).mockResolvedValue(dotenvContent);

      const result = await loadEnvConfigFromFile('test.env', 'dotenv');
      expect(result.API_TOKEN).toBe('test-token-123');
      expect(result.API_BASE_URL).toBe('https://api.test.com');
      expect(process.env.EXISTING_VAR).toBe('existing-value');
    });

    it('should throw error for invalid environment config', async () => {
      const dotenvContent = `# Missing API_TOKEN
API_BASE_URL=https://api.test.com
`;
      (readFile as jest.Mock).mockResolvedValue(dotenvContent);

      await expect(loadEnvConfigFromFile('test.env', 'dotenv')).rejects.toThrow(
        'Invalid environment variables'
      );
    });
  });

  describe('createBotConfigFromFile', () => {
    it('should create bot config from dotenv file', async () => {
      const dotenvContent = `API_TOKEN=test-token-123
API_BASE_URL=https://api.test.com
`;
      (readFile as jest.Mock).mockResolvedValue(dotenvContent);

      const config = await createBotConfigFromFile('test.env', 'dotenv');
      expect(config.apiToken).toBe('test-token-123');
      expect(config.baseUrl).toBe('https://api.test.com');
    });

    it('should use custom base URL when provided', async () => {
      const dotenvContent = `API_TOKEN=test-token-123
API_BASE_URL=https://api.test.com
`;
      (readFile as jest.Mock).mockResolvedValue(dotenvContent);

      const config = await createBotConfigFromFile(
        'test.env',
        'dotenv',
        'https://custom.api.com'
      );
      expect(config.apiToken).toBe('test-token-123');
      expect(config.baseUrl).toBe('https://custom.api.com');
    });

    it('should use default base URL when not provided', async () => {
      const dotenvContent = `API_TOKEN=test-token-123
`;
      (readFile as jest.Mock).mockResolvedValue(dotenvContent);

      const config = await createBotConfigFromFile('test.env', 'dotenv');
      expect(config.apiToken).toBe('test-token-123');
      expect(config.baseUrl).toBe('https://api.superdapp.ai');
    });
  });

  describe('createBotConfig', () => {
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
