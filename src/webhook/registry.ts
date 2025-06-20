import { WebhookHandler } from './server';

export class CommandRegistry {
  private commandHandlers: Record<string, WebhookHandler> = {};
  private messageHandler?: WebhookHandler;

  registerCommand(command: string, handler: WebhookHandler) {
    this.commandHandlers[command] = handler;
  }

  registerMessageHandler(handler: WebhookHandler) {
    this.messageHandler = handler;
  }

  getHandler(command: string): WebhookHandler | undefined {
    return this.commandHandlers[command];
  }

  getMessageHandler(): WebhookHandler | undefined {
    return this.messageHandler;
  }

  getAllCommands(): string[] {
    return Object.keys(this.commandHandlers);
  }
}
