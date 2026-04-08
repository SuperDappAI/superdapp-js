# SuperDapp Examples

This directory contains example implementations of SuperDapp agents with different levels of complexity and capabilities.

## Examples

### Basic Example (`basic/`)

A simple agent with basic commands and interactive features.

**Features:**
- Basic commands (`/start`, `/ping`, `/help`)
- Interactive menu with buttons
- Message handling

### Advanced Example (`advanced/`)

A comprehensive agent with advanced features including scheduled tasks and data management.

**Features:**
- All basic features
- User subscriptions
- Scheduled notifications
- Crypto price simulation
- Portfolio management

### AI Examples (`ai/`)

Complete AI-powered agent examples demonstrating different AI providers and capabilities.

**Projects:**
- **[basic-openai/](./ai/basic-openai/)** - OpenAI integration with Q&A, chat, code assistance
- **[anthropic-chat/](./ai/anthropic-chat/)** - Claude-powered analysis and reasoning
- **[multi-provider/](./ai/multi-provider/)** - Model-agnostic development with multiple providers
- **[enhanced-features/](./ai/enhanced-features/)** - Advanced AI features with guardrails and monitoring

**Features:**
- Multiple AI provider support (OpenAI, Anthropic, Google AI)
- Safety guardrails and content validation
- Parallel processing and streaming responses
- Comprehensive error handling and monitoring
- Enterprise-ready features for production use

See the [AI Examples README](./ai/README.md) for detailed setup and usage instructions.

## Running the Examples

Each example directory is self-contained with its own `package.json` and dependencies.

### Basic Example:

```bash
cd examples/basic
npm install
npm run build  # Build the project first
npm start      # Run the built version
```

### Advanced Example:

```bash
cd examples/advanced
npm install
npm run build  # Build the project first
npm start      # Run the built version
```

### AI Examples:

```bash
# Choose any AI example (basic-openai, anthropic-chat, multi-provider, enhanced-features)
cd examples/ai/basic-openai
npm install
cp .env.example .env  # Configure your API keys
npm run build
npm start
```

### Development Mode:

For development with auto-reload:

```bash
# Basic example
cd examples/basic
npm run dev

# Advanced example
cd examples/advanced
npm run dev

# AI examples
cd examples/ai/basic-openai
npm run dev
```

## Environment Variables

Make sure to set up your environment variables in a `.env` file:

```
PORT=8787
API_TOKEN=your_superdapp_api_token_here
API_BASE_URL=https://api.superdapp.ai
```

## Server Endpoints

Both examples now run as Express servers with the following endpoints:

- **Webhook**: `POST /webhook` - Receives SuperDapp webhook requests
- **Health Check**: `GET /health` - Server health status

## Notes

- Channel IDs should be valid SuperDapp channel identifiers.

## Public URL via ngrok

For quick remote testing, you can tunnel your local server:

```bash
# Basic example
cd examples/basic
npm run dev:tunnel

# Advanced example
cd examples/advanced
npm run dev:tunnel
```

This starts the dev server and an ngrok tunnel on your PORT. See the full guide in `../docs/tunneling.md`.
