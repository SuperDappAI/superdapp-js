import { WebhookAgent } from '../webhook/agent';
import { SuperDappClient } from './client';
import {
  BotConfig,
  MessageData,
  CommandHandler,
  AgentCommands,
  AgentMessages,
  ReplyMarkupAction,
  Message,
  MessageContent,
  AIAgentConfig,
} from '../types';
import { formatBody } from '../utils/messageFormatter';

// AI Client interface for minimal coupling
interface AIClient {
  generateText(input: string | Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, options?: any): Promise<string>;
  streamText(input: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, options?: any): Promise<AsyncIterable<string>>;
  runAgent(options?: any): Promise<{ outputText: string }>;
}

export interface SuperDappAgentOptions {
  secret?: string | undefined;
}

export class SuperDappAgent {
  private webhookAgent: WebhookAgent;
  private client: SuperDappClient;
  private commands: AgentCommands = {};
  private messages: AgentMessages = {};
  private aiConfig?: AIAgentConfig;
  private aiClient?: AIClient;

  constructor(config: BotConfig) {
    this.client = new SuperDappClient(config);

    // Store AI config if provided
    if (config.ai) {
      this.aiConfig = config.ai;
    }

    this.webhookAgent = new WebhookAgent();

    // Register default message handler
    this.webhookAgent.onMessage(this.handleMessage.bind(this));
  }

  /**
   * Add a command handler
   */
  addCommand(command: string, handler: CommandHandler) {
    this.commands[command] = handler;
    this.webhookAgent.addCommand(
      command,
      this.createCommandWrapper(handler).bind(this)
    );
  }

  /**
   * Add multiple commands at once
   */
  addCommands(commands: AgentCommands) {
    for (const [command, handler] of Object.entries(commands)) {
      this.addCommand(command, handler);
    }
  }

  /**
   * Add message templates
   */
  addMessages(messages: AgentMessages) {
    this.messages = { ...this.messages, ...messages };
  }

  /**
   * Process a webhook request body
   */
  async processRequest(body: unknown): Promise<void> {
    await this.webhookAgent.processRequest(body as Message);
  }

  /**
   * Send a message to a connection (DM)
   */
  async sendConnectionMessage(
    roomId: string,
    message: string,
    options?: { isSilent?: boolean }
  ) {
    const messageBody = { body: formatBody(message) };
    return this.client.sendConnectionMessage(roomId, {
      message: messageBody,
      isSilent: options?.isSilent || false,
    });
  }

  /**
   * Send a message to a channel
   */
  async sendChannelMessage(
    channelId: string,
    message: string,
    options?: { isSilent?: boolean }
  ) {
    const messageBody = { body: formatBody(message) };
    return this.client.sendChannelMessage(channelId, {
      message: messageBody,
      isSilent: options?.isSilent || false,
    });
  }

  /**
   * Send a message with reply markup
   */
  async sendReplyMarkupMessage(
    type: 'buttons' | 'multiselect',
    roomId: string,
    message: string,
    replyMarkup: ReplyMarkupAction[][],
    options?: { isSilent?: boolean }
  ) {
    const markup = {
      ...(type === 'multiselect' ? { type } : {}),
      actions: replyMarkup,
    };

    const formattedMessage = formatBody(message, markup);
    const messageBody = { body: formattedMessage };
    return this.client.sendConnectionMessage(roomId, {
      message: messageBody,
      isSilent: options?.isSilent || false,
    });
  }

  /**
   * Get the underlying client for advanced operations
   */
  getClient(): SuperDappClient {
    return this.client;
  }

  /**
   * Get the AI client for LLM operations
   * @throws Error if AI is not configured
   */
  async getAiClient(): Promise<AIClient> {
    if (!this.aiConfig) {
      throw new Error('AI is not configured for this agent. Please provide ai configuration in BotConfig to use AI features.');
    }
    
    if (!this.aiClient) {
      // Lazy load the AI client to avoid import issues when AI is not used
      this.aiClient = await this.createAiClient();
    }
    
    return this.aiClient;
  }

  private async createAiClient(): Promise<AIClient> {
    // Dynamic import to avoid loading AI dependencies when not needed
    const { generateText, streamText, runAgent } = await import('../ai/client');
    
    return {
      generateText: (input: any, options: any = {}) => {
        return generateText(input, { ...options, config: this.aiConfig });
      },
      streamText: (input: any, options: any = {}) => {
        return streamText(input, { ...options, config: this.aiConfig });
      },
      runAgent: (options: any = {}) => {
        return runAgent({ ...options, config: this.aiConfig });
      },
    };
  }

