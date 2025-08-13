# SuperDapp Agents SDK for Node.js/TypeScript

[![npm version](https://badge.fury.io/js/%40superdapp%2Fagents.svg)](https://badge.fury.io/js/%40superdapp%2Fagents)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A professional-grade Node.js/TypeScript SDK and CLI for building AI agents on the SuperDapp platform. This SDK provides a unified interface for creating intelligent bots that can interact with users, handle commands, and integrate with multiple large language models.

---

## 🚀 Webhook-Based Agent Architecture (v2)

**SuperDapp agents now use a webhook-based architecture for maximum portability and simplicity.**

- Centralized webhook server and command/message routing in the SDK
- Agent lifecycle (init, ready, shutdown) managed by the SDK
- Pluggable command and message handlers
- Interactive UI support (buttons, multiselect, reply markup)
- Signature validation and event dispatch built-in
- Works with any HTTP hosting (Node.js, serverless, etc.)

**This is the new default architecture for all SuperDapp agents.**

---

## 🚦 CLI Usage

### Project Initialization

You can now use a positional argument for the project directory:

```bash
superagent init my-awesome-agent
superagent init /tmp/my-temp-agent --template news -y
```

Or use the legacy flag:

```bash
superagent init --name my-awesome-agent
```

### CLI Templates

- `basic` – Minimal agent with command handling (default)
- `news` – AI-powered news agent
- `trading` – Crypto trading agent

### Example

```bash
superagent init my-agent --template news -y
cd my-agent
npm install
superagent configure
superagent run
```

---

## 🧑‍💻 CLI Commands

- `superagent init [directory]` – Initialize a new agent project (supports positional or --name)
- `superagent configure` – Configure API keys and environment variables
- `superagent run` – Run the agent locally for testing
- `superagent deploy` – Deploy agent to serverless platforms (cloudflare, aws, vercel)
- `superagent status` – Check the status of the deployed agent

---

## 🎯 Features

- 🤖 Model-Agnostic AI Integration: Seamlessly work with OpenAI, Gemini, Claude, and other LLMs
- 💬 Real-time Messaging: Built-in support for channels and direct messages
- 🔧 CLI Tools: AWS Amplify-inspired CLI for project management and deployment
- 📱 Command Handling: Structured command routing and message processing
- 🔄 GraphQL Subscriptions: Real-time message listening via AWS AppSync
- 💰 Wallet Integration: Built-in crypto wallet functionality
- 📸 Media Support: Send photos and handle file uploads
- ⚡ Serverless Ready: Deploy to Cloudflare Workers, AWS Lambda, or Vercel
- 🛠️ TypeScript First: Full type safety with comprehensive TypeScript support
- 🧪 Testing Ready: Jest setup with comprehensive test utilities

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

## 🛠️ Development

For local development and testing, see [DEVELOPMENT.md](./DEVELOPMENT.md) for instructions on setting up the development environment using `npm link`.
pnpm add @superdapp/agents
```

### Global CLI Installation

```bash
npm install -g @superdapp/agents
```

## 🎉 Quick Start

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
API_BASE_URL=https://api.superdapp.ai
```

### 3. Create Your First Agent

```typescript
import 'dotenv/config';
import { SuperDappAgent, createBotConfig } from '@superdapp/agents';

async function main() {
  try {
    // Initialize the agent with webhook configuration
    const agent = new SuperDappAgent(createBotConfig(), {
      port: 3000,
      onReady: async () => {
        console.log('Basic agent webhook server is ready!');
      },
    });

    // Add basic commands
    agent.addCommand('/start', async ({ roomId }) => {
      await agent.sendConnectionMessage(
        roomId,
        "👋 **Hello!** I'm a basic SuperDapp agent."
      );
    });

    agent.addCommand('/ping', async ({ roomId }) => {
      await agent.sendConnectionMessage(
        roomId,
        '🏓 **Pong!** Bot is responsive!'
      );
    });

    agent.addCommand('/help', async ({ roomId }) => {
      const helpText = `📋 **Available Commands**

🚀 \`/start\` - Start the bot
🏓 \`/ping\` - Test bot responsiveness
❓ \`/help\` - Show this help`;
      await agent.sendConnectionMessage(roomId, helpText);
    });

    // Add a command with buttons
    agent.addCommand('/menu', async ({ roomId }) => {
      const buttons = [
        { text: '🔘 Option 1', callback_data: 'OPTION_1' },
        { text: '🔘 Option 2', callback_data: 'OPTION_2' },
      ];

      await agent.sendReplyMarkupMessage(
        'buttons',
        roomId,
        '🎯 **Choose an option:**',
        [buttons] // Array de arrays para compatibilidade
      );
    });

    // Handle callback queries
    agent.addCommand('callback_query', async ({ message, roomId }) => {
      console.log('Callback query received:', message);

      // The callback_data is automatically parsed into:
      // - message.callback_command: The command part (before the colon)
      // - message.data: The value part (after the colon)

      await agent.sendConnectionMessage(
        roomId,
        `✅ **You selected:** ${message.callback_command} with value: ${message.data}`
      );
    });

    // Handle general messages
    agent.addCommand('handleMessage', async ({ message, roomId }) => {
      console.log('Received message:', message.messageText);
      await agent.sendConnectionMessage(
        roomId,
        '📨 **I received your message!** Type `/help` for available commands.'
      );
    });

    // Start the webhook server
    await agent.start();
    console.log('Basic agent webhook server is running on port 3000...');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

