export const MESSAGE_TYPE = {
  CHANNEL: 'channel' as const,
  CHAT: 'chat' as const,
};

export const API_ENDPOINTS = {
  ME: 'me',
  CREDENTIALS: 'credentials',
  MESSAGES_CHANNEL: 'messages/channel',
  MESSAGES_CONNECTION: 'messages/connection',
  MESSAGES_REACTION: 'messages/reaction',
  UPDATES: 'updates',
  WALLET_KEYS: 'wallet/keys',
  SOCIAL_GROUPS_JOIN: 'social-groups/join',
  SOCIAL_GROUPS_LEAVE: 'social-groups/leave',
} as const;

export const DEFAULT_CONFIG = {
  BASE_URL: 'https://api.superdapp.com',
  REQUEST_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;
