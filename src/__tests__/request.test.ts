import { request } from '../utils/request';
import axios from 'axios';

describe('request utility', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.unmock('axios');
  });

  it('should throw if missing config', async () => {
    // Remove all env vars to ensure error is thrown before axios is called
    delete process.env.API_BASE_URL;
    delete process.env.API_TOKEN;
    await expect(request('GET', 'test')).rejects.toThrow(
      'Missing API base URL or token'
    );
  });
});
