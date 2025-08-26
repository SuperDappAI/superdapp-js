# Basic SuperDapp Agent Example

A simple SuperDapp agent with basic commands and interactive features.

## Features

- Basic commands (`/start`, `/ping`, `/help`)
- Interactive menu with buttons
- Message handling
- Callback query processing

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with your configuration:

   ```env
   PORT=3000
   API_TOKEN=your_superdapp_api_token_here
   API_BASE_URL=https://api.superdapp.ai
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
   - Webhook endpoint: http://localhost:3000/webhook
   - Health check: http://localhost:3000/health

## Available Commands

- `/start` - Welcome message
- `/ping` - Test bot responsiveness
- `/help` - Show available commands
- `/menu` - Interactive menu with buttons

## Usage

This example demonstrates how to:

- Initialize a SuperDapp agent
- Add basic commands
- Handle interactive buttons
- Process callback queries
- Handle general messages

The agent is ready to receive webhook requests and can be integrated with your SuperDapp application.