## 🔗 Callback Query Best Practices

### ⚠️ **IMPORTANT: Use the `COMMAND:VALUE` format when needed**

When creating interactive buttons and handling callback queries, use the colon (`:`) separator in your `callback_data` when you need to map multiple commands with different values. This enables proper parsing and command routing.

### ✅ **Correct Format:**

```typescript
// Define buttons with proper COMMAND:VALUE format
const buttons = [
  { text: '💰 BTC Price', callback_data: 'PRICE:BTC' },
  { text: '📰 Latest News', callback_data: 'GET_NEWS:' },
  { text: '📂 Topics', callback_data: 'GET_TOPICS:' },
  { text: '🔔 Subscribe', callback_data: 'SUBSCRIBE:' },
];

// Handle callback queries using message.callback_command
agent.addCommand('callback_query', async ({ message, roomId }) => {
  console.log('Callback query received:', message);

  // The callback_data is automatically parsed into:
  // - message.callback_command: The command part (before the colon)
  // - message.data: The value part (after the colon)

  switch (message.callback_command) {
    case 'PRICE':
      const symbol = message.data || '';
      const price = await getPrice(symbol);
      await agent.sendConnectionMessage(
        roomId,
        `💰 **${symbol} Price:** ${price}`
      );
      break;

    case 'GET_NEWS':
      const news = await getLatestNews();
      await agent.sendConnectionMessage(
        roomId,
        `📰 **Latest News**\n\n${news}`
      );
      break;

    case 'GET_TOPICS':
      const topics = await getAvailableTopics();
      await agent.sendConnectionMessage(
        roomId,
        `📂 **Available topics:** ${topics.join(', ')}`
      );
      break;

    default:
      await agent.sendConnectionMessage(
        roomId,
        '❌ **Unknown option selected.**'
      );
  }
});
```

### ❌ **Incorrect Format (Avoid):**

```typescript
// DON'T do this - no colon separator
const buttons = [
  { text: '💰 BTC Price', callback_data: 'PRICE_BTC' }, // ❌ Wrong
  { text: '📰 Latest News', callback_data: 'GET_NEWS' }, // ❌ Wrong
];

// DON'T use callbackData?.startsWith() - deprecated
agent.addCommand('callback_query', async ({ message, roomId }) => {
  const callbackData = message.data;

  if (callbackData?.startsWith('PRICE_')) {
    // ❌ Deprecated
    // ...
  }
});
```

### 🎯 **When to Use This Format:**

1. **Multiple Commands with Values**: When you have the same command type but different values (e.g., `PRICE:BTC`, `PRICE:ETH`)
2. **Dynamic Content**: When generating buttons from arrays or lists
3. **Command Parameters**: When you need to pass data to your command handlers
4. **Automatic Parsing**: The SDK automatically parses `COMMAND:VALUE` format into `message.callback_command` and `message.data`
5. **Cleaner Code**: No need for string manipulation with `startsWith()` or `replace()`

### 📝 **When to Use COMMAND:VALUE Format:**

#### ✅ **Use when you have multiple commands with different values:**

