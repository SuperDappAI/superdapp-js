export interface BotConfig {
  apiToken: string;
  baseUrl: string;
  ai?: AIAgentConfig;
}

export interface AIAgentConfig {
  provider?: 'openai' | 'anthropic' | 'google';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  username?: string;
  chatPassword?: string;
}

export interface BotInfo {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface MessageBody {
  body: string;
  reply?: MessageReply;
}

export interface MessageReply {
  id: string;
  userId: string;
  replyingTo: string;
}

export interface SendMessageOptions {
  message: MessageBody;
  isSilent?: boolean;
}

export interface MessageContent {
  text?: string;
  body?: string | { callback_query: string };
  message?: string;
}

export interface Message {
  id: string;
  senderId: string;
  memberId?: string;
  owner?: string;
  body: {
    t: 'channel' | 'chat';
    m: string | MessageContent;
  };
  timestamp: string;
  isBot: boolean;
  channelId?: string;
}

export interface MessageData {
  body: {
    t: 'channel' | 'chat';
    m: string | MessageContent;
  };
  command?: string;
  rawMessage: Message;
  callback_command?: string;
  data?: string;
}

export interface ChannelMessage {
  data: Message[];
  nextToken?: string;
}

export interface ReactionData {
  emoji: string;
  value: boolean;
}

export interface WalletKeys {
  publicKey: string;
  privateKey: string;
  address: string;
}

export interface UpdatesResponse {
  channels_messages: Message[];
  connections_messages: Message[];
}

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface GraphQLResponse {
  data?: {
    onCreateChannelMessage?: MessageData;
    onCreateMessageEvent?: MessageData;
  };
}

export type MessageType = 'channel' | 'chat';

export interface CommandHandler {
  (params: {
    message: MessageData;
    replyMessage: unknown;
    roomId: string;
  }): Promise<void>;
}

export interface AgentCommands {
  [command: string]: CommandHandler;
}

export interface AgentMessages {
  [command: string]: unknown;
}

export interface MessageReaction {
  id: string;
  reactions?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ChatMessageEvent {
  id: string;
  owner?: string | null;
  isDeleted?: boolean | null;
  messageReaction?: MessageReaction | null;
  messageId?: string | null;
  userId?: string | null;
  roomId?: string | null;
  chatId?: string | null;
  roomParticipantId?: string | null;
  memberId?: string | null;
  senderId?: string | null;
  body: MessageContent;
  type?: string | null;
  fileKey?: string | null;
  fileSize?: number | null;
  fileMime?: string | null;
  reactions?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  isUploaded?: number | null;
  isSilent?: boolean | null;
  isSender?: boolean | null;
  isReceiver?: boolean | null;
  isChannel?: boolean | null;
  isBot?: boolean | null;
  deletedAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LINK = 'link',
  FILE = 'file',
  OTHER = 'other',
}

export interface UserBot {
  id: string;
  user_id: string;
  owner_id: string;
  username: string;
  profile_picture: string | null;
  enabled: number;
  is_private: number;
  api_token: string;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string | null;
  username: string | null;
  email: string | null;
  cognito_id: string | null;
  type: string | null;
  bot: UserBot | null;
}

// Environment-specific types
export type Environment = 'nodejs' | 'cloudflare-workers' | 'unknown';

export interface HttpsAgent {
  rejectUnauthorized: boolean;
}

// Reply markup types
export interface ReplyMarkupAction {
  text: string;
  callback_data: string;
}

export interface ReplyMarkup {
  type?: 'buttons' | 'multiselect';
  actions: ReplyMarkupAction[][];
}

export interface BotInfoResponse {
  bot_info: BotInfo;
  user: User;
}
