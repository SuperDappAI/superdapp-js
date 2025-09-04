# AI Integration Examples

This directory contains comprehensive examples demonstrating how to build AI-powered agents using the SuperDapp Agents SDK with multiple AI providers.

## 📁 Examples Overview

### 🤖 [OpenAI Example](./openai-example.ts)
Demonstrates integration with OpenAI's GPT models, showcasing:
- Basic Q&A with `/ask` command
- Conversational chat with `/chat` command  
- Code assistance with `/code` command
- Creative writing with `/write` command
- Proper error handling and user guidance

### 🧠 [Anthropic Example](./anthropic-example.ts)
Shows how to leverage Claude's reasoning and analysis capabilities:
- Deep topic analysis with `/analyze` command
- Academic essay writing with `/essay` command
- Research assistance with `/research` command
- Ethical discussions with `/ethics` command
- Creative storytelling with `/story` command
- Natural conversation with `/claude` command

### 🔄 [Multi-Provider Example](./multi-provider-example.ts)
Demonstrates the model-agnostic nature of the SDK:
- Single codebase that works with any provider
- Configuration status checking with `/status` command
- Universal text generation with `/generate` command
- Provider comparison capabilities
- Adaptive system prompts based on provider strengths
- Optimal task suggestions per provider

## 🚀 Quick Start

### 1. Prerequisites

Install the base SuperDapp SDK:
```bash
npm install @superdapp/agents
```

Install AI dependencies for your chosen provider(s):
```bash
# For OpenAI
npm install ai @ai-sdk/openai

# For Anthropic
npm install ai @ai-sdk/anthropic

# For Google AI
npm install ai @ai-sdk/google

# Or install all for maximum flexibility
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
```

### 2. Configuration

Set up your environment variables. Choose one provider to start:

#### OpenAI Configuration
```bash
export API_TOKEN=your_superdapp_api_token
export AI_PROVIDER=openai
export AI_MODEL=gpt-4
export AI_API_KEY=sk-your-openai-api-key
```

#### Anthropic Configuration
```bash
export API_TOKEN=your_superdapp_api_token
export AI_PROVIDER=anthropic
export AI_MODEL=claude-3-sonnet-20240229
export AI_API_KEY=sk-ant-your-anthropic-api-key
```

#### Google AI Configuration
```bash
export API_TOKEN=your_superdapp_api_token
export AI_PROVIDER=google
export AI_MODEL=gemini-pro
export AI_API_KEY=your-google-ai-api-key
```

Or use the interactive CLI:
```bash
superagent configure
```

### 3. Run Examples

```bash
# OpenAI example
npx ts-node examples/ai/openai-example.ts

# Anthropic example  
npx ts-node examples/ai/anthropic-example.ts

# Multi-provider example
npx ts-node examples/ai/multi-provider-example.ts
```

## 🎯 Example Use Cases

### OpenAI Example Commands
- `/ask What is machine learning?` - General Q&A
- `/chat How's your day going?` - Conversational AI
- `/code How do I use async/await?` - Programming help
- `/write A story about robots` - Creative content
- `/help` - Show all commands

### Anthropic Example Commands
- `/analyze Climate change impacts` - Deep analysis
- `/research Quantum computing trends` - Research assistance
- `/essay The future of AI` - Academic writing
- `/ethics Should AI have rights?` - Ethical discussions  
- `/story A time traveler's dilemma` - Creative storytelling
- `/claude What fascinates you about creativity?` - Natural conversation

### Multi-Provider Commands
- `/status` - Check current AI configuration
- `/generate Explain quantum physics` - Universal text generation
- `/chat Hello, how are you?` - Provider-adaptive conversation
- `/compare Write a haiku about technology` - Compare provider capabilities
- `/optimal` - See optimal tasks for current provider

## 🔧 Customization

### Adding Custom Commands

```typescript
agent.addCommand('/custom', async (message, replyMessage, roomId) => {
  const input = message.body.m?.body?.split(' ').slice(1).join(' ');
  
  try {
    const aiClient = agent.getAiClient();
    const response = await aiClient.generateText([
      { role: "system", content: "Your custom system prompt here" },
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

### Provider-Specific Optimization

```typescript
const config = agent.getConfig();
const provider = config.ai?.provider;

// Adapt behavior based on provider
switch (provider) {
  case 'openai':
    // Optimize for OpenAI's strengths
    break;
  case 'anthropic':  
    // Leverage Claude's reasoning abilities
    break;
  case 'google':
    // Use Gemini's knowledge synthesis
    break;
}
```

### Environment-Based Configuration

```typescript
// Check if AI is configured before using
const config = agent.getConfig();
if (config.ai) {
  const aiClient = agent.getAiClient();
  // Use AI features
} else {
  // Fallback behavior
  await agent.sendConnectionMessage(roomId, 'AI is not configured.');
}
```

## 🛡️ Error Handling

All examples include comprehensive error handling:

```typescript
try {
  const aiClient = agent.getAiClient();
  const response = await aiClient.generateText(prompt);
  await agent.sendConnectionMessage(roomId, response);
} catch (error) {
  if (error.message.includes('AI configuration')) {
    // Guide user to configure AI
    await agent.sendConnectionMessage(roomId, 
      'AI is not configured. Run `superagent configure` to set up AI integration.');
  } else {
    // Handle other errors gracefully
    console.error('AI Error:', error);
    await agent.sendConnectionMessage(roomId, 
      'Sorry, I encountered an error processing your request.');
  }
}
```

## 💡 Best Practices

### 1. Temperature Settings
- **Creative tasks** (stories, poems): 0.8-0.9
- **Conversational**: 0.7-0.8  
- **Factual/Research**: 0.3-0.5
- **Code generation**: 0.2-0.4

### 2. Token Limits
- **Short responses**: 300-500 tokens
- **Medium content**: 500-1000 tokens
- **Long-form**: 1000-1500 tokens
- **Monitor costs** with appropriate limits

### 3. System Prompts
- Be specific about the desired output format
- Include personality and tone guidelines
- Set clear boundaries and expectations
- Adapt prompts to provider strengths

### 4. User Experience
- Always validate user input
- Provide clear usage instructions
- Handle edge cases gracefully
- Give feedback on processing status

## 🔗 Provider-Specific Resources

### OpenAI
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Model Capabilities](https://platform.openai.com/docs/models)
- [Best Practices](https://platform.openai.com/docs/guides/best-practices)

### Anthropic
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Claude Model Cards](https://docs.anthropic.com/claude/docs/models-overview)
- [Prompt Engineering](https://docs.anthropic.com/claude/docs/prompt-engineering)

### Google AI
- [Google AI Documentation](https://ai.google.dev/docs)
- [Gemini Models](https://ai.google.dev/models/gemini)
- [API Reference](https://ai.google.dev/api)

## 📚 Additional Resources

- [AI Integration Guide](../../docs/ai-integration.md) - Complete setup and usage guide
- [SuperDapp SDK Documentation](../../docs/README.md) - Full SDK documentation
- [Test Files](../../src/__tests__/ai/) - Additional usage patterns in tests

## 🤝 Contributing

Have an idea for a new AI example? Found a bug or improvement? Please:

1. Fork the repository
2. Create a feature branch
3. Add your example with proper documentation
4. Include error handling and user guidance
5. Test with multiple providers if applicable
6. Submit a pull request

## 📝 License

These examples are part of the SuperDapp Agents SDK and are released under the MIT License.