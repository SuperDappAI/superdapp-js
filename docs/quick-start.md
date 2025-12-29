# Quick Start Guide

Welcome to the SuperDapp Agents SDK! This guide will help you get started with building AI agents for the SuperDapp platform.

## 🚀 Getting Started

### 1. Initialize a New Project

You can use a positional argument for the project directory:

```bash
superdapp create my-awesome-agent
```

### 2. Configure Your Environment

```bash
superdapp configure
```

Or manually create a `.env` file:

```env
API_TOKEN=your_superdapp_api_token_here
API_BASE_URL=https://api.superdapp.ai
```

### 3. Run Your Agent

```bash
superdapp run
```

## 💬 Sending Simple Messages

Before diving into callback queries, let's explore how to send simple messages to users. The SuperDapp Agents SDK provides several methods for sending different types of messages.

### Basic Text Messages

The most common way to send messages is using `sendConnectionMessage`:

```typescript
// Send a simple text message
await agent.sendConnectionMessage(roomId, 'Hello! How can I help you today?');

// Send a message with markdown formatting
await agent.sendConnectionMessage(
  roomId,
  '**Welcome!** Here are your options:\n\n• Option 1\n• Option 2\n• Option 3'
);
```

### Handling User Messages

To respond to user messages, use the `message` command:

```typescript
// Handle text messages from users
agent.addCommand('message', async ({ message, roomId }) => {
  const userMessage = message.text?.toLowerCase();

  if (userMessage?.includes('hello') || userMessage?.includes('hi')) {
    await agent.sendConnectionMessage(
      roomId,
      'Hello! Welcome to our service. How can I assist you today?'
    );
  } else if (userMessage?.includes('help')) {
    await agent.sendConnectionMessage(
      roomId,
      'Available commands:\n• /news - Get latest news\n• /price - Get crypto prices\n• /help - Show this help'
    );
  } else if (userMessage?.includes('news')) {
    const news = await getLatestNews();
    await agent.sendConnectionMessage(roomId, `📰 **Latest News**\n\n${news}`);
  } else {
    await agent.sendConnectionMessage(
      roomId,
      'I didn\'t understand that. Type "help" for available commands.'
    );
  }
});
```

### Sending Messages with Delays

You can add delays between messages for better user experience:

```typescript
// Send multiple messages with delays
await agent.sendConnectionMessage(roomId, 'Processing your request...');

// Simulate processing time
await new Promise((resolve) => setTimeout(resolve, 2000));

await agent.sendConnectionMessage(roomId, 'Here are your results:');
await agent.sendConnectionMessage(roomId, '✅ Task completed successfully!');
```

### Error Handling in Messages

Always handle errors gracefully when sending messages:

```typescript
try {
  await agent.sendConnectionMessage(roomId, 'Processing...');
  const result = await someAsyncOperation();
  await agent.sendConnectionMessage(roomId, `Result: ${result}`);
} catch (error) {
  console.error('Error:', error);
  await agent.sendConnectionMessage(
    roomId,
    '❌ Sorry, something went wrong. Please try again later.'
  );
}
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

## 🚀 Next Steps

- Check out the [CLI Documentation](./cli-guide.md) for detailed command usage
- Explore [API Reference](./api-reference.md) for more complex scenarios and complete documentation
- Learn about [Deployment](./deployment.md) options
- Review the [API Reference](./api-reference.md) for complete SDK documentation
