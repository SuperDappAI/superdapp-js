import 'dotenv/config';

// Mock console.log to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Keep error for debugging
};

// Mock environment variables for tests
process.env.API_TOKEN = 'test-token';
process.env.API_BASE_URL = 'https://api.test.com';

// Setup global test timeout
jest.setTimeout(10000);

// Basic setup test
describe('Test Setup', () => {
  test('should have test environment configured', () => {
    expect(process.env.API_TOKEN).toBe('test-token');
    expect(process.env.API_BASE_URL).toBe('https://api.test.com');
  });
});
