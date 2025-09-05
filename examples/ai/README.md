# AI Integration Examples

This directory contains comprehensive examples demonstrating how to build AI-powered agents using the SuperDapp Agents SDK with multiple AI providers.

## 🏗️ Project Structure

The AI examples are organized as standalone, runnable projects, each demonstrating different aspects of AI integration:

```
ai/
├── basic-openai/          # Basic OpenAI integration
├── anthropic-chat/        # Anthropic Claude capabilities  
├── multi-provider/        # Model-agnostic development
├── enhanced-features/     # Advanced AI capabilities
└── README.md             # This overview
```

## 📁 Example Projects

### 🤖 [Basic OpenAI](./basic-openai/)
**Perfect for getting started with OpenAI integration**

- **Focus**: Essential OpenAI features and commands
- **Commands**: `/ask`, `/chat`, `/code`, `/write`, `/status`, `/help`
- **Features**: Q&A, conversations, code assistance, creative writing
- **Best for**: Learning OpenAI basics, general-purpose AI agent

**Quick Start:**
```bash
cd examples/ai/basic-openai
npm install && npm run dev
```

### 🧠 [Anthropic Chat](./anthropic-chat/)
**Showcases Claude's reasoning and analysis strengths**

- **Focus**: Claude-specific capabilities for deep thinking
- **Commands**: `/analyze`, `/research`, `/essay`, `/ethics`, `/story`, `/claude`
- **Features**: Topic analysis, research assistance, academic writing, ethical discussions
- **Best for**: Analysis, research, thoughtful conversations, academic content

**Quick Start:**
```bash
cd examples/ai/anthropic-chat  
npm install && npm run dev
```

### 🔄 [Multi-Provider](./multi-provider/)
**Demonstrates model-agnostic AI development**

- **Focus**: Universal commands that work with any AI provider
- **Commands**: `/generate`, `/chat`, `/compare`, `/optimal`, `/status`
- **Providers**: OpenAI, Anthropic, Google AI
- **Features**: Easy provider switching, provider comparison, optimal task suggestions
- **Best for**: Flexible deployments, provider experimentation, cost optimization

**Quick Start:**
```bash
cd examples/ai/multi-provider
npm install && npm run dev
```

### 🚀 [Enhanced Features](./enhanced-features/)
**Advanced AI capabilities and enterprise features**

- **Focus**: Production-ready AI features and safety
- **Commands**: `/ask`, `/compare`, `/stream`, `/safe`, `/trace`
- **Features**: Guardrails, parallel processing, streaming, tracing, monitoring
- **Best for**: Enterprise applications, safety-critical systems, performance optimization

**Quick Start:**
```bash
cd examples/ai/enhanced-features
npm install && npm run dev
```

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+
- SuperDapp API token
- AI provider API key (OpenAI, Anthropic, or Google AI)

### 1. Choose Your Starting Point

**New to AI?** → Start with [Basic OpenAI](./basic-openai/)
**Need Analysis?** → Try [Anthropic Chat](./anthropic-chat/)  
**Want Flexibility?** → Use [Multi-Provider](./multi-provider/)
**Building Production?** → Explore [Enhanced Features](./enhanced-features/)

### 2. Setup Any Example

```bash
# Navigate to your chosen example
cd examples/ai/[example-name]

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your API keys in .env
# Start development server
npm run dev
```

### 3. Environment Configuration

Each example includes comprehensive environment setup:

```env
# SuperDapp API (Required for all)
API_TOKEN=your_superdapp_token
API_BASE_URL=https://api.superdapp.ai

# AI Provider (Choose one)
AI_PROVIDER=openai|anthropic|google
AI_MODEL=model_name
AI_API_KEY=your_api_key
```

## 🔧 Common Commands

All examples follow consistent patterns:

| Command | Purpose | Available In |
|---------|---------|--------------|
| `/start` | Welcome and introduction | All examples |
| `/help` | Show available commands | All examples |
| `/status` | Check AI configuration | All examples |
| `/ask` or `/generate` | Basic AI text generation | All examples |
| `/chat` | Conversational AI | All examples |

## 🎯 Use Case Guide

### Content Creation
- **Blog posts, articles**: [Anthropic Chat](./anthropic-chat/) → `/essay`
- **Creative writing**: [Basic OpenAI](./basic-openai/) → `/write`
- **Multiple perspectives**: [Enhanced Features](./enhanced-features/) → `/compare`

### Code Assistance  
- **Programming help**: [Basic OpenAI](./basic-openai/) → `/code`
- **Technical explanations**: [Multi-Provider](./multi-provider/) → `/generate`

