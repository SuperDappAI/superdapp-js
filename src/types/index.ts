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
