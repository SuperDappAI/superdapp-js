export const MESSAGE_TYPE = {
  CHANNEL: 'channel' as const,
  CHAT: 'chat' as const,
};

export const DEFAULT_CONFIG = {
  BASE_URL: 'https://api.superdapp.ai',
  REQUEST_TIMEOUT: 30000,
  WEBHOOK_PORT: 3000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export const HTTP_STATUS_CODES = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
