# AI Provider Configuration

The SuperDapp Agents SDK includes built-in support for multiple AI providers through the Vercel AI SDK. This allows you to easily switch between different AI models and providers in your agents.

## Quick Start

```typescript
import { loadModel } from '@superdapp/agents';

// Load model from environment variables
const model = await loadModel();

// Use the model in your agent
const response = await generateText({
  model,
  prompt: 'Hello, how can I help you?',
});
```

## Supported Providers

- **OpenAI** - GPT-4, GPT-3.5, and other OpenAI models
- **Anthropic** - Claude 3 Sonnet, Opus, and Haiku models  
- **Google** - Gemini Pro and other Google AI models

## Configuration

### Environment Variables

Set these environment variables to configure your AI provider:

```bash
AI_PROVIDER=openai          # Provider: openai, anthropic, or google
AI_MODEL=gpt-4             # Model name
AI_API_KEY=sk-your-key     # API key for the provider
AI_BASE_URL=https://...    # Optional: Custom API base URL
```

### Programmatic Configuration

You can also configure the AI provider programmatically:

```typescript
import { loadModel } from '@superdapp/agents';

const model = await loadModel({
  provider: 'openai',
  model: 'gpt-4',
  apiKey: 'sk-your-api-key',
  baseUrl: 'https://api.openai.com/v1', // Optional
});
```

## Provider-Specific Examples

### OpenAI

```typescript
// Environment variables
AI_PROVIDER=openai
AI_MODEL=gpt-4
AI_API_KEY=sk-your-openai-key

// Or programmatically
const model = await loadModel({
  provider: 'openai',
  model: 'gpt-4',
  apiKey: 'sk-your-openai-key',
});
```

### Anthropic

```typescript
// Environment variables
AI_PROVIDER=anthropic
AI_MODEL=claude-3-sonnet-20240229
AI_API_KEY=your-anthropic-key

// Or programmatically
const model = await loadModel({
  provider: 'anthropic',
  model: 'claude-3-sonnet-20240229',
  apiKey: 'your-anthropic-key',
});
```

### Google

```typescript
// Environment variables
AI_PROVIDER=google
AI_MODEL=gemini-pro
AI_API_KEY=your-google-key

// Or programmatically
const model = await loadModel({
  provider: 'google',
  model: 'gemini-pro',
  apiKey: 'your-google-key',
});
```

## Custom Base URLs

You can override the default API base URL for any provider:

```typescript
const model = await loadModel({
  provider: 'openai',
  model: 'gpt-4',
  apiKey: 'sk-your-key',
  baseUrl: 'https://your-custom-endpoint.com/v1',
});
```

## Error Handling

The AI configuration loader provides clear error messages for common issues:

```typescript
import { loadModel, AIConfigError } from '@superdapp/agents';

try {
  const model = await loadModel();
} catch (error) {
  if (error instanceof AIConfigError) {
    console.error('AI Config Error:', error.message);
    console.error('Error Code:', error.code);
    
    switch (error.code) {
      case 'INVALID_CONFIG':
        // Missing or invalid configuration
        break;
      case 'UNSUPPORTED_PROVIDER':
        // Provider not supported
        break;
      case 'PROVIDER_LOAD_ERROR':
        // Failed to load AI SDK package
        break;
    }
  }
}
```

## Using with SuperDapp Agents

Here's how to integrate AI models with your SuperDapp agents:

```typescript
import { SuperDappAgent, loadModel } from '@superdapp/agents';
import { generateText } from 'ai';

const agent = new SuperDappAgent(config);
const model = await loadModel();

agent.addCommand('/ask', async (message, replyMessage, roomId) => {
  const userQuery = message.body.m?.body?.split(' ').slice(1).join(' ');
  
  if (!userQuery) {
    await agent.sendConnectionMessage(roomId, 'Please provide a question to ask.');
    return;
  }

  try {
    const { text } = await generateText({
      model,
      prompt: `You are a helpful assistant. Answer this question: ${userQuery}`,
    });

    await agent.sendConnectionMessage(roomId, text);
  } catch (error) {
    await agent.sendConnectionMessage(roomId, 'Sorry, I encountered an error processing your request.');
  }
});
```

## API Reference

### `loadModel(config?: Partial<AIConfig>)`

Loads and configures an AI model instance.

**Parameters:**
- `config` (optional) - AI configuration object

**Returns:** 
- Promise resolving to a Vercel AI SDK model instance wrapped with `aisdk()`

### `loadAIConfig(config?: Partial<AIConfig>)`

Loads AI configuration from environment variables or provided config.

**Parameters:**
- `config` (optional) - Partial AI configuration object

**Returns:**
- `AIConfig` object with validated configuration

### `isSupportedProvider(provider: string)`

Checks if a provider is supported.

**Parameters:**
- `provider` - Provider name to check

**Returns:**
- `boolean` - True if provider is supported

### `getSupportedProviders()`

Gets list of all supported providers.

**Returns:**
- `AIProvider[]` - Array of supported provider names

### Types

```typescript
export type AIProvider = 'openai' | 'anthropic' | 'google';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export class AIConfigError extends Error {
  constructor(message: string, public readonly code?: string);
}
```

## Installation Requirements

The AI provider configuration automatically loads the appropriate AI SDK packages. Make sure you have the required packages installed for your chosen provider:

```bash
# For OpenAI (always installed)
npm install @ai-sdk/openai

# For Anthropic (optional)
npm install @ai-sdk/anthropic

# For Google (optional)  
npm install @ai-sdk/google

# Core requirement
npm install @openai/agents-extensions
```

The SuperDapp Agents SDK includes `@ai-sdk/openai` and `@openai/agents-extensions` by default, while `@ai-sdk/anthropic` and `@ai-sdk/google` are optional dependencies that you can install as needed.