import { shouldDisableSSLVerification } from '../utils/env';

describe('SSL Configuration', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('shouldDisableSSLVerification', () => {
    it('should return true in development environment', () => {
      process.env.NODE_ENV = 'development';
      expect(shouldDisableSSLVerification()).toBe(true);
    });

    it('should return false in production environment', () => {
      process.env.NODE_ENV = 'production';
      expect(shouldDisableSSLVerification()).toBe(false);
    });

    it('should return false in test environment', () => {
      process.env.NODE_ENV = 'test';
      expect(shouldDisableSSLVerification()).toBe(false);
    });

    it('should return false when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      expect(shouldDisableSSLVerification()).toBe(false);
    });
  });
});
