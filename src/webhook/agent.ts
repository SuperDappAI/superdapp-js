import { Message } from '../types';
import { CommandRegistry } from './registry';

export type RequestHandler = (event: Message) => Promise<void>;

export class WebhookAgent {
  private registry: CommandRegistry;

  constructor() {
    this.registry = new CommandRegistry();
  }

  addCommand(command: string, handler: RequestHandler) {
    this.registry.registerCommand(command, handler);
  }

  addCommands(commands: Record<string, RequestHandler>) {
    for (const [cmd, handler] of Object.entries(commands)) {
      this.registry.registerCommand(cmd, handler);
    }
  }

  onMessage(handler: RequestHandler) {
    this.registry.registerMessageHandler(handler);
  }

  async processRequest(body: Message): Promise<void> {
    const message = typeof body === 'string' ? JSON.parse(body) : body;

    const extractMessageText = (payload: unknown): string => {
      if (!payload) return '';
      if (typeof payload === 'string') return payload;
      if (typeof payload !== 'object') return '';

      const obj = payload as Record<string, unknown>;
      const candidateKeys = ['text', 'body', 'message'];

      for (const key of candidateKeys) {
        const value = obj[key];
        if (typeof value === 'string') {
          return value;
        }
        if (value && typeof value === 'object') {
          const nested = (value as Record<string, unknown>).body;
          if (typeof nested === 'string') {
            return nested;
          }
        }
      }

      return '';
    };

    // Check for callback queries first
    const callbackQuery = message?.body?.m?.body?.callback_query;
    if (callbackQuery) {
      console.log('callbackQuery', callbackQuery);
      const callbackHandler = this.registry.getHandler('callback_query');
      if (callbackHandler) {
        await callbackHandler(message);
        return;
      }
    }

    // Extract message text from the webhook body
  const messagePayload = message?.body?.m as unknown;
  const messageText = extractMessageText(messagePayload);

    // Check if this is a command
    const commandHandler = this.registry.getHandlerForMessage(messageText);
    if (commandHandler) {
      await commandHandler(message);
      return;
    }

    // If no command handler, use the generic message handler
    const messageHandler = this.registry.getMessageHandler();
    if (messageHandler) {
      await messageHandler(message);
    }
  }
}
