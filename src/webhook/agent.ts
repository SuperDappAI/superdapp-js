import { WebhookServer, WebhookHandler, LifecycleHandler } from './server';
import { CommandRegistry } from './registry';

export interface WebhookAgentOptions {
  port?: number | undefined;
  secret?: string | undefined;
  onInit?: LifecycleHandler | undefined;
  onReady?: LifecycleHandler | undefined;
  onShutdown?: LifecycleHandler | undefined;
}

export class WebhookAgent {
  private server: WebhookServer;
  private registry: CommandRegistry;

  constructor(options: WebhookAgentOptions = {}) {
    this.registry = new CommandRegistry();
    this.server = new WebhookServer({
      port: options.port,
      secret: options.secret,
      onInit: options.onInit ?? (async () => {}),
      onReady: options.onReady ?? (async () => {}),
      onShutdown: options.onShutdown ?? (async () => {}),
    });
    // Register generic webhook handler
    this.server.registerHandler('chat', this.handleChat.bind(this));
    this.server.registerHandler('channel', this.handleChannel.bind(this));
  }

  addCommand(command: string, handler: WebhookHandler) {
    this.registry.registerCommand(command, handler);
  }

  addCommands(commands: Record<string, WebhookHandler>) {
    for (const [cmd, handler] of Object.entries(commands)) {
      this.registry.registerCommand(cmd, handler);
    }
  }

  onMessage(handler: WebhookHandler) {
    this.registry.registerMessageHandler(handler);
  }

  async start() {
    await this.server.start();
  }

  async shutdown() {
    await this.server.shutdown();
  }

  private async handleChat(event: any, req: any, res: any) {
    const messageText = event?.body?.m?.body?.toLowerCase?.() || '';
    const isCallbackQuery =
      typeof event?.body?.m === 'object' && event.body.m.body?.callback_query;
    const commands = this.registry.getAllCommands();
    const cmd = commands.find((c) => messageText.includes(c));
    if (cmd || isCallbackQuery) {
      const handler = this.registry.getHandler(cmd || 'callback_query');
      if (handler) {
        await handler(event, req, res);
        return;
      }
    }
    const messageHandler = this.registry.getMessageHandler();
    if (messageHandler) {
      await messageHandler(event, req, res);
      return;
    }
    res.writeHead(200);
    res.end('No handler');
  }

  private async handleChannel(event: any, req: any, res: any) {
    // Extend as needed for channel events
    res.writeHead(200);
    res.end('Channel event received');
  }
}
