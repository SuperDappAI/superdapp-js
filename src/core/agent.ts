import { WebhookAgent } from '../webhook/agent';
import { SuperDappClient } from './client';
import {
  BotConfig,
  MessageData,
  CommandHandler,
  AgentCommands,
  AgentMessages,
} from '../types';
import { formatBody } from '../utils';

export interface SuperDappAgentOptions {
  port?: number | undefined;
  secret?: string | undefined;
  onInit?: (() => Promise<void>) | undefined;
  onReady?: (() => Promise<void>) | undefined;
  onShutdown?: (() => Promise<void>) | undefined;
}

export class SuperDappAgent {
  private webhookAgent: WebhookAgent;
  private client: SuperDappClient;
  private commands: AgentCommands = {};
  private messages: AgentMessages = {};

  constructor(config: BotConfig, options: SuperDappAgentOptions = {}) {
    this.client = new SuperDappClient(config);

    this.webhookAgent = new WebhookAgent({
      port: options.port,
      secret: options.secret,
      onInit: options.onInit,
      onReady: options.onReady,
      onShutdown: options.onShutdown,
    });

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

  async sendReplyMarkupMessage(
    type: 'buttons' | 'multiselect',
    roomId: string,
    message: string,
    replyMarkup: any,
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
   * Send a message with multiselect options
   */
  async sendMessageWithMultiselect(
    roomId: string,
    message: string,
    options: Array<{ text: string; callback_data: string }>,
    config?: { isSilent?: boolean }
  ) {
    const replyMarkup = options.map((option) => [option]);
    return this.sendReplyMarkupMessage(
      'multiselect',
      roomId,
      message,
      replyMarkup,
      config
    );
  }

  /**
   * Send an image to a channel
   */
  async sendChannelImage(
    channelId: string,
    file: Buffer | NodeJS.ReadableStream,
    message: string,
    options?: { isSilent?: boolean }
  ) {
    const payload: any = {
      file,
      message: { body: message },
    };
    if (typeof options?.isSilent === 'boolean') {
      payload.isSilent = options.isSilent;
    }
    return this.client.sendChannelImage(channelId, payload);
  }

  /**
   * Get the underlying client for advanced operations
   */
  getClient(): SuperDappClient {
    return this.client;
  }

  /**
   * Start the webhook server
   */
  async start() {
    await this.webhookAgent.start();
  }

  /**
   * Shutdown the webhook server
   */
  async shutdown() {
    await this.webhookAgent.shutdown();
  }

  /**
   * Initialize the agent (alias for start)
   */
  async initialize() {
    await this.start();
  }

  private createCommandWrapper(handler: CommandHandler) {
    return async (rawMessage: any, req: any, res: any) => {
      try {
        const message = this.parseMessage(rawMessage);
        const roomId = this.getRoomId(message);
        const replyMessage = this.messages[message.command || ''] || null;

        await handler({
          message,
          replyMessage,
          roomId,
        });

        res.writeHead(200);
        res.end('OK');
      } catch (error) {
        console.error('Command handler error:', error);
        res.writeHead(500);
        res.end('Internal error');
      }
    };
  }

  private async handleMessage(rawMessage: any, req: any, res: any) {
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
        }
      }

      res.writeHead(200);
      res.end('OK');
    } catch (error) {
      console.error('Message handler error:', error);
      res.writeHead(500);
      res.end('Internal error');
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

  private parseMessage(rawMessage: any): MessageData {
    // Parse the message body if it's a string
    if (typeof rawMessage.body.m === 'string') {
      try {
        const decoded = decodeURIComponent(rawMessage.body.m);
        rawMessage.body.m = JSON.parse(decoded);
      } catch (error) {
        // If parsing fails, keep as string
        console.log('Error parsing message body:', error);
      }
    }

    // Extract command from message
    let command = '';
    let callback_command = '';
    let data = '';

    // Check if it's a callback query first
    const isCallbackQuery = this.isCallbackQuery(rawMessage);

    if (isCallbackQuery) {
      // For callback queries, set command to 'callback_query' and extract data
      command = 'callback_query';
      [callback_command, data] =
        rawMessage.body.m.body.callback_query.split(':');
    } else if (rawMessage.body.m && typeof rawMessage.body.m === 'object') {
      if (rawMessage.body.m.text) {
        data = rawMessage.body.m.text.toLowerCase().trim();
      } else if (rawMessage.body.m.body) {
        data = rawMessage.body.m.body.toLowerCase().trim();
      } else if (rawMessage.body.m.message) {
        data = rawMessage.body.m.message.toLowerCase().trim();
      }
    } else if (typeof rawMessage.body.m === 'string') {
      data = rawMessage.body.m.toLowerCase().trim();
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

  private isCallbackQuery(rawMessage: any): boolean {
    const body = rawMessage?.body || rawMessage;
    return typeof body.m === 'object' && body.m.body?.callback_query;
  }
}
