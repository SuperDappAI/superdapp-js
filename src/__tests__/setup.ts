// Setup test environment
process.env.API_TOKEN = 'test-token';
process.env.API_BASE_URL = 'https://api.test.com';

// Setup global test timeout
jest.setTimeout(10000);

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Basic setup test
describe('Test Setup', () => {
  test('should have test environment configured', () => {
    expect(process.env.API_TOKEN).toBe('test-token');
    expect(process.env.API_BASE_URL).toBe('https://api.test.com');
  });
});
