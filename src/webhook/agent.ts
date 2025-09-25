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
    const rawText = message?.body?.m?.text ?? message?.body?.m?.body ?? '';
    const messageText = typeof rawText === 'string' ? rawText : '';

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
