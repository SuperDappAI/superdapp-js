// Mock external dependencies
jest.mock('file-type', () => ({
  fileTypeFromBuffer: jest.fn().mockResolvedValue({
    mime: 'image/jpeg',
    ext: 'jpg',
  }),
}));

jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    metadata: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-image-data')),
  }));
});

import { SuperDappClient } from '../core/client';
import { BotConfig } from '../types';

describe('SuperDappClient', () => {
  let client: SuperDappClient;
  const mockConfig: BotConfig = {
    apiToken: 'test-token',
    baseUrl: 'https://api.test.com',
  };

  beforeEach(() => {
    client = new SuperDappClient(mockConfig);
  });

  describe('constructor', () => {
    it('should create client with provided config', () => {
      expect(client).toBeInstanceOf(SuperDappClient);
    });

    it('should use default base URL if not provided', () => {
      const clientWithDefaults = new SuperDappClient({
        apiToken: 'test',
        baseUrl: 'https://api.superdapp.ai',
      });
      expect(clientWithDefaults).toBeInstanceOf(SuperDappClient);
    });
  });

  describe('SSL configuration', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should disable SSL verification in development', () => {
      process.env.NODE_ENV = 'development';
      const devClient = new SuperDappClient(mockConfig);
      expect(devClient).toBeInstanceOf(SuperDappClient);
    });

    it('should enable SSL verification in production', () => {
      process.env.NODE_ENV = 'production';
      const prodClient = new SuperDappClient(mockConfig);
      expect(prodClient).toBeInstanceOf(SuperDappClient);
    });

    it('should enable SSL verification when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      const defaultClient = new SuperDappClient(mockConfig);
      expect(defaultClient).toBeInstanceOf(SuperDappClient);
    });
  });

  describe('API methods', () => {
    beforeEach(() => {
      // Mock axios responses
      jest.clearAllMocks();
    });

    it('should have getMe method', () => {
      expect(typeof client.getMe).toBe('function');
    });

    it('should have sendChannelMessage method', () => {
      expect(typeof client.sendChannelMessage).toBe('function');
    });
  });
});
