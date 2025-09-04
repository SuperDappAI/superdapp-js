# AI Integration Guide

The SuperDapp Agents SDK provides seamless integration with multiple AI providers, allowing you to build intelligent agents powered by OpenAI, Anthropic, or Google AI models.

## Overview

The AI integration is designed to be:

- **Model-agnostic**: Switch between providers without code changes
- **Optional**: Zero impact on existing agents when not configured
- **Environment-driven**: Configuration via environment variables
- **Type-safe**: Full TypeScript support with proper type inference

## Quick Start

### 1. Install Dependencies

The AI integration uses the [Vercel AI SDK](https://sdk.vercel.ai/) under the hood:

```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
```

### 2. Configure Environment Variables

Use the SuperDapp CLI to configure AI integration:

```bash
# Interactive configuration
superagent configure

# Or set environment variables manually
export AI_PROVIDER=openai
export AI_MODEL=gpt-4
export AI_API_KEY=sk-your-openai-api-key
```

### 3. Use in Your Agent

```typescript
import { SuperDappAgent, createBotConfig } from '@superdapp/agents';

const agent = new SuperDappAgent(createBotConfig());

agent.addCommand('/ask', async (message, replyMessage, roomId) => {
  const question = message.body.m?.body?.split(' ').slice(1).join(' ');
  if (!question) {
    await agent.sendConnectionMessage(roomId, 'Please provide a question!');
    return;
  }

  try {
    const aiClient = agent.getAiClient();
    const response = await aiClient.generateText(question);
    await agent.sendConnectionMessage(roomId, response);
  } catch (error) {
    console.error('AI Error:', error);
    await agent.sendConnectionMessage(roomId, 'Sorry, I had trouble processing that request.');
  }
});

await agent.initialize();
```

## Supported Providers

### OpenAI

Configure OpenAI integration:

```bash
export AI_PROVIDER=openai
export AI_MODEL=gpt-4  # or gpt-3.5-turbo, gpt-4-turbo
export AI_API_KEY=sk-your-openai-api-key
export AI_BASE_URL=https://api.openai.com/v1  # optional
```

Popular models:
- `gpt-4`: Best reasoning and complex tasks
- `gpt-4-turbo`: Faster and cheaper than GPT-4
- `gpt-3.5-turbo`: Fast and cost-effective

### Anthropic

Configure Anthropic Claude integration:

```bash
export AI_PROVIDER=anthropic
export AI_MODEL=claude-3-sonnet-20240229
export AI_API_KEY=sk-ant-your-anthropic-api-key
export AI_BASE_URL=https://api.anthropic.com  # optional
```

Popular models:
- `claude-3-opus-20240229`: Most capable model
- `claude-3-sonnet-20240229`: Balanced performance
- `claude-3-haiku-20240307`: Fast and lightweight

### Google AI

Configure Google AI integration:

```bash
export AI_PROVIDER=google
export AI_MODEL=gemini-pro
export AI_API_KEY=your-google-ai-api-key
```

Popular models:
- `gemini-pro`: Google's most capable model
- `gemini-pro-vision`: Supports images and text

## Environment Configuration

### Using CLI (Recommended)

The SuperDapp CLI provides an interactive way to configure AI integration:

```bash
superagent configure
```

This will:
1. Detect your runtime environment (Node.js, Cloudflare Workers, AWS Lambda)
2. Prompt for AI provider selection
3. Guide you through API key setup
4. Generate the appropriate environment file format

### Manual Configuration

#### For Node.js (.env)

```bash
# SuperDapp Agent Configuration
API_TOKEN=your_superdapp_api_token
API_BASE_URL=https://api.superdapp.ai
NODE_ENV=development
PORT=8787

# AI Integration Configuration
AI_PROVIDER=openai
AI_MODEL=gpt-4
AI_API_KEY=sk-your-openai-api-key
AI_BASE_URL=https://api.openai.com/v1
```

#### For Cloudflare Workers (.dev.vars)

```bash
API_TOKEN=your_superdapp_api_token
API_BASE_URL=https://api.superdapp.ai
NODE_ENV=development

AI_PROVIDER=openai
AI_MODEL=gpt-4
AI_API_KEY=sk-your-openai-api-key
AI_BASE_URL=https://api.openai.com/v1
```

#### For AWS Lambda (env.json)

```json
{
  "myBotFunction": {
    "API_TOKEN": "your_superdapp_api_token",
    "API_BASE_URL": "https://api.superdapp.ai",
    "NODE_ENV": "production",
    "AI_PROVIDER": "openai",
    "AI_MODEL": "gpt-4",
    "AI_API_KEY": "sk-your-openai-api-key",
    "AI_BASE_URL": "https://api.openai.com/v1"
  }
}
```

## AI Client API

### generateText(input, options?)

Generate text completion for a simple prompt or conversation:

```typescript
const aiClient = agent.getAiClient();

// Simple text generation
const response = await aiClient.generateText("Explain quantum computing");

// Conversation with context
const conversation = [
  { role: "system", content: "You are a helpful coding assistant" },
  { role: "user", content: "How do I create a React component?" }
];
const response = await aiClient.generateText(conversation);

// With additional options
const response = await aiClient.generateText("Write a haiku", {
  temperature: 0.8,
  maxTokens: 100
});
```

### streamText(messages, options?)

Stream text generation for real-time responses:

```typescript
const aiClient = agent.getAiClient();

const messages = [
  { role: "system", content: "You are a creative writing assistant" },
  { role: "user", content: "Write a short story about AI" }
];

const stream = await aiClient.streamText(messages, {
  temperature: 0.7
});

for await (const chunk of stream) {
  // Process each chunk of the response
  console.log(chunk.textDelta);
}
```

### runAgent(input, options?)

Run a more sophisticated AI agent with tools and instructions:

```typescript
const aiClient = agent.getAiClient();

const result = await aiClient.runAgent("Calculate the square root of 144", {
  instructions: "You are a math tutor. Always show your work.",
  tools: {
    calculator: {
      description: "Perform mathematical calculations",
      // Tool implementation would go here
    }
  }
});

console.log(result);
```

## Advanced Usage

### Custom Configuration

You can override AI configuration at runtime:

```typescript
agent.addCommand('/custom-ai', async (message, replyMessage, roomId) => {
  const aiClient = agent.getAiClient();
  
  const response = await aiClient.generateText("Hello!", {
    config: {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      apiKey: process.env.CUSTOM_ANTHROPIC_KEY,
    },
    temperature: 0.5
  });
  
  await agent.sendConnectionMessage(roomId, response);
});
```

### Error Handling

The AI integration provides clear error messages:

```typescript
agent.addCommand('/ai-safe', async (message, replyMessage, roomId) => {
  try {
    const aiClient = agent.getAiClient();
    const response = await aiClient.generateText("Hello!");
    await agent.sendConnectionMessage(roomId, response);
  } catch (error) {
    if (error.message.includes('AI configuration')) {
      await agent.sendConnectionMessage(roomId, 
        'AI is not configured. Run `superagent configure` to set up AI integration.');
    } else {
      console.error('AI Error:', error);
      await agent.sendConnectionMessage(roomId, 
        'Sorry, I encountered an error processing your request.');
    }
  }
});
```

### Lazy Loading

The AI client is only loaded when needed, ensuring your agent works even without AI dependencies:

```typescript
// This works even without AI configured
const agent = new SuperDappAgent(createBotConfig());

// AI is only loaded when getAiClient() is called
agent.addCommand('/maybe-ai', async (message, replyMessage, roomId) => {
  const config = agent.getConfig();
  
  if (config.ai) {
    // AI is configured, use it
    const aiClient = agent.getAiClient();
    const response = await aiClient.generateText("Hello!");
    await agent.sendConnectionMessage(roomId, response);
  } else {
    // AI not configured, fallback behavior
    await agent.sendConnectionMessage(roomId, "AI is not configured.");
  }
});
```

## Examples

### Chat Bot with Memory

```typescript
import { SuperDappAgent, createBotConfig } from '@superdapp/agents';

const agent = new SuperDappAgent(createBotConfig());

// Store conversation history per user
const conversations = new Map<string, Array<{role: string, content: string}>>();

agent.addCommand('/chat', async (message, replyMessage, roomId) => {
  const userId = message.rawMessage.senderId;
  const userMessage = message.body.m?.body?.split(' ').slice(1).join(' ');
  
  if (!userMessage) {
    await agent.sendConnectionMessage(roomId, 'Please provide a message!');
    return;
  }

  // Get or create conversation history
  let conversation = conversations.get(userId) || [
    { role: "system", content: "You are a helpful assistant with a friendly personality." }
  ];
  
  // Add user message
  conversation.push({ role: "user", content: userMessage });
  
  try {
    const aiClient = agent.getAiClient();
    const response = await aiClient.generateText(conversation, {
      temperature: 0.7,
      maxTokens: 500
    });
    
    // Add AI response to history
    conversation.push({ role: "assistant", content: response });
    
    // Keep conversation history manageable (last 10 messages)
    if (conversation.length > 10) {
      conversation = [conversation[0], ...conversation.slice(-9)];
    }
    
    conversations.set(userId, conversation);
    await agent.sendConnectionMessage(roomId, response);
  } catch (error) {
    console.error('Chat Error:', error);
    await agent.sendConnectionMessage(roomId, 'Sorry, I had trouble with that request.');
  }
});

agent.addCommand('/clear-chat', async (message, replyMessage, roomId) => {
  const userId = message.rawMessage.senderId;
  conversations.delete(userId);
  await agent.sendConnectionMessage(roomId, 'Chat history cleared!');
});
```

### Code Assistant

```typescript
agent.addCommand('/code', async (message, replyMessage, roomId) => {
  const question = message.body.m?.body?.split(' ').slice(1).join(' ');
  
  if (!question) {
    await agent.sendConnectionMessage(roomId, 'Please ask a coding question!');
    return;
  }

  const systemPrompt = `You are an expert software developer. Provide clear, practical answers with code examples when appropriate. Keep responses concise but complete.`;

  try {
    const aiClient = agent.getAiClient();
    const response = await aiClient.generateText([
      { role: "system", content: systemPrompt },
      { role: "user", content: question }
    ], {
      temperature: 0.3,  // Lower temperature for more focused responses
      maxTokens: 1000
    });
    
    await agent.sendConnectionMessage(roomId, response);
  } catch (error) {
    console.error('Code Assistant Error:', error);
    await agent.sendConnectionMessage(roomId, 'Sorry, I had trouble processing your coding question.');
  }
});
```

## Troubleshooting

### Common Issues

#### "AI configuration is missing or incomplete"

This error occurs when AI environment variables are not properly set. Check:

1. All required variables are set: `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`
2. The provider value is valid: `openai`, `anthropic`, or `google`
3. The API key format matches the provider requirements

#### "Failed to get response from the AI model"

This usually indicates an API issue:

1. Verify your API key is valid and has sufficient credits
2. Check if the model name is correct for your provider
3. Ensure your API key has access to the specified model

#### Module import errors

If you see errors about missing AI modules:

```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
```

### Validation

The SDK provides helpful validation:

```bash
# Use the CLI to validate your configuration
superagent configure --validate

# Or check manually in your code
import { validateAiConfig } from '@superdapp/agents';

const result = validateAiConfig(config.ai);
if (!result.isValid) {
  console.error('AI Configuration Error:', result.error);
}
```

## Best Practices

### Security

- Never commit API keys to version control
- Use environment variables or secure secret management
- Rotate API keys regularly
- Monitor API usage and set limits

### Performance

- Use appropriate temperature settings (0.0-1.0)
- Set reasonable token limits to control costs
- Implement caching for repeated queries
- Use streaming for long responses

### Error Handling

- Always wrap AI calls in try-catch blocks
- Provide fallback responses when AI fails
- Log errors for debugging but don't expose sensitive details to users
- Implement retry logic for transient failures

### Cost Management

- Monitor API usage and costs
- Use cheaper models for simple tasks
- Implement rate limiting to prevent abuse
- Cache common responses when appropriate

## API Reference

For complete API documentation, see the [TypeScript type definitions](../src/ai/types.ts) and [client implementation](../src/ai/client.ts).

## Need Help?

- Check the [examples](../examples/) directory for complete working examples
- Review the [test files](../src/__tests__/ai/) for usage patterns
- Open an issue on GitHub for bugs or feature requests
- Join our community Discord for support and discussions
