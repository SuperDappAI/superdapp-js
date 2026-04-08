# SuperDapp Agents SDK for Node.js/TypeScript

[![npm version](https://badge.fury.io/js/@superdapp%2Fagents.svg)](https://badge.fury.io/js/@superdapp%2Fagents)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A professional-grade Node.js/TypeScript SDK and CLI for building AI agents on the SuperDapp platform. This SDK provides a unified interface for creating intelligent bots that can interact with users, handle commands, and integrate with multiple large language models.

---

## 🚀 Webhook-Based Agent Architecture

**SuperDapp agents use a webhook-based architecture for maximum portability and simplicity.**

- Centralized command/message routing in the SDK runtime
- Lightweight lifecycle: you instantiate an agent, register handlers, and pass incoming webhook bodies to it
- Pluggable command and message handlers
- Interactive UI support (buttons, multiselect, reply markup)
- Event dispatch built-in (CommandRegistry + WebhookAgent handle command routing and generic messages)
- Signature validation is application-level: validate incoming requests (e.g., in your Express/Worker handler) before calling `agent.processRequest`
- Works with any HTTP hosting (Node.js, serverless, etc.)

**This is the default architecture for all SuperDapp agents.**

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
superdapp create my-awesome-agent
```

### Example

```bash
superdapp create my-agent
cd my-agent
npm install
superdapp configure
superdapp run
```

---

## 🧑‍💻 CLI Commands

- `superdapp create [directory]` – Create a new agent project (supports positional or --name)
- `superdapp configure` – Configure API keys and environment variables
- `superdapp run` – Run the agent locally for testing (supports multiple environment file formats)

### Environment File Support

The `superdapp run` command automatically detects your runtime and supports multiple environment file formats:

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

### AI Dependencies (Optional)

For AI integration, install the providers you need:

```bash
# Base AI SDK (required for any AI functionality)
npm install ai

# Provider-specific packages (install only what you need)
npm install @ai-sdk/openai        # For OpenAI GPT models
npm install @ai-sdk/anthropic     # For Anthropic Claude models  
npm install @ai-sdk/google        # For Google Gemini models

# Optional: Enhanced OpenAI Agents SDK (advanced features)
npm install @openai/agents        # For advanced agent workflows, tools, streaming

# All providers at once
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @openai/agents
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
- **[AI Integration Guide](./docs/ai-integration.md)** - Multi-provider AI integration
- **[Deployment Guide](./docs/deployment.md)** - Deploy to production
- **[Tunneling (ngrok)](./docs/tunneling.md)** - Expose your local webhook

## 🤖 Model-Agnostic AI Integration

Build intelligent agents with multiple AI providers:

### Quick Setup

```bash
# Install AI dependencies
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google

# Configure your agent
superagent configure
```

### Example Usage

```typescript
import { SuperDappAgent, createBotConfig } from '@superdapp/agents';

const agent = new SuperDappAgent(createBotConfig());

// Add AI-powered command
agent.addCommand('/ask', async (message, replyMessage, roomId) => {
  const question = message.body.m?.body?.split(' ').slice(1).join(' ');
  
  try {
    const aiClient = agent.getAiClient();
    const response = await aiClient.generateText(question);
    await agent.sendConnectionMessage(roomId, response);
  } catch (error) {
    console.error('AI Error:', error);
    await agent.sendConnectionMessage(roomId, 'Sorry, I had trouble with that request.');
  }
});
```

### Supported Providers

- **OpenAI**: GPT-4, GPT-3.5 Turbo, and other OpenAI models
- **Anthropic**: Claude 3 (Opus, Sonnet, Haiku)  
- **Google AI**: Gemini Pro and Gemini Pro Vision

### Environment Variables

```bash
AI_PROVIDER=openai        # or anthropic, google
AI_MODEL=gpt-4           # Provider-specific model
AI_API_KEY=sk-your-key   # Your API key
AI_BASE_URL=https://...  # Optional custom endpoint

# OpenAI Agents SDK Configuration (optional)
SUPERDAPP_AI_AGENTS=1                    # Enable OpenAI Agents SDK features
SUPERDAPP_AI_AGENTS_STREAMING=1          # Enable streaming mode
SUPERDAPP_AI_AGENTS_MAX_TURNS=10         # Maximum agent conversation turns
```

### Enhanced OpenAI Agents Integration

**NEW**: Optional OpenAI Agents SDK integration for advanced features:

```typescript
import { createEnhancedAIClient } from '@superdapp/agents';

// Enhanced client with OpenAI Agents support
const enhancedClient = await createEnhancedAIClient({
  provider: 'openai',
  model: 'gpt-4',
  apiKey: process.env.AI_API_KEY,
  agents: {
    enabled: true,        // Enable OpenAI Agents features
    streaming: true,      // Enable real-time streaming  
    maxTurns: 10,        // Conversation turn limit
  },
});

// Advanced agent with tools and guardrails
const result = await enhancedClient.runEnhancedAgent({
  instructions: 'You are a helpful assistant with calculation abilities.',
  messages: [{ role: 'user', content: 'Calculate 15% tip on $45' }],
  tools: {
    calculator: {
      type: 'function',
      function: {
        name: 'calculate',
        description: 'Perform mathematical calculations',
        parameters: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
          },
        },
      },
    },
  },
  guardrails: {
    outputValidation: {
      maxLength: 500,
      bannedWords: ['inappropriate'],
    },
  },
  enableTracing: true,
});

console.log('Agent Response:', result.outputText);
console.log('Tracing Data:', result.tracing);
```

**Features when OpenAI Agents SDK is installed:**

- 🛠️ **Advanced Tools**: Function calling with parallel execution
- 📡 **Real-time Streaming**: Live event streaming from agents
- 🛡️ **Built-in Guardrails**: Input/output validation and content filtering
- 👥 **Agent Handoffs**: Transfer conversations between specialized agents
- 📊 **Enhanced Tracing**: Detailed execution monitoring and token usage
- ⚡ **Parallel Execution**: Run multiple agents simultaneously

**Graceful Fallback**: When `@openai/agents` is not installed, the SDK automatically falls back to the standard `generateText` functionality with no breaking changes.

### Features

- **Zero Configuration**: Works without AI dependencies installed
- **Provider Switching**: Change providers via environment variables
- **Error Handling**: Clear error messages and fallback behavior
- **TypeScript Support**: Full type safety for all AI operations
- **Cost Control**: Built-in token limits and usage monitoring
- **OpenAI Agents SDK**: Optional advanced features when installed
- **Production Ready**: Graceful fallback and robust error handling

**See the complete [AI Integration Guide](./docs/ai-integration.md) for setup instructions, examples, and best practices.**

## 🔧 Advanced Usage

### API Client Coverage

The SDK client currently covers the core messaging flows:

- Channel and connection messages (send, update, delete)
- Join/leave social groups
- Fetch bot info and user channels

Additional endpoints (media uploads, reactions, typing status, etc.) can be added incrementally; open an issue if you need one prioritized.

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

### Error Handling

The client includes Axios interceptors for basic request/response logging and error propagation. Wrap your command handlers in try/catch and surface actionable messages to users as needed.

### Type Safety

Full TypeScript support with comprehensive types:

```typescript
import type {
  MessageData,
  CommandHandler,
  BotConfig,
  ApiResponse,
} from '@superdapp/agents';

const handleCommand: CommandHandler = async ({
  message,
  replyMessage,
  roomId,
}) => {
  // Fully typed message object
  const messageText = (message.body as any)?.m?.body;
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
    console.error('Invalid API token. Run: superdapp configure');
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
- 💬 [Discord Community](https://discord.gg/superdappai)
- 🐛 [Issue Tracker](https://github.com/SuperDapp/superdapp-js/issues)
- 📧 [Email Support](mailto:support@superdapp.ai)

---

**Built with ❤️ by the SuperDapp Team**