```typescript
// Multiple price buttons for different cryptocurrencies
callback_data: 'PRICE:BTC';
callback_data: 'PRICE:ETH';
callback_data: 'PRICE:ADA';

// Multiple topic buttons
callback_data: 'TOPIC:CRYPTO';
callback_data: 'TOPIC:BLOCKCHAIN';
callback_data: 'TOPIC:DEFI';

// Channel management
callback_data: 'JOIN_CHANNEL:my-channel';
callback_data: 'LEAVE_CHANNEL:12345';
```

#### ✅ **Use for dynamic content from arrays:**

```typescript
const topics = ['crypto', 'blockchain', 'defi'];
const options = topics.map((topic) => ({
  text: topic,
  callback_data: `TOPIC:${topic.toUpperCase()}`,
}));
```

#### ❌ **Don't use when you have simple, unique commands:**

```typescript
// Simple unique commands - no colon needed
callback_data: 'GET_NEWS';
callback_data: 'GET_TOPICS';
callback_data: 'SUBSCRIBE';
callback_data: 'CONFIRM_TOPICS';
```

### 4. Run Your Agent

```bash
superagent run --watch
```

## 📚 Core Concepts

### SuperDappAgent (Webhook-Based)

The main class for creating and managing your AI agent with webhook support.

```typescript
import { SuperDappAgent, createBotConfig } from '@superdapp/agents';

const agent = new SuperDappAgent(createBotConfig(), {
  port: 3000,
  secret: process.env.WEBHOOK_SECRET,
});

// Add commands
agent.addCommand('/weather', async ({ roomId }) => {
  const weather = await getWeatherData();
  await agent.sendConnectionMessage(
    roomId,
    `🌤️ **Current weather:** ${weather}`
  );
});

// Add interactive buttons
agent.addCommand('/menu', async ({ roomId }) => {
  const buttons = [
    { text: '🌤️ Weather', callback_data: 'GET_WEATHER' },
    { text: '📰 News', callback_data: 'GET_NEWS' },
  ];

  await agent.sendReplyMarkupMessage(
    'buttons',
    roomId,
    '🎯 **Choose an option:**',
    [buttons] // Array de arrays para compatibilidade
  );
});

// Handle callback queries
agent.addCommand('callback_query', async ({ message, roomId }) => {
  // The callback_data is automatically parsed into message.callback_command and message.data
  switch (message.callback_command) {
    case 'GET_WEATHER':
      const weather = await getWeatherData();
      await agent.sendConnectionMessage(roomId, `🌤️ **Weather:** ${weather}`);
      break;
    case 'GET_NEWS':
      const news = await getLatestNews();
      await agent.sendConnectionMessage(roomId, `📰 **News:** ${news}`);
      break;
  }
});

// Start the webhook server
await agent.start();
```

### Command Handling

Commands are the primary way users interact with your agent.

```typescript
// Simple command
agent.addCommand('/ping', async ({ roomId }) => {
  await agent.sendConnectionMessage(roomId, '🏓 **Pong!** Bot is responsive!');
});

// Command with arguments
agent.addCommand('/price', async ({ message, roomId }) => {
  const args = message.messageText?.split(' ').slice(1) || [];
  const symbol = args[0] || 'BTC';

  const price = await getCryptoPrice(symbol);
  await agent.sendConnectionMessage(roomId, `💰 **${symbol}:** $${price}`);
});

// Handle all messages
agent.addCommand('handleMessage', async ({ message, roomId }) => {
  // Process any message that doesn't match a specific command
  const response = await processWithAI(message.messageText);
  await agent.sendConnectionMessage(roomId, response);
});
```

### Interactive UI

The SDK supports interactive UI elements like buttons and multiselect options.

