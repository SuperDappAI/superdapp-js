import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { signIn } from 'aws-amplify/auth';
import * as querystring from 'querystring';
import { SuperDappClient } from './client';
import {
  BotConfig,
  MessageData,
  AgentCommands,
  AgentMessages,
  GraphQLResponse,
  CommandHandler,
} from '../types';
import { MESSAGE_TYPE } from '../types/constants';

export class SuperDappAgent {
  private client: SuperDappClient;
  private graphqlClient: any;
  private isListening: boolean = false;
  private commands: AgentCommands = {};
  private messages: AgentMessages = {};

  constructor(config: BotConfig) {
    this.client = new SuperDappClient(config);
  }

  /**
   * Initialize the agent and start listening to messages
   */
  async initialize(): Promise<void> {
    console.log('Initializing SuperDapp Agent...');
    await this.startListening();
  }

  /**
   * Register a command handler
   */
  addCommand(command: string, handler: CommandHandler, message?: any): void {
    this.commands[command] = handler;
    if (message) {
      this.messages[command] = message;
    }
  }

  /**
   * Register multiple commands
   */
  addCommands(commands: AgentCommands, messages?: AgentMessages): void {
    Object.assign(this.commands, commands);
    if (messages) {
      Object.assign(this.messages, messages);
    }
  }

