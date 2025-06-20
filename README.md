# SuperDapp Agents SDK for Node.js/TypeScript

[![npm version](https://badge.fury.io/js/%40superdapp%2Fagents.svg)](https://badge.fury.io/js/%40superdapp%2Fagents)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A professional-grade Node.js/TypeScript SDK and CLI for building AI agents on the SuperDapp platform. This SDK provides a unified interface for creating intelligent bots that can interact with users, handle commands, and integrate with multiple large language models.

---

## 🆕 Webhook-Based Agent Architecture (v2)

**SuperDapp agents can now be built using a webhook-based architecture for maximum portability and simplicity.**

- Centralized webhook server and command/message routing in the SDK
- Agent lifecycle (init, ready, shutdown) managed by the SDK
- Pluggable command and message handlers
- Signature validation and event dispatch built-in
- Works with any HTTP hosting (Node.js, serverless, etc.)

**AppSync-based agents are still supported for real-time subscriptions.**

---

## 🚀 Features

- **🤖 Model-Agnostic AI Integration**: Seamlessly work with OpenAI, Gemini, Claude, and other LLMs
- **💬 Real-time Messaging**: Built-in support for channels and direct messages
- **🔧 CLI Tools**: AWS Amplify-inspired CLI for project management and deployment
- **📱 Command Handling**: Structured command routing and message processing
- **🔄 GraphQL Subscriptions**: Real-time message listening via AWS AppSync
- **💰 Wallet Integration**: Built-in crypto wallet functionality
- **📸 Media Support**: Send photos and handle file uploads
- **⚡ Serverless Ready**: Deploy to Cloudflare Workers, AWS Lambda, or Vercel
- **🛠 TypeScript First**: Full type safety with comprehensive TypeScript support
- **🧪 Testing Ready**: Jest setup with comprehensive test utilities

## 📦 Installation

### Using npm
```bash
npm install @superdapp/agents
```

### Using yarn
```bash
yarn add @superdapp/agents
```

### Using pnpm
```bash
pnpm add @superdapp/agents
```

### Global CLI Installation
```bash
npm install -g @superdapp/agents
```

## 🎯 Quick Start

### 1. Initialize a New Project

```bash
superagent init my-awesome-agent
cd my-awesome-agent
npm install
```

### 2. Configure Your Environment

```bash
superagent configure
```

Or manually create a `.env` file:
```env
API_TOKEN=your_superdapp_api_token_here
API_BASE_URL=https://api.superdapp.com
```

### 3. Create Your First Agent

#### Option A: AppSync (GraphQL Subscription) Agent

```typescript
import 'dotenv/config';
import { SuperDappAgent, createBotConfig } from '@superdapp/agents';

async function main() {
  // Initialize the agent
  const agent = new SuperDappAgent(createBotConfig());

  // Add command handlers
  agent.addCommand('/start', async (message, replyMessage, roomId) => {
    await agent.sendConnectionMessage(roomId, 'Hello! I\'m your SuperDapp agent!');
  });

  agent.addCommand('/help', async (message, replyMessage, roomId) => {
    const helpText = `Available commands:
/start - Start the bot
/help - Show this help
/ping - Test responsiveness`;
    
    await agent.sendConnectionMessage(roomId, helpText);
  });

  // Handle general messages
  agent.addCommand('handleMessage', async (message, replyMessage, roomId) => {
    console.log('Received:', message.body.m?.body);
    await agent.sendConnectionMessage(roomId, 'Message received! Type /help for commands.');
  });

  // Start the agent
  await agent.initialize();
  console.log('🚀 Agent is running...');
}

main().catch(console.error);
```

#### Option B: Webhook-Based Agent (Recommended)

```typescript
import 'dotenv/config';
import { WebhookAgent } from '@superdapp/agents';

async function main() {
  // Create a webhook-based agent
  const agent = new WebhookAgent({
    port: 4000, // or your preferred port
    secret: process.env.WEBHOOK_SECRET, // optional: for signature validation
    onInit: async () => console.log('[Agent] Initializing...'),
    onReady: async () => console.log('[Agent] Ready and listening!'),
    onShutdown: async () => console.log('[Agent] Shutting down...'),
  });

  // Register commands
  agent.addCommand('/start', async (event, req, res) => {
    res.writeHead(200);
    res.end('Hello! Webhook agent started.');
  });

  agent.addCommand('/ping', async (event, req, res) => {
    res.writeHead(200);
    res.end('Pong! 🏓');
  });

  // Register a generic message handler
  agent.onMessage(async (event, req, res) => {
    res.writeHead(200);
    res.end('Received your message!');
  });

  // Start the webhook server
  await agent.start();
}

main();
```

### 4. Run Your Agent

```bash
superagent run --watch
```

## 🛠 CLI Commands

The SuperDapp CLI provides powerful tools for agent development and deployment:

### `superagent init`
Initialize a new agent project with boilerplate code.

```bash
superagent init [project-name] [options]

Options:
  -n, --name <name>        Project name
  -t, --template <type>    Template (basic, webhook, news, trading)
  -y, --yes               Skip prompts and use defaults
```

**Examples:**
```bash
superagent init my-webhook-bot --template webhook
superagent init my-trading-bot --template trading
superagent init news-agent --template news --yes
```

### `superagent configure`
Set up API keys and environment variables.

```bash
superagent configure [options]

Options:
  --api-token <token>     SuperDapp API token
  --api-url <url>         API base URL
  --interactive          Interactive mode (default)
```

### `superagent run`
Run the agent locally for development and testing.

```bash
superagent run [options]

Options:
  -w, --watch            Watch for changes and restart
  -p, --port <port>      Development server port (default: 3000)
  --env <file>           Environment file (default: .env)
```

### `superagent deploy`
Deploy your agent to serverless platforms.

```bash
superagent deploy [options]

Options:
  -p, --platform <name>   Platform (cloudflare, aws, vercel)
  --env <environment>     Environment (dev, staging, prod)
  -y, --yes              Skip confirmation prompts
```

### `superagent status`
Check the status of your deployed agent.

```bash
superagent status [options]

Options:
  --api-token <token>     Override API token
  --api-url <url>         Override API URL
```

### `superagent help`
Display help information for any command.

```bash
superagent help [command]
```

## 📚 Core Concepts

### WebhookAgent (Webhook-Based)

The new class for creating webhook-based agents. Handles HTTP POSTs, command routing, and lifecycle events.

```typescript
import { WebhookAgent } from '@superdapp/agents';

const agent = new WebhookAgent({ port: 4000 });

agent.addCommand('/hello', async (event, req, res) => {
  res.writeHead(200);
  res.end('Hello from webhook!');
});

agent.onMessage(async (event, req, res) => {
  res.writeHead(200);
  res.end('Generic message received');
});

await agent.start();
```

### SuperDappAgent (AppSync-Based)

The main class for creating and managing your AI agent.

```typescript
import { SuperDappAgent, createBotConfig } from '@superdapp/agents';

const agent = new SuperDappAgent(createBotConfig());

// Add commands
agent.addCommand('/weather', async (message, replyMessage, roomId) => {
  const weather = await getWeatherData();
  await agent.sendConnectionMessage(roomId, `Current weather: ${weather}`);
});

// Initialize
await agent.initialize();
```

### Command Handling

Commands are the primary way users interact with your agent.

```typescript
// Simple command
agent.addCommand('/ping', async (message, replyMessage, roomId) => {
  await agent.sendConnectionMessage(roomId, 'Pong! 🏓');
});

// Command with arguments
agent.addCommand('/price', async (message, replyMessage, roomId) => {
  const args = message.body.m?.body?.split(' ').slice(1) || [];
  const symbol = args[0] || 'BTC';
  
  const price = await getCryptoPrice(symbol);
  await agent.sendConnectionMessage(roomId, `${symbol}: $${price}`);
});

// Handle all messages
agent.addCommand('handleMessage', async (message, replyMessage, roomId) => {
  // Process any message that doesn't match a specific command
  const response = await processWithAI(message.body.m?.body);
  await agent.sendConnectionMessage(roomId, response);
});
```

### Message Types

SuperDapp supports different types of messages:

```typescript
// Send text message
await agent.sendConnectionMessage(roomId, 'Hello, world!');

// Send to channel
await agent.sendChannelMessage(channelId, 'Channel announcement!');

// Send photo with caption
const imageBuffer = await fs.readFile('image.jpg');
await agent.sendChannelPhoto(channelId, imageBuffer, 'Check this out!');

// React to message
await agent.reactToMessage('channel', messageId, '👍', true);
```

### Environment Configuration

Add to your `.env`:
```env
API_TOKEN=your_superdapp_api_token_here
API_BASE_URL=https://api.superdapp.com
WEBHOOK_SECRET=your_webhook_secret_here
```

## 🏗 Project Templates

- **basic**: Minimal agent (supports both AppSync and webhook)
- **webhook**: Minimal webhook-only agent
- **news**: AI-powered news agent
- **trading**: Crypto trading assistant

## 🔧 Advanced Usage

### Webhook Server Customization

You can customize the webhook server (port, secret, lifecycle hooks) and register any number of command/message handlers.

### API Client Coverage

The SDK client covers all backend API endpoints, including:
- Channel and connection messages (send, update, fetch)
- Media uploads
- Message reactions
- Group join/leave/search
- Typing status
- Channel/member info
- Wallet and bot info

See the API reference and `/examples` for details.

### Custom API Client

Access the underlying API client for advanced operations:

```typescript
const client = agent.getClient();

// Get wallet information
const wallet = await client.getWalletKeys();

// Join a channel
await client.joinChannel('crypto-news');

// Custom API request
const response = await client.request('GET', 'custom-endpoint');
```

### Scheduled Tasks

Integrate with node-schedule for periodic tasks:

```typescript
import { schedule } from '@superdapp/agents';

// Schedule daily news updates
schedule.scheduleJob('0 9 * * *', async () => {
  const news = await generateDailyNews();
  await agent.sendChannelMessage('news-channel', news);
});
```

### Error Handling and Retry Logic

Built-in utilities for robust error handling:

```typescript
import { retry, sleep } from '@superdapp/agents';

// Retry API calls with exponential backoff
const data = await retry(async () => {
  return await fetchExternalAPI();
}, 3, 1000);

// Add delays
await sleep(2000); // 2 seconds
```

### Type Safety

Full TypeScript support with comprehensive types:

```typescript
import type { 
  MessageData, 
  CommandHandler, 
  BotConfig,
  ApiResponse 
} from '@superdapp/agents';

const handleCommand: CommandHandler = async (message, replyMessage, roomId) => {
  // Fully typed message object
  const messageText = message.body.m?.body;
  // ... handler logic
};
```

## 🚀 Deployment

### Cloudflare Workers

```bash
superagent deploy --platform cloudflare --env prod
```

### AWS Lambda

```bash
superagent deploy --platform aws --env prod
```

### Vercel

```bash
superagent deploy --platform vercel --env prod
```

## 🧪 Testing

Run the test suite:

```bash
npm test
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```

Example test:

```typescript
import { SuperDappAgent, createBotConfig } from '@superdapp/agents';

describe('SuperDappAgent', () => {
  let agent: SuperDappAgent;

  beforeEach(() => {
    agent = new SuperDappAgent({
      apiToken: 'test-token',
      baseUrl: 'https://api.test.com'
    });
  });

  test('should add commands', () => {
    agent.addCommand('/test', async () => {});
    expect(agent).toBeDefined();
  });
});
```

## 📖 API Reference

### SuperDappAgent Methods

#### `constructor(config: BotConfig)`
Create a new agent instance.

#### `initialize(): Promise<void>`
Initialize the agent and start listening for messages.

#### `addCommand(command: string, handler: CommandHandler, message?: any): void`
Register a command handler.

#### `sendConnectionMessage(roomId: string, text: string, options?: MessageOptions): Promise<void>`
Send a direct message.

#### `sendChannelMessage(channelId: string, text: string, options?: MessageOptions): Promise<void>`
Send a channel message.

#### `sendChannelPhoto(channelId: string, file: Buffer, caption?: string, options?: MessageOptions): Promise<void>`
Send a photo to a channel.

#### `reactToMessage(type: 'dm' | 'channel', messageId: string, emoji: string, add?: boolean): Promise<void>`
React to a message.

#### `getBotInfo(): Promise<ApiResponse<BotCredentials>>`
Get bot information.

#### `getWallet(): Promise<ApiResponse<WalletKeys>>`
Get wallet information.

### SuperDappClient Methods

#### `getMe(): Promise<ApiResponse<BotCredentials>>`
Get bot information.

#### `getChannelMessages(channelId: string, nextToken?: string): Promise<ApiResponse<ChannelMessage>>`
Retrieve channel messages.

#### `getUpdates(limitChannels?: number, limitConnections?: number): Promise<ApiResponse<UpdatesResponse>>`
Get recent updates.

#### `request<T>(method: string, endpoint: string, data?: any): Promise<ApiResponse<T>>`
Make custom API requests.

## 🛡 Error Handling

The SDK includes comprehensive error handling:

```typescript
try {
  await agent.initialize();
} catch (error) {
  if (error.message.includes('API_TOKEN')) {
    console.error('Invalid API token. Run: superagent configure');
  } else {
    console.error('Initialization failed:', error);
  }
}
```

## 🔐 Security Best Practices

1. **Never commit API tokens** to version control
2. **Use environment variables** for sensitive configuration
3. **Validate all user inputs** before processing
4. **Implement rate limiting** for command handlers
5. **Use HTTPS** for all API communications

## 📋 Examples

- **Webhook Agent**: Minimal webhook-based agent ([examples/webhook/index.ts](./examples/webhook/index.ts))
- **Basic Agent**: AppSync-based agent ([examples/basic/index.ts](./examples/basic/index.ts))
- **Advanced Agent**: Advanced features ([examples/advanced/index.ts](./examples/advanced/index.ts))

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://docs.superdapp.com)
- 💬 [Discord Community](https://discord.gg/superdapp)
- 🐛 [Issue Tracker](https://github.com/SuperDapp/superdapp-js/issues)
- 📧 [Email Support](mailto:support@superdapp.com)

## 🗺 Roadmap

- [ ] GraphQL subscription improvements
- [ ] Enhanced AI model integrations
- [ ] Advanced deployment options
- [ ] Plugin system
- [ ] Performance optimizations
- [ ] Mobile SDK support

---

**Built with ❤️ by the SuperDapp Team**
