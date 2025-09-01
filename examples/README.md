# SuperDapp Examples

This directory contains example implementations of SuperDapp agents with different levels of complexity.

## Examples

### Basic Example (`basic/`)

A simple agent with basic commands.

**Features:**

- Basic commands (`/start`, `/ping`, `/help`)
- Interactive menu with buttons
- Message handling

### Advanced Example (`advanced/`)

A comprehensive agent with advanced features including scheduled tasks.

**Features:**

- All basic features
- User subscriptions
- Scheduled notifications
- Crypto price simulation
- Portfolio management

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

### Development Mode:

For development with auto-reload:

```bash
# Basic example
cd examples/basic
npm run dev

# Advanced example
cd examples/advanced
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
