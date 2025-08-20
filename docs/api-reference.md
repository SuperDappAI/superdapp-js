# API Reference

Complete reference documentation for the SuperDapp Agents SDK.

## 📦 Core Exports

### Main Classes

```typescript
import {
  SuperDappAgent,
  SuperDappClient,
  createBotConfig,
  WebhookAgent,
} from '@superdapp/agents';
```

### Type Exports

```typescript
import type {
  BotConfig,
  MessageData,
  CommandHandler,
  ApiResponse,
  WebhookOptions,
} from '@superdapp/agents';
```

### Utility Exports

```typescript
import { retry, sleep, formatBody, validateConfig } from '@superdapp/agents';
```

## 🤖 SuperDappAgent

The main class for creating and managing AI agents.

### Constructor

```typescript
new SuperDappAgent(config: BotConfig, options?: WebhookOptions)
```

#### Parameters

- `config: BotConfig` - Agent configuration
- `options?: WebhookOptions` - Webhook server options

#### BotConfig Interface

```typescript
interface BotConfig {
  apiToken: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}
```

### Methods

#### `addCommand(command: string, handler: CommandHandler): void`

Register a command handler.

```typescript
agent.addCommand('/start', async ({ roomId }) => {
  await agent.sendConnectionMessage(roomId, 'Hello!');
});
```

#### `processRequest(body: any): Promise<void>`

Process a webhook request.

```typescript
app.post('/webhook', async (req, res) => {
  await agent.processRequest(req.body);
  res.status(200).send('OK');
});
```

#### `sendConnectionMessage(roomId: string, text: string, options?: MessageOptions): Promise<void>`

Send a message to a connection (DM).

```typescript
await agent.sendConnectionMessage('room123', 'Hello from the agent!');
```

#### `sendChannelMessage(channelId: string, text: string, options?: MessageOptions): Promise<void>`

Send a message to a channel.

```typescript
await agent.sendChannelMessage('channel123', 'Channel announcement!');
```

#### `sendReplyMarkupMessage(type: string, roomId: string, text: string, actions: any[]): Promise<void>`

Send a message with interactive markup.

```typescript
const buttons = [
  { text: 'Option 1', callback_data: 'OPTION_1' },
  { text: 'Option 2', callback_data: 'OPTION_2' },
];

await agent.sendReplyMarkupMessage('buttons', 'room123', 'Choose an option:', [
  buttons,
]);
```

#### `getClient(): SuperDappClient`

Get the underlying API client.

```typescript
const client = agent.getClient();
const wallet = await client.getWalletKeys();
```

#### `getCommands(): string[]`

Get a list of all registered command names.

```typescript
const commands = agent.getCommands();
console.log('Available commands:', commands);
// Output: ['/start', '/help', '/ping']
```

## 🔌 SuperDappClient

The API client for direct SuperDapp API access.

### Constructor

```typescript
new SuperDappClient(config: BotConfig)
```

### Methods

#### Messages

```typescript
// Send connection message
await client.sendConnectionMessage(roomId: string, data: MessageData): Promise<ApiResponse>

// Send channel message
await client.sendChannelMessage(channelId: string, data: MessageData): Promise<ApiResponse>
```

#### Channels

```typescript
// Join channel
await client.joinChannel(channelId: string): Promise<ApiResponse>

// Leave channel
await client.leaveChannel(channelId: string): Promise<ApiResponse>
```

#### Custom Requests

```typescript
// Make custom API request
await client.request(method: string, endpoint: string, data?: any): Promise<any>
```

## 🕸️ WebhookAgent

Lightweight webhook-based agent for simple use cases.

### Constructor

```typescript
new WebhookAgent();
```

### Methods

#### `addCommand(command: string, handler: RequestHandler): void`

Register a command handler.

```typescript
const webhookAgent = new WebhookAgent();

webhookAgent.addCommand('/ping', async (message) => {
  // Handle ping command
});
```

#### `addCommands(commands: Record<string, RequestHandler>): void`

Register multiple commands at once.

```typescript
webhookAgent.addCommands({
  '/start': async (message) => {
    /* handle start */
  },
  '/help': async (message) => {
    /* handle help */
  },
  '/ping': async (message) => {
    /* handle ping */
  },
});
```

#### `onMessage(handler: RequestHandler): void`

Register a general message handler.

```typescript
webhookAgent.onMessage(async (message) => {
  // Handle all messages that don't match commands
});
```

#### `processRequest(body: any): Promise<void>`

Process a webhook request.

```typescript
app.post('/webhook', async (req, res) => {
  await webhookAgent.processRequest(req.body);
  res.status(200).send('OK');
});
```

## 🛠️ Utilities

### `retry<T>(fn: () => Promise<T>, maxRetries: number, delay: number): Promise<T>`

Retry a function with exponential backoff.

```typescript
const result = await retry(async () => await fetchExternalAPI(), 3, 1000);
```

### `sleep(ms: number): Promise<void>`

Wait for a specified number of milliseconds.

```typescript
await sleep(2000); // Wait 2 seconds
```

### `formatBody(text: string): string`

Format message body with markdown support.

```typescript
const formatted = formatBody('**Bold text** and *italic*');
```

## 🔧 Configuration

### Environment Variables

| Variable       | Type   | Required | Default                    | Description         |
| -------------- | ------ | -------- | -------------------------- | ------------------- |
| `API_TOKEN`    | string | Yes      | -                          | SuperDapp API token |
| `API_BASE_URL` | string | No       | `https://api.superdapp.ai` | API base URL        |
| `NODE_ENV`     | string | No       | `production`               | Environment mode    |

### SSL Configuration

The SDK automatically configures SSL based on the `NODE_ENV`:

- **`development`**: SSL verification disabled
- **`production`**: SSL verification enabled
- **Not set**: SSL verification enabled (secure default)

## 🔗 Related Documentation

- [Quick Start Guide](./quick-start.md) - Basic setup and usage
- [CLI Guide](./cli-guide.md) - Command-line interface documentation
- [Deployment Guide](./deployment.md) - Production deployment
