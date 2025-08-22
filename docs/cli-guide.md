# CLI Guide

The SuperDapp Agents SDK includes a powerful command-line interface (CLI) tool called `superagent` that helps you manage your AI agents efficiently.

## 🚦 CLI Commands Overview

| Command     | Description                        | Usage                           |
| ----------- | ---------------------------------- | ------------------------------- |
| `create`    | Create a new agent project         | `superagent create [directory]` |
| `configure` | Configure API keys and environment | `superagent configure`          |
| `run`       | Run the agent locally for testing  | `superagent run [options]`      |
| `status`    | Check agent status and health      | `superagent status`             |
| `create`    | Create new agent instances         | `superagent create [options]`   |

## 📁 Project Initialization

### Basic Usage

```bash
# Initialize with positional argument (recommended)
superagent create my-awesome-agent

# Initialize with legacy flag
superagent create --name my-awesome-agent

# Initialize with auto-confirmation
superagent create my-agent -y
```

### Example Workflow

```bash
# 1. Create a new project
superagent create my-agent -y

# 2. Navigate to project directory
cd my-agent

# 3. Install dependencies
npm install

# 4. Configure environment
superagent configure

# 5. Run the agent
superagent run
```

## ⚙️ Environment Configuration

### Interactive Configuration

```bash
superagent configure
```

This command will:

- Prompt for your SuperDapp API token
- Set up the API base URL
- Create a `.env` file with your configuration
- Validate the connection

### Manual Configuration

You can also manually create a `.env` file:

```env
API_TOKEN=your_superdapp_api_token_here
API_BASE_URL=https://api.superdapp.ai
WEBHOOK_SECRET=your_webhook_secret_here
NODE_ENV=development
```

### Environment Variables

| Variable         | Description              | Required | Default                    |
| ---------------- | ------------------------ | -------- | -------------------------- |
| `API_TOKEN`      | Your SuperDapp API token | Yes      | -                          |
| `API_BASE_URL`   | SuperDapp API base URL   | No       | `https://api.superdapp.ai` |
| `WEBHOOK_SECRET` | Webhook signature secret | No       | -                          |
| `NODE_ENV`       | Environment mode         | No       | `production`               |

## 🚀 Running Your Agent

### Basic Run

```bash
superagent run
```

The `superagent run` command automatically detects your runtime environment and uses the appropriate environment file format:

- **Node.js**: Uses `.env` files
- **AWS Lambda**: Uses `env.json` files (detected by `template.yaml` or `samconfig.toml`)
- **Cloudflare Workers**: Uses `.dev.vars` files (detected by `wrangler.toml`)

### Development Mode

```bash
# Run with file watching
superagent run --watch

# Run with debug logging
superagent run --debug

# Run on specific port
superagent run --port 3001

# Use custom environment file
superagent run --env custom.env
```

### Available Options

| Option    | Description                        | Default       |
| --------- | ---------------------------------- | ------------- |
| `--watch` | Watch for file changes and restart | `false`       |
| `--debug` | Enable debug logging               | `false`       |
| `--port`  | Specify port number                | `3000`        |
| `--host`  | Specify host address               | `localhost`   |
| `--env`   | Custom environment file path       | Auto-detected |

### Example Usage

```bash
# Development with hot reload
superagent run --watch --debug --port 3001

# Production mode
NODE_ENV=production superagent run

# Use custom environment file
superagent run --env production.env
```

### Environment File Formats

The CLI supports different environment file formats based on your runtime:

#### Node.js (.env)

```env
API_TOKEN=your_api_token_here
API_BASE_URL=https://api.superdapp.ai
NODE_ENV=development
PORT=8787
```

#### AWS Lambda (env.json)

```json
{
  "myBotFunction": {
    "API_TOKEN": "your_api_token_here",
    "API_BASE_URL": "https://api.superdapp.ai",
    "NODE_ENV": "production"
  }
}
```

#### Cloudflare Workers (.dev.vars)

