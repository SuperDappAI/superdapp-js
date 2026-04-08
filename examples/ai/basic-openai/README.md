# Basic OpenAI SuperDapp Agent

A simple AI-powered SuperDapp agent demonstrating OpenAI integration with essential conversational and utility commands.

## ✨ Features

- **Q&A Assistant** (`/ask`) - Ask any question and get intelligent answers
- **Conversational Chat** (`/chat`) - Have natural conversations with the AI
- **Code Assistant** (`/code`) - Get programming help and code examples
- **Creative Writing** (`/write`) - Generate creative content from prompts
- **Configuration Status** (`/status`) - Check AI setup and configuration
- **Interactive Help** (`/help`) - Get guidance on available commands

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- SuperDapp API token
- OpenAI API key

### 1. Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your credentials:

```env
# SuperDapp API Configuration
API_TOKEN=your_superdapp_api_token_here
API_BASE_URL=https://api.superdapp.ai

# Server Configuration  
PORT=3000

# OpenAI Configuration
AI_PROVIDER=openai
AI_MODEL=gpt-4
AI_API_KEY=sk-your_openai_api_key_here
```

### 3. Run the Agent

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start

# With tunneling for remote testing
npm run dev:tunnel
```

## 💬 Commands

### AI-Powered Commands

| Command | Usage | Description |
|---------|--------|-------------|
| `/ask` | `/ask What is machine learning?` | General Q&A with intelligent responses |
| `/chat` | `/chat How's your day going?` | Natural conversation with the AI |
| `/code` | `/code How do I use async/await?` | Programming assistance and code examples |
| `/write` | `/write A story about robots` | Creative writing and content generation |

### Utility Commands

| Command | Usage | Description |
|---------|--------|-------------|
| `/start` | `/start` | Welcome message and introduction |
| `/help` | `/help` | Show all available commands |
| `/status` | `/status` | Check AI configuration status |

## 🎯 Example Usage

```
User: /ask What is TypeScript?
Bot: 💡 Answer:
TypeScript is a strongly typed programming language that builds on JavaScript...

User: /chat Hello! How are you today?
Bot: 🤖 Hello! I'm doing great, thank you for asking! I'm here and ready to help...

User: /code How do I create a React functional component?
Bot: 💻 Code Assistance:
Here's how to create a React functional component:
```typescript
import React from 'react';
...
```

User: /write A short poem about coding
Bot: 📝 Creative Writing:
In lines of code, both clean and bright,
Logic flows from day through night...
```

## ⚙️ Configuration

### OpenAI Models

Supported OpenAI models (set via `AI_MODEL`):
- `gpt-4` - Most capable, higher cost
- `gpt-4-turbo` - Fast and capable  
- `gpt-3.5-turbo` - Cost-effective option

### Response Settings

The agent uses different temperature settings for optimal responses:
- **Q&A** (`/ask`): Temperature 0.7 - Balanced accuracy and creativity
- **Chat** (`/chat`): Temperature 0.8 - Natural conversation flow
- **Code** (`/code`): Temperature 0.3 - Focused, accurate technical responses  
- **Writing** (`/write`): Temperature 0.9 - Maximum creativity

### Custom Base URL

For custom OpenAI deployments, set:
```env
AI_BASE_URL=https://your-custom-openai-endpoint.com/v1
```

## 🛠️ Development

### Project Structure

```
basic-openai/
├── index.ts          # Main agent implementation
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── .env.example      # Environment template
└── README.md         # This file
```

### Available Scripts

```bash
npm run dev           # Development with auto-reload
npm run build         # Compile TypeScript  
npm start             # Run production build
npm run tunnel        # Create ngrok tunnel
npm run dev:tunnel    # Dev mode with tunnel
```

### Server Endpoints

- **Webhook**: `POST /webhook` - Receives SuperDapp webhook requests
- **Health**: `GET /health` - Server status and configuration

## 🔧 Customization

### Adding New Commands

```typescript
agent.addCommand('/custom', async ({ roomId, body }) => {
  const input = body?.split(' ').slice(1).join(' ');
  
  try {
    const aiClient = agent.getAiClient();
    const response = await aiClient.generateText([
      { role: "system", content: "Your custom system prompt" },
      { role: "user", content: input }
    ], {
      temperature: 0.7,
      maxTokens: 500
    });
    
    await agent.sendConnectionMessage(roomId, response);
  } catch (error) {
    console.error('Custom Command Error:', error);
    await agent.sendConnectionMessage(roomId, 'Sorry, something went wrong.');
  }
});
```

### Modifying AI Behavior

Adjust the system prompts in each command handler to change the AI's personality, expertise focus, or response style.

## 🛡️ Error Handling

The agent includes comprehensive error handling:

- **Configuration Errors**: Guides users to set up environment variables
- **API Errors**: Graceful fallbacks with helpful error messages
- **Network Issues**: Retry logic and user-friendly notifications
- **Validation**: Input validation and sanitization

## 📚 Related Examples

- **[Anthropic Chat](../anthropic-chat/)** - Claude-powered conversations
- **[Multi-Provider](../multi-provider/)** - Switch between AI providers
- **[Enhanced Features](../enhanced-features/)** - Advanced AI capabilities

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This example is part of the SuperDapp Agents SDK and is released under the MIT License.