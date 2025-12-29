# SuperDapp Agents SDK Documentation

Welcome to the comprehensive documentation for the SuperDapp Agents SDK. This documentation will help you build powerful AI agents for the SuperDapp platform.

## 📚 Documentation Structure

### 🚀 Getting Started

- **[Quick Start Guide](./quick-start.md)** - Get up and running with your first agent in minutes
- **[CLI Guide](./cli-guide.md)** - Complete command-line interface documentation

### 🛠️ Development

- **[API Reference](./api-reference.md)** - Complete SDK reference with classes, methods, and types

### 🚀 Deployment

- **[Deployment Guide](./deployment.md)** - Deploy to Cloudflare Workers, AWS Lambda, Docker, and more

## 🎯 Quick Navigation

| Topic                 | Description                     | Link                                |
| --------------------- | ------------------------------- | ----------------------------------- |
| **First Steps**       | Create your first agent         | [Quick Start](./quick-start.md)     |
| **CLI Commands**      | Manage agents from command line | [CLI Guide](./cli-guide.md)         |
| **Advanced Features** | Complex patterns and scenarios  | [API Reference](./api-reference.md) |
| **Deployment**        | Production deployment options   | [Deployment Guide](./deployment.md) |

## 🏗️ Architecture Overview

The SuperDapp Agents SDK provides a modern, webhook-based architecture for building AI agents:

### Core Components

- **SuperDappAgent** - Main agent class with webhook support
- **SuperDappClient** - Direct API client for advanced operations
- **WebhookAgent** - Lightweight webhook-only agent
- **CLI Tools** - Command-line interface for project management

### Key Features

- ✅ **Webhook-Based Architecture** - Maximum portability and simplicity
- ✅ **Interactive UI Support** - Buttons, multiselect, reply markup
- ✅ **Command Routing** - Structured command handling system
- ✅ **TypeScript First** - Full type safety and IntelliSense
- ✅ **Multi-Platform Deployment** - Cloudflare Workers, AWS Lambda and Docker
- ✅ **Comprehensive Testing** - Jest setup with utilities

## 🚦 CLI Commands Quick Reference

```bash
# Initialize a new project
superdapp create my-agent

# Configure environment
superdapp configure

# Run locally
superdapp run

# Check status
superdapp status
```

## 📦 Installation

```bash
# Install globally for CLI access
npm install -g @superdapp/agents

# Install in project
npm install @superdapp/agents
```

## 🎯 Common Use Cases

### Basic Agent

```typescript
import { SuperDappAgent } from '@superdapp/agents';

const agent = new SuperDappAgent({
  apiToken: process.env.API_TOKEN!,
  baseUrl: process.env.API_BASE_URL,
});

agent.addCommand('/start', async ({ roomId }) => {
  await agent.sendConnectionMessage(roomId, 'Hello!');
});
```

### Interactive Agent

```typescript
agent.addCommand('/menu', async ({ roomId }) => {
  const buttons = [
    { text: 'Option 1', callback_data: 'OPTION_1' },
    { text: 'Option 2', callback_data: 'OPTION_2' },
  ];

  await agent.sendReplyMarkupMessage('buttons', roomId, 'Choose:', [buttons]);
});
```

### Webhook Integration

```typescript
app.post('/webhook', async (req, res) => {
  await agent.processRequest(req.body);
  res.status(200).send('OK');
});
```

## 🔗 External Resources

- **[GitHub Repository](https://github.com/SuperDapp/superdapp-js)** - Source code and issues
- **[NPM Package](https://www.npmjs.com/package/@superdapp/agents)** - Package registry
- **[SuperDapp Platform](https://superdapp.ai)** - Platform documentation