### Research & Analysis
- **Deep analysis**: [Anthropic Chat](./anthropic-chat/) → `/analyze`
- **Research assistance**: [Anthropic Chat](./anthropic-chat/) → `/research`
- **Multi-approach analysis**: [Enhanced Features](./enhanced-features/) → `/compare`

### Business Applications
- **Safe content**: [Enhanced Features](./enhanced-features/) → `/safe`
- **Performance monitoring**: [Enhanced Features](./enhanced-features/) → `/trace`
- **Provider cost optimization**: [Multi-Provider](./multi-provider/)

## 🔐 Security & Best Practices

### Environment Variables
- ✅ Use `.env` files for configuration (automatically gitignored)
- ✅ Never commit API keys to version control
- ✅ Use different keys for development and production
- ✅ Rotate API keys regularly

### Input Validation
- ✅ Validate all user inputs before processing
- ✅ Implement length limits and content filtering
- ✅ Use the guardrails features in [Enhanced Features](./enhanced-features/)

### Error Handling
- ✅ All examples include comprehensive error handling
- ✅ User-friendly error messages with actionable guidance
- ✅ Graceful degradation when AI services are unavailable

### Rate Limiting
- ✅ Implement request throttling for production use
- ✅ Monitor API usage and costs
- ✅ Use appropriate model selection for your use case

## 📊 Performance Considerations

### Model Selection
- **GPT-4**: Maximum capability, higher cost
- **GPT-3.5 Turbo**: Balanced performance and cost
- **Claude 3 Sonnet**: Great reasoning, competitive pricing  
- **Gemini Pro**: Good knowledge synthesis, cost-effective

### Temperature Settings
- **0.2-0.4**: Technical, factual content
- **0.5-0.7**: Balanced responses
- **0.8-0.9**: Creative, varied content

### Token Management
- **Short responses**: 300-500 tokens
- **Medium content**: 500-1000 tokens
- **Long-form**: 1000+ tokens
- Monitor costs with appropriate limits

## 🔄 Migration Guide

### From Old Structure

If you were using the previous flat file structure:

1. **Choose equivalent project**: 
   - `openai-example.ts` → [Basic OpenAI](./basic-openai/)
   - `anthropic-example.ts` → [Anthropic Chat](./anthropic-chat/)
   - `multi-provider-example.ts` → [Multi-Provider](./multi-provider/)
   - Enhanced examples → [Enhanced Features](./enhanced-features/)

2. **Copy your customizations**: Import any custom commands or configurations

3. **Update imports**: Use the new project structure paths

4. **Test thoroughly**: Verify all functionality works with the new structure

### From Direct SDK Usage

To migrate from direct SDK usage to these examples:

1. **Identify your use case**: Choose the most appropriate example
2. **Copy example structure**: Use as a starting point
3. **Add your commands**: Follow the established patterns
4. **Configure environment**: Set up proper environment variables

## 📚 Additional Resources

### Documentation
- [AI Integration Guide](../../docs/ai-integration.md) - Complete setup and usage guide
- [SuperDapp SDK Documentation](../../docs/README.md) - Full SDK documentation
- [Test Files](../../src/__tests__/ai/) - Additional usage patterns in tests

### Provider Documentation
- **OpenAI**: [API Docs](https://platform.openai.com/docs) | [Model Info](https://platform.openai.com/docs/models)
- **Anthropic**: [API Docs](https://docs.anthropic.com/) | [Claude Models](https://docs.anthropic.com/claude/docs/models-overview)
- **Google AI**: [API Docs](https://ai.google.dev/docs) | [Gemini Models](https://ai.google.dev/models/gemini)

### Community
- [Discord Community](https://discord.gg/superdappai) - Get help and share projects
- [GitHub Issues](https://github.com/SuperDapp/superdapp-js/issues) - Report bugs and request features

## 🤝 Contributing

### Adding New Examples

1. **Create project directory**: Follow the established naming pattern
2. **Use template structure**: Copy from existing examples
3. **Add unique functionality**: Demonstrate specific capabilities
4. **Include documentation**: Comprehensive README with examples
5. **Test thoroughly**: Ensure builds, runs, and commands work
6. **Update this README**: Add your example to the overview

### Improving Existing Examples

1. **Follow patterns**: Maintain consistency across examples
2. **Test changes**: Verify builds and functionality
3. **Update documentation**: Keep READMEs current
4. **Add value**: Focus on educational and practical improvements

## 📝 License

These examples are part of the SuperDapp Agents SDK and are released under the MIT License.