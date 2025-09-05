# Anthropic Claude SuperDapp Agent

An AI-powered SuperDapp agent demonstrating Anthropic Claude's capabilities for reasoning, analysis, and thoughtful conversation. Claude excels at complex analysis, academic writing, and ethical discussions.

## ✨ Features

- **Deep Analysis** (`/analyze`) - Thorough topic analysis with multiple perspectives
- **Research Assistant** (`/research`) - Comprehensive research with suggestions for further investigation  
- **Academic Writing** (`/essay`) - Well-structured essays with clear arguments
- **Ethical Discussions** (`/ethics`) - Balanced philosophical discussions
- **Creative Storytelling** (`/story`) - Engaging narratives with rich characters
- **Thoughtful Conversation** (`/claude`) - Natural dialogue with Claude's personality
- **Configuration Status** (`/status`) - Check AI setup and configuration
- **Interactive Help** (`/help`) - Get guidance on available commands

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- SuperDapp API token
- Anthropic API key

### 1. Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your credentials:

```env
# SuperDapp API Configuration
API_TOKEN=your_superdapp_api_token_here
API_BASE_URL=https://api.superdapp.ai

# Server Configuration  
PORT=3000

# Anthropic Configuration
AI_PROVIDER=anthropic
AI_MODEL=claude-3-sonnet-20240229
AI_API_KEY=sk-ant-your_anthropic_api_key_here
```

### 3. Run the Agent

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start

# With tunneling for remote testing
npm run dev:tunnel
```

## 💬 Commands

### Analysis & Research Commands

| Command | Usage | Description |
|---------|--------|-------------|
| `/analyze` | `/analyze The future of AI` | Deep topic analysis with reasoning |
| `/research` | `/research quantum computing trends` | Research assistance with key insights |
| `/essay` | `/essay Impact of social media` | Academic essay writing |
| `/ethics` | `/ethics Should AI have rights?` | Philosophical discussions |

### Creative & Conversation Commands

| Command | Usage | Description |
|---------|--------|-------------|
| `/story` | `/story A detective with synesthesia` | Creative storytelling |
| `/claude` | `/claude What fascinates you about creativity?` | Natural conversation |

### Utility Commands

| Command | Usage | Description |
|---------|--------|-------------|
| `/start` | `/start` | Welcome message and introduction |
| `/help` | `/help` | Show all available commands |
| `/status` | `/status` | Check AI configuration status |

## 🎯 Example Usage

```
User: /analyze The impact of artificial intelligence on employment
Claude: 🧠 Analysis:

The impact of AI on employment is multifaceted and evolving. Key considerations include:

**Job Displacement:**
- Automation of routine tasks across sectors
- Particular impact on manufacturing, data entry, basic analysis
...

User: /ethics Should we grant legal rights to advanced AI systems?
Claude: 🤔 Ethical Discussion:

This question touches on fundamental issues of consciousness, personhood, and legal frameworks...

User: /story A world where memories can be shared
Claude: 📖 Story:

Elena pressed her palm against the Memory Stone, feeling the familiar tingle...
```

## ⚙️ Configuration

### Claude Models

Supported Anthropic models (set via `AI_MODEL`):
- `claude-3-5-sonnet-20241022` - Most capable, latest version
- `claude-3-sonnet-20240229` - Balanced performance and cost
- `claude-3-haiku-20240307` - Fast and cost-effective

### Response Settings

The agent uses different temperature settings optimized for each use case:
- **Analysis** (`/analyze`): Temperature 0.6 - Balanced reasoning and insight
- **Research** (`/research`): Temperature 0.3 - Focused, factual responses
- **Essays** (`/essay`): Temperature 0.4 - Structured, coherent writing
- **Ethics** (`/ethics`): Temperature 0.7 - Thoughtful, nuanced discussion
- **Stories** (`/story`): Temperature 0.8 - Creative, engaging narratives
- **Conversation** (`/claude`): Temperature 0.7 - Natural, friendly dialogue

### Custom Base URL

For custom Anthropic deployments, set:
```env
AI_BASE_URL=https://your-custom-anthropic-endpoint.com
```

## 🛠️ Development

### Project Structure

```
anthropic-chat/
├── index.ts          # Main agent implementation
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── .env.example      # Environment template
└── README.md         # This file
```

### Available Scripts

```bash
npm run dev           # Development with auto-reload
npm run build         # Compile TypeScript  
npm start             # Run production build
npm run tunnel        # Create ngrok tunnel
npm run dev:tunnel    # Dev mode with tunnel
```

### Server Endpoints

- **Webhook**: `POST /webhook` - Receives SuperDapp webhook requests
- **Health**: `GET /health` - Server status and configuration

## 🔧 Customization

### Adding New Commands

```typescript
agent.addCommand('/custom', async ({ roomId, message }) => {
  const input = message.data?.split(' ').slice(1).join(' ');
  
  try {
    const aiClient = await agent.getAiClient();
    const response = await aiClient.generateText([
      { 
        role: "system", 
        content: "Your custom system prompt optimized for Claude" 
      },
      { role: "user", content: input }
    ], {
      temperature: 0.7,
      maxTokens: 800
    });
    
    await agent.sendConnectionMessage(roomId, response);
  } catch (error) {
    console.error('Custom Command Error:', error);
    await agent.sendConnectionMessage(roomId, 'Sorry, something went wrong.');
  }
});
```

### Claude-Optimized Prompts

Claude responds well to:
- Clear, specific instructions
- Requests for step-by-step reasoning
- Balanced perspective requests
- Structured output formats
- Acknowledgment of uncertainty

## 🧠 Claude's Strengths

This example showcases Claude's particular strengths:

- **Analytical Thinking**: Breaking down complex topics systematically
- **Academic Writing**: Structured, well-researched content
- **Ethical Reasoning**: Balanced discussion of moral questions  
- **Research Skills**: Comprehensive information synthesis
- **Creative Writing**: Rich narratives with character depth
- **Conversational AI**: Thoughtful, nuanced dialogue

## 🛡️ Error Handling

The agent includes comprehensive error handling:

- **Configuration Errors**: Guides users to set up Anthropic credentials
- **API Errors**: Graceful fallbacks with helpful error messages
- **Network Issues**: Retry logic and user-friendly notifications
- **Rate Limiting**: Appropriate handling of API limits

## 📚 Related Examples

- **[Basic OpenAI](../basic-openai/)** - GPT-powered conversations and utilities
- **[Multi-Provider](../multi-provider/)** - Switch between AI providers
- **[Enhanced Features](../enhanced-features/)** - Advanced AI capabilities

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This example is part of the SuperDapp Agents SDK and is released under the MIT License.