```typescript
// Send message with buttons
agent.addCommand('/menu', async ({ roomId }) => {
  const buttons = [
    { text: '🔘 Option 1', callback_data: 'OPTION_1' },
    { text: '🔘 Option 2', callback_data: 'OPTION_2' },
  ];

  await agent.sendReplyMarkupMessage(
    'buttons',
    roomId,
    '🎯 **Choose an option:**',
    [buttons] // Array de arrays para compatibilidade
  );
});

// Send message with multiselect
agent.addCommand('/topics', async ({ roomId }) => {
  const topics = ['Crypto', 'Tech', 'News', 'Sports', 'Politics'];

  const topicsReplyMarkup = {
    type: 'multiselect',
    actions: [
      ...topics.map((topic, idx) => [
        {
          index: `${idx + 1}`,
          text: `${idx + 1} - ${topic}`,
          callback_data: `TOPIC_SELECTION:${topic}`,
        },
      ]),
      [
        {
          text: '✅ Confirm Selection',
          callback_data: 'CONFIRM_TOPICS:',
        },
      ],
    ],
  };

  await agent.sendReplyMarkupMessage(
    'multiselect',
    roomId,
    '📝 **Select topics:**',
    topicsReplyMarkup.actions
  );
});

// Handle callback queries
agent.addCommand('callback_query', async ({ message, roomId }) => {
  const callbackData = message.data;

  switch (callbackData) {
    case 'OPTION_1':
      await agent.sendConnectionMessage(
        roomId,
        '✅ **You selected Option 1!**'
      );
      break;
    case 'OPTION_2':
      await agent.sendConnectionMessage(
        roomId,
        '✅ **You selected Option 2!**'
      );
      break;
    case 'CONFIRM_TOPICS:':
      await agent.sendConnectionMessage(roomId, '✅ **Topics confirmed!**');
      break;
    default:
      // Handle topic selection (e.g., "TOPIC_SELECTION:Crypto")
      if (callbackData?.startsWith('TOPIC_SELECTION:')) {
        const topic = callbackData.split(':')[1];
        await agent.sendConnectionMessage(
          roomId,
          `📌 **Topic "${topic}" selected!**`
        );
      } else {
        await agent.sendConnectionMessage(
          roomId,
          '❌ **Unknown option selected.**'
        );
      }
  }
});
```

### Message Types

SuperDapp supports different types of messages:

```typescript
// Send text message
await agent.sendConnectionMessage(roomId, 'Hello, world!');

// Send to channel
await agent.sendChannelMessage(channelId, 'Channel announcement!');

// React to message
await agent.reactToMessage('channel', messageId, '👍', true);
```

### Environment Configuration

Add to your `.env`:

```env
API_TOKEN=your_superdapp_api_token_here
API_BASE_URL=https://api.superdapp.ai
WEBHOOK_SECRET=your_webhook_secret_here
NODE_ENV=development  # Optional: 'development', 'production', or 'test'
```

**SSL Configuration:**

- In `development` mode (`NODE_ENV=development`): SSL verification is disabled for easier local development
- In `production` mode (`NODE_ENV=production`): SSL verification is enabled for security
- In `test` mode (`NODE_ENV=test`): SSL verification is enabled for secure testing
- When `NODE_ENV` is not set: SSL verification is enabled by default (secure behavior)

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
const data = await retry(
  async () => {
    return await fetchExternalAPI();
  },
  3,
  1000
);

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
  ApiResponse,
} from '@superdapp/agents';

const handleCommand: CommandHandler = async (message, replyMessage, roomId) => {
  // Fully typed message object
  const messageText = message.body.m?.body;
  // ... handler logic
};
```

### SSL Configuration Testing

You can test the SSL configuration behavior using the provided demo:

```bash
# Test in development mode (SSL disabled)
NODE_ENV=development node examples/ssl-config-demo.ts

# Test in production mode (SSL enabled)
NODE_ENV=production node examples/ssl-config-demo.ts

# Test in test mode (SSL enabled)
NODE_ENV=test node examples/ssl-config-demo.ts

# Test with no NODE_ENV (SSL enabled by default)
node examples/ssl-config-demo.ts
```

**Security Best Practices:**

- Always use `NODE_ENV=production` in production environments
- Use `NODE_ENV=development` only for local development
- SSL verification is automatically enabled in production, test, and when NODE_ENV is not set
- Use valid SSL certificates in production
- Monitor SSL certificate expiration dates

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
      baseUrl: 'https://api.test.com',
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

### Sending Messages

#### Send a message to a channel

```typescript
const client = new SuperDappClient({ apiToken: 'YOUR_TOKEN' });

await client.sendChannelMessage('CHANNEL_ID', {
  message: { body: 'Hello, channel!' },
});
```

#### Send a message to a connection (DM)

```typescript
const client = new SuperDappClient({ apiToken: 'YOUR_TOKEN' });

await client.sendConnectionMessage('ROOM_ID', {
  message: { body: 'Hello, user!' },
});
```
