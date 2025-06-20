export interface BotConfig {
  apiToken: string;
  baseUrl: string;
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

export interface BotCredentials {
  user: UserInfo;
  bot_info: BotInfo;
  appsync_connection?: any;
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

export interface PhotoMessageOptions {
  file: Buffer | NodeJS.ReadableStream;
  message: MessageBody;
  isSilent?: boolean;
}

export interface Message {
  messageId: string;
  senderId: string;
  memberId?: string;
  owner?: string;
  body: any;
  timestamp: string;
  isBot: boolean;
  channelId?: string;
}

export interface MessageData extends Message {
  body: {
    t: 'channel' | 'chat';
    m: any;
  };
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

export interface ApiResponse<T = any> {
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
  (message: MessageData, replyMessage: any, roomId: string): Promise<void>;
}

export interface AgentCommands {
  [command: string]: CommandHandler;
}

export interface AgentMessages {
  [command: string]: any;
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
  body: any;
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