  /**
   * Start listening to AppSync subscriptions
   */
  private async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('Already listening to AppSync subscriptions');
      return;
    }

    try {
      const credentials = await this.client.getCredentials();

      if (!credentials?.data) {
        throw new Error('No credentials found');
      }

      // Configure Amplify
      Amplify.configure(credentials.data.appsync_connection);

      // Sign in
      await signIn({
        username: credentials.data.user.email,
        password: credentials.data.user.chatPassword || '',
      });

      this.graphqlClient = generateClient();

      // Subscribe to channel messages
      this.subscribeToChannelMessages();

      // Subscribe to direct messages
      this.subscribeToDirectMessages();

      this.isListening = true;
      console.log('Successfully subscribed to AppSync messages');
    } catch (error) {
      console.error('Error starting AppSync listener:', error);
      throw error;
    }
  }

  /**
   * Subscribe to channel messages
   */
  private subscribeToChannelMessages(): void {
    const subscription = `
      subscription OnCreateChannelMessage {
        onCreateChannelMessage {
          messageId
          senderId
          memberId
          owner
          body
          timestamp
          isBot
          channelId
        }
      }
    `;

    this.graphqlClient.graphql({ query: subscription }).subscribe({
      next: async ({ data }: GraphQLResponse) => {
        try {
          if (
            data?.onCreateChannelMessage &&
            !data.onCreateChannelMessage.isBot
          ) {
            await this.handleMessage(data.onCreateChannelMessage);
          }
        } catch (error) {
          console.error('Error in channel subscription handler:', error);
        }
      },
      error: (error: Error) => {
        console.error('Error in channel subscription:', error);
      },
    });
  }

  /**
   * Subscribe to direct messages
   */
  private subscribeToDirectMessages(): void {
    const subscription = `
      subscription OnCreateMessageEvent {
        onCreateMessageEvent {
          messageId
          senderId
          memberId
          owner
          body
          timestamp
          isBot
        }
      }
    `;

    this.graphqlClient.graphql({ query: subscription }).subscribe({
      next: async ({ data }: GraphQLResponse) => {
        try {
          if (data?.onCreateMessageEvent && !data.onCreateMessageEvent.isBot) {
            await this.handleMessage(data.onCreateMessageEvent);
          }
        } catch (error) {
          console.error('Error in message subscription handler:', error);
        }
      },
      error: (error: Error) => {
        console.error('Message subscription error:', error);
      },
    });
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(message: MessageData): Promise<void> {
    try {
      const body =
        typeof message.body === 'string'
          ? JSON.parse(message.body)
          : message.body;

      if (body.m) {
        body.m = JSON.parse(querystring.unescape(body.m));
      }

      message.body = body;

      switch (body.t) {
        case MESSAGE_TYPE.CHANNEL:
          await this.handleChannelMessage(message);
          break;
        case MESSAGE_TYPE.CHAT:
          await this.handleChatMessage(message);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Handle channel messages
   */
  private async handleChannelMessage(message: MessageData): Promise<void> {
    // Override this method in your agent implementation
    console.log('Channel message received:', message);
  }

  /**
   * Handle chat/DM messages
   */
  private async handleChatMessage(message: MessageData): Promise<void> {
    const commands = Object.keys(this.commands);
    const isCallbackQuery =
      typeof message.body.m === 'object' && message.body.m.body?.callback_query;

    const messageText = !isCallbackQuery
      ? message.body.m?.body?.toLowerCase()
      : '';
    const cmd = commands.find((command) => messageText?.includes(command));

    if (cmd || isCallbackQuery) {
      await this.processMessage(
        message,
        cmd || 'callback_query',
        MESSAGE_TYPE.CHAT
      );
    } else {
      // Handle general message
      if (this.commands['handleMessage']) {
        await this.processMessage(message, 'handleMessage', MESSAGE_TYPE.CHAT);
      }
    }
  }

  /**
   * Process a message with the appropriate command handler
   */
  private async processMessage(
    message: MessageData,
    command: string,
    type: 'channel' | 'chat'
  ): Promise<void> {
    const roomId = this.getRoomId(message);

    if (this.commands[command]) {
      await this.commands[command](message, this.messages[command], roomId);
    }
  }

  /**
   * Get room ID for the message
   */
  private getRoomId(message: MessageData): string {
    return message.memberId !== message.senderId
      ? `${message.memberId}-${message.senderId}`
      : `${message.owner}-${message.senderId}`;
  }

  /**
   * Send a message to a channel
   */
  async sendChannelMessage(
    channelId: string,
    text: string,
    options?: { isSilent?: boolean; reply?: any }
  ): Promise<void> {
    await this.client.sendChannelMessage(channelId, {
      message: {
        body: text,
        reply: options?.reply,
      },
      isSilent: options?.isSilent || false,
    });
  }

  /**
   * Send a message to a connection (DM)
   */
  async sendConnectionMessage(
    roomId: string,
    text: string,
    options?: { isSilent?: boolean; reply?: any }
  ): Promise<void> {
    await this.client.sendConnectionMessage(roomId, {
      message: {
        body: text,
        reply: options?.reply,
      },
      isSilent: options?.isSilent || false,
    });
  }

  /**
   * Send a photo to a channel
   */
  async sendChannelPhoto(
    channelId: string,
    file: Buffer,
    caption?: string,
    options?: { isSilent?: boolean; reply?: any }
  ): Promise<void> {
    await this.client.sendChannelPhoto(channelId, {
      file,
      message: {
        body: caption || '',
        reply: options?.reply,
      },
      isSilent: options?.isSilent || false,
    });
  }

  /**
   * React to a message
   */
  async reactToMessage(
    type: 'dm' | 'channel',
    messageId: string,
    emoji: string,
    add = true
  ): Promise<void> {
    await this.client.sendMessageReaction(type, messageId, {
      emoji,
      value: add,
    });
  }

  /**
   * Join a channel
   */
  async joinChannel(channelNameOrId: string): Promise<void> {
    await this.client.joinChannel(channelNameOrId);
  }

  /**
   * Leave a channel
   */
  async leaveChannel(channelNameOrId: string): Promise<void> {
    await this.client.leaveChannel(channelNameOrId);
  }

  /**
   * Get wallet information
   */
  async getWallet() {
    return this.client.getWalletKeys();
  }

  /**
   * Get bot information
   */
  async getBotInfo() {
    return this.client.getMe();
  }

  /**
   * Restart the listener (useful for error recovery)
   */
  async restart(): Promise<void> {
    this.isListening = false;
    await this.startListening();
  }

  /**
   * Stop listening to messages
   */
  stop(): void {
    this.isListening = false;
    console.log('Agent stopped listening to messages');
  }

  /**
   * Get the underlying API client for advanced usage
   */
  getClient(): SuperDappClient {
    return this.client;
  }
}