  private createCommandWrapper(handler: CommandHandler) {
    return async (rawMessage: Message) => {
      try {
        const message = this.parseMessage(rawMessage);
        const roomId = this.getRoomId(message);
        const replyMessage = this.messages[message.command || ''] || null;

        await handler({
          message,
          replyMessage,
          roomId,
        });
      } catch (error) {
        console.error('Command handler error:', error);
      }
    };
  }

  getCommands() {
    return Object.keys(this.commands);
  }

  private async handleMessage(rawMessage: Message) {
    try {
      const message = this.parseMessage(rawMessage);
      const roomId = this.getRoomId(message);

      // Check if it's a callback query
      const isCallbackQuery = this.isCallbackQuery(rawMessage);

      if (isCallbackQuery) {
        await this.handleCallbackQuery(message, roomId);
      } else {
        // Handle as general message
        const handler = this.commands[message.command || ''];
        if (handler) {
          await handler({
            message,
            replyMessage: null,
            roomId,
          });
        } else {
          // Fallback: if no specific command matched, call a generic handler when provided
          const fallbackMessageHandler =
            this.commands['/message'] ||
            this.commands['message'] ||
            this.commands['handleMessage'];
          if (fallbackMessageHandler) {
            await fallbackMessageHandler({
              message,
              replyMessage: null,
              roomId,
            });
          }
        }
      }
    } catch (error) {
      console.error('Message handler error:', error);
    }
  }

  private async handleCallbackQuery(message: MessageData, roomId: string) {
    const callbackHandler = this.commands['callback_query'];
    if (callbackHandler) {
      await callbackHandler({
        message,
        replyMessage: null,
        roomId,
      });
    }
  }

  private parseMessage(rawMessage: Message): MessageData {
    // Parse the message body if it's a string
    let body = rawMessage.body;

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (error) {
        console.error('Error parsing message body as JSON:', { body, error });
      }
    }

    if (typeof body.m === 'string') {
      try {
        const decoded = decodeURIComponent(body.m);
        body.m = JSON.parse(decoded);
      } catch (error) {
        // If parsing fails, keep as string
        console.error('Error parsing message body:', error);
      }
    }

    rawMessage.body = body;

    // Extract command from message
    let command = '';
    let callback_command = '';
    let data = '';

    // Check if it's a callback query first
    const isCallbackQuery = this.isCallbackQuery(rawMessage);

    if (isCallbackQuery) {
      // For callback queries, set command to 'callback_query' and extract data
      command = 'callback_query';
      const messageContent = body.m as MessageContent;
      if (
        typeof messageContent.body === 'object' &&
        messageContent.body.callback_query
      ) {
        const parts = messageContent.body.callback_query.split(':');
        callback_command = parts[0] || '';
        data = parts[1] || '';
      }
    } else if (body.m && typeof body.m === 'object') {
      const messageContent = body.m as MessageContent;
      if (messageContent.text) {
        data = messageContent.text.toLowerCase().trim();
      } else if (
        messageContent.body &&
        typeof messageContent.body === 'string'
      ) {
        data = messageContent.body.toLowerCase().trim();
      } else if (messageContent.message) {
        data = messageContent.message.toLowerCase().trim();
      }
    } else if (typeof body.m === 'string') {
      data = body.m.toLowerCase().trim();
    }

    // Find matching command (only for non-callback queries)
    if (!isCallbackQuery) {
      const availableCommands = Object.keys(this.commands);
      command =
        availableCommands.find(
          (cmd) =>
            data === cmd.toLowerCase() ||
            data.startsWith(cmd.toLowerCase() + ' ')
        ) || '';
    }

    return {
      rawMessage,
      body: rawMessage.body,
      command,
      callback_command,
      data,
    } as MessageData;
  }

  private getRoomId(message: MessageData): string {
    return message.rawMessage.memberId !== message.rawMessage.senderId
      ? `${message.rawMessage.memberId}-${message.rawMessage.senderId}`
      : `${message.rawMessage.owner}-${message.rawMessage.senderId}`;
  }

  private isCallbackQuery(rawMessage: Message): boolean {
    const body = rawMessage?.body;
    if (!body || typeof body.m !== 'object') {
      return false;
    }
    const messageContent = body.m as MessageContent;
    const callbackQuery =
      typeof messageContent?.body === 'object' &&
      Object.hasOwn(messageContent?.body, 'callback_query');

    return callbackQuery;
  }
}
