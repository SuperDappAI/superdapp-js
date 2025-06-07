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
        baseUrl: 'https://api.superdapp.com',
      });
      expect(clientWithDefaults).toBeInstanceOf(SuperDappClient);
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

    it('should have getWalletKeys method', () => {
      expect(typeof client.getWalletKeys).toBe('function');
    });
  });
});
