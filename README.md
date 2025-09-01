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

## 🆕 Latest Updates

### v1.0.0 - Production Ready Release

- ✅ **Complete Webhook Support** - Full webhook-based agent architecture
- ✅ **Enhanced CLI** - New `create` command and improved project management
- ✅ **Interactive UI** - Advanced button layouts and multiselect support
- ✅ **Multi-Platform Deployment** - Cloudflare Workers, AWS Lambda and Docker
- ✅ **Comprehensive Documentation** - Complete guides and API reference
- ✅ **TypeScript Support** - Full type safety and IntelliSense
- ✅ **Testing Framework** - Jest setup with utilities and mocks

---

## 🚦 CLI Usage

### Project Initialization

You can now use a positional argument for the project directory:

```bash
superagent create my-awesome-agent
```

### Example

```bash
superagent create my-agent
cd my-agent
npm install
superagent configure
superagent run
```

---

## 🧑‍💻 CLI Commands

- `superagent create [directory]` – Create a new agent project (supports positional or --name)
- `superagent configure` – Configure API keys and environment variables
- `superagent run` – Run the agent locally for testing (supports multiple environment file formats)

### Environment File Support

The `superagent run` command automatically detects your runtime and supports multiple environment file formats:

- **Node.js**: `.env` files
- **AWS Lambda**: `env.json` files
- **Cloudflare Workers**: `.dev.vars` files

The CLI auto-detects formats; see docs/CLI Guide for details.

---

## 🎯 Features

- 🤖 **Model-Agnostic AI Integration**: Seamlessly work with OpenAI, Gemini, Claude, and other LLMs
- 💬 **Real-time Messaging**: Built-in support for channels and direct messages
- 🔧 **CLI Tools**: AWS Amplify-inspired CLI for project management and deployment
- 📱 **Command Handling**: Structured command routing and message processing
- 🔄 **Webhook Architecture**: Modern webhook-based agent architecture
- 🎨 **Interactive UI**: Support for buttons, multiselect, and reply markup
- ⚡ **Serverless Ready**: Ready for deployment to various platforms
- 🛠️ **TypeScript First**: Full type safety with comprehensive TypeScript support
- 🧪 **Testing Ready**: Jest setup with comprehensive test utilities

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

## 🛠️ Development

For local development and testing, see [DEVELOPMENT.md](./DEVELOPMENT.md) for instructions on setting up the development environment using `npm link`.

For advanced development patterns and best practices, see our **[API Reference](./docs/api-reference.md)**.

### Global CLI Installation

```bash
npm install -g @superdapp/agents
```

## 📚 Documentation

For comprehensive documentation, visit our **[Documentation Hub](./docs/README.md)**:

- **[Quick Start Guide](./docs/quick-start.md)** - Get up and running in minutes
- **[CLI Guide](./docs/cli-guide.md)** - Complete command-line interface documentation
- **[API Reference](./docs/api-reference.md)** - Complete SDK reference
- **[Deployment Guide](./docs/deployment.md)** - Deploy to production
 - **[Tunneling (ngrok)](./docs/tunneling.md)** - Expose your local webhook

## 🔧 Advanced Usage

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

## 🛡 Error Handling

The SDK includes comprehensive error handling:

```typescript
try {
  // Process webhook request
  await agent.processRequest(webhookBody);
} catch (error) {
  if (error.message.includes('API_TOKEN')) {
    console.error('Invalid API token. Run: superagent configure');
  } else {
    console.error('Request processing failed:', error);
  }
}
```

## 🔐 Security Best Practices

1. **Never commit API tokens** to version control
2. **Use environment variables** for sensitive configuration
3. **Validate all user inputs** before processing
4. **Implement rate limiting** for command handlers
5. **Use HTTPS** for all API communications

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

- 📖 [Documentation Hub](./docs/README.md) - Complete SDK documentation
- 💬 [Discord Community](https://discord.gg/superdapp)
- 🐛 [Issue Tracker](https://github.com/SuperDapp/superdapp-js/issues)
- 📧 [Email Support](mailto:support@superdapp.com)

---

**Built with ❤️ by the SuperDapp Team**