```
API_TOKEN=your_api_token_here
API_BASE_URL=https://api.superdapp.ai
NODE_ENV=development
```

## 📊 Agent Status

### Check Status

```bash
superagent status
```

This command will:

- Verify API connectivity
- Check agent configuration
- Display current status
- Show any errors or warnings

### Status Information

The status command provides:

- ✅ **Connection Status**: API connectivity
- ✅ **Configuration**: Environment variables
- ✅ **Agent Health**: Running status
- ✅ **Webhook Status**: Webhook server status
- ⚠️ **Warnings**: Configuration issues
- ❌ **Errors**: Critical problems

## 🏗️ Creating Agents

### Create New Agent Instance

```bash
# Create with interactive prompts
superagent create

# Create with specific options
superagent create --name my-agent
```

### Create Options

| Option   | Description       | Required |
| -------- | ----------------- | -------- |
| `--name` | Agent name        | Yes      |
| `--path` | Custom path       | No       |
| `--yes`  | Skip confirmation | No       |

### Example: Creating a Node.js Agent

```bash
# Create a new Node.js agent
superagent create my-agent

# Navigate to the project
cd my-agent

# Install dependencies
npm install

# Configure your API keys
superagent configure

# Run the agent
superagent run
```

### Example: Creating a Cloudflare Workers Agent

```bash
# Create a new Cloudflare Workers agent
superagent create my-agent

# Navigate to the project
cd my-agent

# Install dependencies
npm install

# Configure your API keys
superagent configure

# Run the agent
superagent run
```

### Example: Creating an AWS Lambda Agent

```bash
# Create a new AWS Lambda agent
superagent create my-agent

# Navigate to the project
cd my-agent

# Install dependencies
npm install

# Configure your API keys
superagent configure

# Run the agent
superagent run
```

## 🔧 Advanced CLI Usage

### Global Installation

```bash
# Install globally
npm install -g @superdapp/agents

# Verify installation
superagent --version
```

### Local Development

```bash
# Link for development
npm link

# Use local version
superagent --help
```

### Environment-Specific Commands

```bash
# Development environment
NODE_ENV=development superagent run

# Production environment
NODE_ENV=production superagent run

# Test environment
NODE_ENV=test superagent run
```

## 🐛 Troubleshooting

### Common Issues

#### 1. API Token Issues

```bash
# Reconfigure API token
superagent configure

# Check token validity
superagent status
```

#### 2. Port Conflicts

```bash
# Use different port
superagent run --port 3001

# Check port availability
lsof -i :3000
```

#### 3. Permission Issues

```bash
# Fix npm permissions
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config

# Reinstall globally
npm uninstall -g @superdapp/agents
npm install -g @superdapp/agents
```

### Debug Mode

```bash
# Enable debug logging
superagent run --debug

# Check logs
tail -f logs/agent.log
```

## 📋 CLI Best Practices

### 1. Use Positional Arguments

```bash
# ✅ Good
superagent create my-agent

# ❌ Avoid
superagent create --name my-agent
```

### 2. Configure Environment First

```bash
# ✅ Always configure before running
superagent create my-agent
cd my-agent
superagent configure
superagent run

# ❌ Don't skip configuration
superagent create my-agent
superagent run  # Will fail without API token
```

### 3. Configure Environment First

```bash
# ✅ Always configure before running
superagent create my-agent
cd my-agent
superagent configure
superagent run

# ❌ Don't skip configuration
superagent create my-agent
superagent run  # Will fail without API token
```

### 4. Use Development Mode

```bash
# ✅ Use watch mode for development
superagent run --watch

# ❌ Don't manually restart during development
superagent run
# ... edit files ...
# ... manually restart ...
```

## 🔗 Related Documentation

- [Quick Start Guide](./quick-start.md) - Get started with your first agent
- [API Reference](./api-reference.md) - Complete SDK documentation and advanced patterns
- [Deployment Guide](./deployment.md) - Deploy to production
- [API Reference](./api-reference.md) - Complete SDK documentation
