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

  getHandlerForMessage(messageText: string | undefined): RequestHandler | undefined {
    if (!messageText) return undefined;

    // Exact match first (no trimming)
    const exact = this.commandHandlers[messageText];
    if (exact) return exact;

    const trimmed = messageText.trimStart();
    if (!trimmed) return undefined;

    const trimmedExact = this.commandHandlers[trimmed];
    if (trimmedExact) return trimmedExact;

    for (const [command, handler] of Object.entries(this.commandHandlers)) {
      if (!trimmed.startsWith(command)) continue;
      const nextChar = trimmed.charAt(command.length);
      if (!nextChar || /\s/.test(nextChar)) {
        return handler;
      }
    }

    return undefined;
  }

  getMessageHandler(): RequestHandler | undefined {
    return this.messageHandler;
  }

  getAllCommands(): string[] {
    return Object.keys(this.commandHandlers);
  }
}
