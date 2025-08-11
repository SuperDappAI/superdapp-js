import http from 'http';
import { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

export type WebhookHandler = (
  event: any,
  req: IncomingMessage,
  res: ServerResponse
) => Promise<void>;
export type LifecycleHandler = () => Promise<void>;

interface WebhookServerOptions {
  port?: number | undefined;
  secret?: string | undefined;
  onInit?: LifecycleHandler | undefined;
  onReady?: LifecycleHandler | undefined;
  onShutdown?: LifecycleHandler | undefined;
}

export class WebhookServer {
  private handlers: Record<string, WebhookHandler> = {};
  private options: WebhookServerOptions;
  private server?: http.Server;

  constructor(options: WebhookServerOptions = {}) {
    this.options = options;
  }

  registerHandler(eventType: string, handler: WebhookHandler) {
    this.handlers[eventType] = handler;
  }

  async start() {
    if (this.options.onInit) await this.options.onInit();
    this.server = http.createServer(this.requestListener.bind(this));
    this.server.listen(this.options.port || 8787, async () => {
      if (this.options.onReady) await this.options.onReady();
      console.log(
        `[WebhookServer] Listening on port ${this.options.port || 8787}`
      );
    });
    process.on('SIGINT', async () => {
      await this.shutdown();
      process.exit(0);
    });
  }

  private async requestListener(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== 'POST' || req.url !== '/webhook') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        // Signature validation (if secret provided)
        if (this.options.secret) {
          const signature = req.headers['x-signature'] as string;
          const expected = crypto
            .createHmac('sha256', this.options.secret)
            .update(body)
            .digest('hex');
          if (signature !== expected) {
            res.writeHead(401);
            res.end('Invalid signature');
            return;
          }
        }
        const event = JSON.parse(body);

        const eventBody =
          typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        event.body = eventBody;

        const type = event?.body?.t;
        if (type && this.handlers[type]) {
          await this.handlers[type](event, req, res);
        } else {
          res.writeHead(400);
          res.end('Unknown event type');
        }
      } catch (err) {
        console.error('[WebhookServer] Error:', err);
        res.writeHead(500);
        res.end('Internal error');
      }
    });
  }

  async shutdown() {
    if (this.server) {
      this.server.close();
      if (this.options.onShutdown) await this.options.onShutdown();
      console.log('[WebhookServer] Shutdown complete');
    }
  }
}
