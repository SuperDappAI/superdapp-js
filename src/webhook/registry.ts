import { RequestHandler } from './agent';

export class CommandRegistry {
  private commandHandlers: Record<string, RequestHandler> = {};
  private messageHandler?: RequestHandler;

  registerCommand(command: string, handler: RequestHandler) {
    this.commandHandlers[command] = handler;
  }

  registerMessageHandler(handler: RequestHandler) {
    this.messageHandler = handler;
  }

  getHandler(command: string): RequestHandler | undefined {
    return this.commandHandlers[command];
  }

  getMessageHandler(): RequestHandler | undefined {
    return this.messageHandler;
  }

  getAllCommands(): string[] {
    return Object.keys(this.commandHandlers);
  }
}
