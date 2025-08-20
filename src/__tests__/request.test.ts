import request from '../utils/request';

describe('request utility', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.unmock('axios');
  });

  it('should throw if missing config', async () => {
    // Remove all env vars to ensure error is thrown before axios is called
    delete process.env.API_BASE_URL;
    delete process.env.API_TOKEN;

    const config = {
      baseUrl: '',
      apiToken: '',
    };

    await expect(request(config, 'GET', 'test')).rejects.toThrow();
  });
});
