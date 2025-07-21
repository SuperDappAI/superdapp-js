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
    message: string | any,
    options?: { isSilent?: boolean }
  ) {
    const messageBody =
      typeof message === 'string' ? { body: message } : message;
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
    message: string | any,
    options?: { isSilent?: boolean }
  ) {
    const messageBody =
      typeof message === 'string' ? { body: message } : message;
    return this.client.sendChannelMessage(channelId, {
      message: messageBody,
      isSilent: options?.isSilent || false,
    });
  }

  /**
   * Send a message with reply markup (buttons, multiselect, etc.)
   */
  async sendMessageWithReplyMarkup(
    roomId: string,
    message: string,
    replyMarkup: any,
    options?: { isSilent?: boolean }
  ) {
    const formattedMessage = formatBody(message, replyMarkup);
    return this.sendConnectionMessage(roomId, formattedMessage, options);
  }

  /**
   * Send a message with button actions
   */
  async sendMessageWithButtons(
    roomId: string,
    message: string,
    buttons: Array<{ text: string; callback_data: string }>,
    options?: { isSilent?: boolean }
  ) {
    const replyMarkup = {
      type: 'buttons',
      actions: buttons.map((button) => [button]),
    };
    return this.sendMessageWithReplyMarkup(
      roomId,
      message,
      replyMarkup,
      options
    );
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
    const replyMarkup = {
      type: 'multiselect',
      actions: options.map((option) => [option]),
    };
    return this.sendMessageWithReplyMarkup(
      roomId,
      message,
      replyMarkup,
      config
    );
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
    return async (event: any, req: any, res: any) => {
      try {
        const message = this.parseMessage(event);
        const roomId = this.getRoomId(message);
        const replyMessage = this.messages[message.command || ''] || null;

        await handler(message, replyMessage, roomId);

        res.writeHead(200);
        res.end('OK');
      } catch (error) {
        console.error('Command handler error:', error);
        res.writeHead(500);
        res.end('Internal error');
      }
    };
  }

  private async handleMessage(event: any, req: any, res: any) {
    try {
      const message = this.parseMessage(event);
      const roomId = this.getRoomId(message);

      // Check if it's a callback query
      const isCallbackQuery = this.isCallbackQuery(event);

      if (isCallbackQuery) {
        await this.handleCallbackQuery(message, roomId);
      } else {
        // Handle as general message
        const generalHandler = this.commands['handleMessage'];
        if (generalHandler) {
          await generalHandler(message, null, roomId);
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
      await callbackHandler(message, null, roomId);
    }
  }

  private parseMessage(event: any): MessageData {
    const body = event?.body || event;

    // Parse the message body if it's a string
    if (typeof body.m === 'string') {
      try {
        const decoded = decodeURIComponent(body.m);
        body.m = JSON.parse(decoded);
      } catch (error) {
        // If parsing fails, keep as string
        console.log('Error parsing message body:', error);
      }
    }

    // Extract command from message
    let command = '';
    let messageText = '';

    if (body.m && typeof body.m === 'object') {
      if (body.m.text) {
        messageText = body.m.text.toLowerCase().trim();
      } else if (body.m.body) {
        messageText = body.m.body.toLowerCase().trim();
      } else if (body.m.message) {
        messageText = body.m.message.toLowerCase().trim();
      }
    } else if (typeof body.m === 'string') {
      messageText = body.m.toLowerCase().trim();
    }

    // Find matching command
    const availableCommands = Object.keys(this.commands);
    command =
      availableCommands.find(
        (cmd) =>
          messageText === cmd.toLowerCase() ||
          messageText.startsWith(cmd.toLowerCase() + ' ')
      ) || '';

    return {
      ...body,
      command,
      messageText,
    } as MessageData;
  }

  private getRoomId(message: MessageData): string {
    return message.memberId !== message.senderId
      ? `${message.memberId}-${message.senderId}`
      : `${message.owner}-${message.senderId}`;
  }

  private isCallbackQuery(event: any): boolean {
    const body = event?.body || event;
    return typeof body.m === 'object' && body.m.body?.callback_query;
  }
}
