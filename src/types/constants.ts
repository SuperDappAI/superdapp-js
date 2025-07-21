export const MESSAGE_TYPE = {
  CHANNEL: 'channel' as const,
  CHAT: 'chat' as const,
};

export const DEFAULT_CONFIG = {
  BASE_URL: 'https://api.superdapp.com',
  REQUEST_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;
