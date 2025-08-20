# Advanced SuperDapp Agent Example

A comprehensive SuperDapp agent with advanced features including scheduled tasks, user subscriptions, and interactive menus.

## Features

- All basic features from the basic example
- User subscriptions management
- Scheduled notifications
- Crypto price simulation
- Portfolio management
- Interactive menus and polls
- Smart message routing

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with your configuration:

   ```env
   PORT=3001
   ```

3. Run the example:

   ```bash
   npm run build  # Build the project first
   npm start      # Run the built version
   ```

   Or for development with auto-reload:

   ```bash
   npm run dev
   ```

4. The server will start and you'll see:
   - Webhook endpoint: http://localhost:3001/webhook
   - Health check: http://localhost:3001/health

## Available Commands

### Basic Commands

- `/start` - Welcome message
- `/help` - Show available commands
- `/status` - Bot status

### Data Management

- `/subscribe <topic>` - Subscribe to updates
- `/unsubscribe <topic>` - Unsubscribe from updates
- `/mysubs` - Show your subscriptions

### Notifications

- `/notify <message>` - Schedule a notification
- `/schedule <time> <message>` - Schedule at specific time

### Interactive Features

- `/menu` - Show interactive menu
- `/poll <question>` - Create a poll

### Crypto Features

- `/price <symbol>` - Get current price
- `/portfolio` - Show portfolio summary

### Advanced Features

- `/debug` - Debug information
- `/logs` - Show recent logs

## Scheduled Tasks

The agent includes scheduled notifications that run every 2 hours for subscribed users:

- Crypto updates for users subscribed to 'crypto'
- News alerts for users subscribed to 'news'

## Usage

This example demonstrates how to:

- Initialize a SuperDapp agent with advanced configuration
- Manage user subscriptions
- Implement scheduled tasks
- Create interactive menus
- Handle complex message routing
- Simulate external API integrations

The agent is ready to receive webhook requests and can be integrated with your SuperDapp application.
