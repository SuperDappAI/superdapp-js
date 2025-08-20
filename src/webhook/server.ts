import { Message } from '@/types';
import { IncomingMessage, ServerResponse } from 'http';

export type WebhookHandler = (
  event: Message,
  req: IncomingMessage,
  res: ServerResponse
) => Promise<void>;
export type LifecycleHandler = () => Promise<void>;

export class WebhookServer {
  private handlers: Record<string, WebhookHandler> = {};

  registerHandler(eventType: string, handler: WebhookHandler) {
    this.handlers[eventType] = handler;
  }
}
