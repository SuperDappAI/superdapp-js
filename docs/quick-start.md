# Quick Start Guide

Welcome to the SuperDapp Agents SDK! This guide will help you get started with building AI agents for the SuperDapp platform.

## 🌐 Platform Setup

Before you can build agents, you need to set up your SuperDapp account and get your API credentials.

### 1. Create Your SuperDapp Account

1. **Visit the SuperDapp Platform**: Go to [https://web.superdapp.ai](https://web.superdapp.ai)
2. **Sign Up or Sign In**: Create a new account or log in with your existing credentials
3. **Access Agent Dashboard**: Navigate to the agent development section

### 2. Generate Your Agent API Key

1. **Go to Settings Menu**: In your SuperDapp dashboard, navigate to the Settings menu
2. **Access AI Agents**: Click on the "AI Agents" submenu
3. **Create an Agent**: Select the "Create an agent" option
4. **Configure Agent Profile**:
   - **Agent Username**: Choose a unique username for your agent
   - **Agent Password**: Set a secure password (save this password - you'll need it to get your API key)
   - **Profile Picture**: Upload an agent profile picture (can be changed later)
   - **Note**: The username and password cannot be changed after creation. If you make a mistake, you'll need to delete the agent and start over.
5. **Generate API Key**: After creating the agent, you'll be redirected to the agent page
   - Click on "View" in the "Agent API key" section
   - Enter the agent's password when prompted
   - Your API key will be revealed - securely store this token
6. **Save Your Credentials**: Keep both your agent password and API token secure - you'll need them for development

> ⚠️ **Security Note**: Never share your API token publicly or commit it to version control. Always use environment variables to store sensitive credentials.

### 3. Configure Webhook URL

Webhooks enable real-time communication between SuperDapp and your agent. Your agent will receive messages from Super Groups and direct conversations through webhook endpoints.

#### Development Setup (Local Testing)

For local development, you'll need to expose your local server to the internet so SuperDapp can send webhooks to your agent.

**Option 1: Using ngrok (Recommended)**
```bash
# Install ngrok if you haven't already
npm install -g ngrok

# In a separate terminal, expose your local port (e.g., 3000)
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

**Option 2: Using Cloudflare Tunnel**
```bash
# Install cloudflared
# Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# Create tunnel
cloudflared tunnel --url http://localhost:3000
```

#### Setting Up Webhook in SuperDapp

1. **Go to Agent Settings**: In your SuperDapp dashboard, find your agent
2. **Configure Webhook URL**: 
   - **Webhook URL**: Enter your public URL + `/webhook` (e.g., `https://abc123.ngrok.io/webhook`)
   - **Webhook Events**: Select the events you want to receive:
     - `message` - Direct messages to your agent
     - `group_message` - Messages in Super Groups where your agent is added
     - `callback_query` - Button clicks and interactions
3. **Test Webhook**: Use the "Test Webhook" feature to verify your endpoint is working
4. **Save Configuration**: Save your webhook settings

#### Understanding Webhook Events

Your agent will receive different types of events:

- **Direct Messages**: When users message your agent directly
- **Group Messages**: When your agent is mentioned or receives messages in Super Groups
- **Button Interactions**: When users click interactive buttons you've created

### 4. Add Agent to Super Groups (Optional)

To enable your agent in Super Groups:

1. **Direct Messages**: Send a message to your agent directly to interact with it
2. **Group Messages**: Add your agent to Super Groups where it can respond to messages
3. **Agent Setup**: Use the `/setup` command in DM with your agent to select a Super Group that you are owner or admin of

## 🚀 Getting Started with Development

Now that your platform is set up, let's create your first agent!

### 1. Initialize a New Project

You can use a positional argument for the project directory:

```bash
superagent create my-awesome-agent
```

### 2. Configure Your Environment

Use the API token you generated in the Platform Setup section above:

```bash
superagent configure
```

When prompted, enter your API token from Step 2 of Platform Setup.

Or manually create a `.env` file:

```env
API_TOKEN=your_api_token_from_superdapp_dashboard
API_BASE_URL=https://api.superdapp.ai
```

> 💡 **Tip**: Your API token should be the one you generated in your SuperDapp dashboard in the Platform Setup section above.

### 3. Run Your Agent

```bash
superagent run
```

This will start your agent's webhook server, typically on port 3000.

### 4. Test Your Webhook Connection

Once your agent is running:

1. **Verify Local Server**: Visit `http://localhost:3000/health` to ensure your server is running
2. **Test Webhook Endpoint**: Your webhook endpoint should be available at `http://localhost:3000/webhook`
3. **Check SuperDapp Connection**: 
   - Go to your SuperDapp dashboard
   - Use the "Test Webhook" feature to send a test event to your agent *(Note: This feature is not supported yet)*
   - Check your agent's console logs for incoming webhook events
4. **Send Test Message**: 
   - Open SuperDapp and send a direct message to your agent
   - Verify your agent receives and responds to the message

> 🔧 **Troubleshooting**: If webhooks aren't working, check:
> - Your ngrok/tunnel is still running and the URL hasn't changed
> - Your webhook URL in SuperDapp dashboard is correct
> - Your agent server is running and listening on the right port
> - Check console logs for any errors

## 🚀 Production Webhook Setup

When deploying your agent to production, you'll need a stable webhook URL.

### Deployment Options

**Option 1: Cloudflare Workers** (Recommended)
```bash
superagent deploy --platform cloudflare
```

**Option 2: AWS Lambda**
```bash
superagent deploy --platform aws
```

**Option 3: Traditional Server** (VPS, Docker, etc.)
- Deploy your agent to a server with a public IP
- Use a domain name with HTTPS (required for webhooks)
- Update your webhook URL in SuperDapp dashboard to: `https://yourdomain.com/webhook`

### Webhook Security Best Practices

1. **Use HTTPS**: SuperDapp requires HTTPS for webhook URLs in production
2. **Validate Webhooks**: Verify webhook requests come from SuperDapp
3. **Handle Errors Gracefully**: Always respond with appropriate HTTP status codes
4. **Rate Limiting**: Implement rate limiting to handle high message volumes
5. **Logging**: Log webhook events for debugging and monitoring

Example webhook validation:
```typescript
app.post('/webhook', async (req, res) => {
  try {
    // Validate request (add your validation logic here)
    const isValid = validateSuperdappWebhook(req);
    if (!isValid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Process the webhook
    await agent.processRequest(req.body);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
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

- **Platform Integration**: Review the Platform Setup section if you haven't configured your SuperDapp account yet
- **Advanced Features**: Check out the [CLI Documentation](./cli-guide.md) for detailed command usage
- **API Reference**: Explore [API Reference](./api-reference.md) for more complex scenarios and complete documentation
- **Production Deployment**: Learn about [Deployment](./deployment.md) options for scaling your agent
- **Examples**: Study the [examples directory](../examples/) for real-world agent implementations

## 🔗 Additional Resources

- **[SuperDapp Platform](https://web.superdapp.ai)** - Agent dashboard and management
- **[SDK Repository](https://github.com/SuperDappAI/superdapp-js)** - Source code and community
- **[API Documentation](https://docs.superdapp.ai)** - Complete platform API reference
- **[Community Support](https://discord.gg/superdapp)** - Get help from other developers
