# Enhanced AI Features SuperDapp Agent

A comprehensive SuperDapp agent showcasing advanced AI capabilities including guardrails, parallel processing, streaming responses, comprehensive tracing, and OpenAI Agents SDK integration.

## ✨ Features

- **Enhanced AI Generation** (`/ask`) - Basic AI with robust error handling and validation
- **Multi-Approach Analysis** (`/compare`) - Parallel processing with different AI approaches
- **Streaming Responses** (`/stream`) - Real-time progressive response updates
- **Safety Guardrails** (`/safe`) - Input/output validation with content filtering
- **Request Tracing** (`/trace`) - Comprehensive monitoring and performance analysis
- **Feature Status** (`/status`) - Check enhanced features configuration
- **Interactive Help** (`/help`) - Comprehensive guidance on all features

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- SuperDapp API token
- OpenAI API key (primary provider for enhanced features)
- Optional: Enhanced feature environment variables

### 1. Setup

```bash
# Install dependencies (includes OpenAI Agents SDK)
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

# OpenAI Configuration (Primary provider for enhanced features)
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
AI_API_KEY=sk-your_openai_api_key_here

# Enhanced AI Features (Optional)
SUPERDAPP_AI_AGENTS=1
SUPERDAPP_AI_TRACING=true
SUPERDAPP_AI_GUARDRAILS=true
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

### Enhanced AI Commands

| Command | Usage | Description |
|---------|--------|-------------|
| `/ask` | `/ask What is quantum computing?` | Basic AI generation with enhanced error handling |
| `/compare` | `/compare Explain blockchain technology` | Multi-approach parallel analysis |
| `/stream` | `/stream Write a story about robots` | Streaming response simulation |
| `/safe` | `/safe Cybersecurity best practices` | AI with safety guardrails and validation |
| `/trace` | `/trace How does machine learning work?` | AI with comprehensive request tracing |

### Utility Commands

| Command | Usage | Description |
|---------|--------|-------------|
| `/start` | `/start` | Welcome message and feature overview |
| `/help` | `/help` | Comprehensive help and examples |
| `/status` | `/status` | Check enhanced features configuration |

## 🎯 Example Usage

### Multi-Approach Analysis
```
User: /compare Explain artificial intelligence
Agent: 🔍 Analyzing your request with multiple approaches...

🔍 Multi-Approach Analysis Results:

1. Technical Approach:
Artificial intelligence (AI) refers to computational systems that can perform tasks typically requiring human intelligence. These systems use algorithms, neural networks, and machine learning to process data, recognize patterns, and make decisions...

2. Simple Approach:
Think of AI like teaching a computer to think and learn like a human. Just as you learned to recognize faces, understand speech, or solve problems, AI systems learn from examples and practice...

3. Creative Approach:
Imagine AI as humanity's digital offspring - born from our desire to extend our minds beyond biological limits. Like Prometheus stealing fire from the gods, we've gifted machines with the spark of intelligence...

*This demonstrates parallel AI processing with different temperature settings and system prompts.*
```

### Safety Guardrails
```
User: /safe What are good cybersecurity practices?
Agent: 🛡️ Safe AI Response:

Here are essential cybersecurity best practices:

**Password Security:**
- Use strong, unique passwords for each account
- Enable two-factor authentication (2FA) wherever possible
- Use a reputable password manager...

*This response has been validated for safety and appropriateness.*
```

### Request Tracing
```
User: /trace Explain machine learning
Agent: 📊 Trace Update: Validating input... (15ms)
📊 Trace Update: Sending request to AI provider... (45ms)
📊 Trace Update: Formatting response... (120ms)

📊 AI Request Completed with Tracing

Response:
Machine learning is a subset of artificial intelligence that enables computers to learn and improve from data without being explicitly programmed...

Trace Summary:
• Total Processing Time: 2,847ms
• Events Tracked: 6
• Input Length: 27 characters
• Output Length: 432 characters
• Average Event Time: 474ms

*This demonstrates comprehensive request tracing and monitoring capabilities.*
```

## ⚙️ Enhanced Features

### 🛡️ Safety Guardrails

Comprehensive input and output validation:
- **Input Validation**: Content filtering, length limits, banned word detection
- **Output Validation**: Response length limits, safety checks
- **Error Handling**: Graceful failures with user guidance

```typescript
// Example guardrails configuration
const guardrails = {
  inputValidation: {
    maxLength: 500,
    bannedWords: ['inappropriate', 'harmful'],
  },
  outputValidation: {
    maxLength: 1000,
    requireApproval: false, // Can be set to true for human review
  }
};
```

### 🔍 Parallel Processing

Multiple AI approaches for comprehensive responses:
- **Technical Approach**: Low temperature (0.3), detailed technical explanations
- **Simple Approach**: Medium temperature (0.5), easy-to-understand language
- **Creative Approach**: High temperature (0.8), engaging metaphors and storytelling

### 📡 Streaming Responses

Real-time progressive updates:
- Simulates streaming AI responses
- Progressive content delivery
- User engagement during processing
- Status updates and completion notifications

### 📊 Request Tracing

Comprehensive monitoring and performance analysis:
- Event tracking throughout request lifecycle
- Performance metrics and timing analysis
- Error tracking and debugging information
- Session management and audit trails

## 🔧 Configuration Options

### Environment Variables

```env
# Core AI Configuration
AI_PROVIDER=openai                    # Primary provider
AI_MODEL=gpt-4o-mini                 # Recommended model
AI_API_KEY=sk-your-api-key           # OpenAI API key

# Enhanced Features
SUPERDAPP_AI_AGENTS=1                # Enable OpenAI Agents SDK
SUPERDAPP_AI_TRACING=true           # Enable request tracing
SUPERDAPP_AI_GUARDRAILS=true        # Enable safety guardrails

# Optional Customization
AI_BASE_URL=https://api.openai.com/v1  # Custom endpoint
MAX_TOKENS=1000                       # Default token limit
TEMPERATURE=0.7                       # Default temperature
```

### Model Recommendations

For enhanced features, we recommend:
- **Primary**: `gpt-4o-mini` - Optimized for speed and capability
- **Alternative**: `gpt-4` - Maximum capability, higher cost
- **Budget**: `gpt-3.5-turbo` - Cost-effective option

### Temperature Settings by Use Case

- **Technical explanations**: 0.3 - Focused, accurate responses
- **General conversation**: 0.7 - Natural, balanced responses  
- **Creative content**: 0.9 - Maximum creativity and variation

## 🛠️ Development

### Project Structure

```
enhanced-features/
├── index.ts          # Main agent with all enhanced features
├── package.json      # Dependencies including OpenAI Agents SDK
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
- **Health**: `GET /health` - Server status with enhanced features info

## 🔧 Customization

### Adding Custom Guardrails

```typescript
agent.addCommand('/custom-safe', async ({ roomId, message }) => {
  const input = message.data?.split(' ').slice(1).join(' ');
  
  // Custom validation logic
  const customChecks = {
    containsProfanity: checkProfanity(input),
    isSpam: detectSpam(input),
    isTooComplex: input.length > 1000
  };
  
  if (Object.values(customChecks).some(check => check)) {
    await agent.sendConnectionMessage(roomId, '🛡️ Content validation failed');
    return;
  }
  
  // Process with AI...
});
```

### Custom Parallel Approaches

```typescript
const customApproaches = [
  {
    name: "Business",
    systemPrompt: "You are a business analyst. Focus on practical applications and ROI.",
    temperature: 0.4
  },
  {
    name: "Academic", 
    systemPrompt: "You are a researcher. Provide scholarly, evidence-based responses.",
    temperature: 0.2
  },
  {
    name: "Futuristic",
    systemPrompt: "You are a futurist. Explore possibilities and emerging trends.",
    temperature: 0.8
  }
];
```

### Enhanced Tracing Events

```typescript
const traceEvent = (event: string, data?: any) => {
  const timestamp = Date.now();
  console.log(`[${timestamp}] ${event}:`, data);
  
  // Store in database or monitoring system
  tracingService.logEvent({
    timestamp,
    event, 
    data,
    sessionId: getCurrentSessionId()
  });
};
```

## 🎯 Use Cases

### Educational Applications
- Multi-perspective explanations for complex topics
- Safe content generation for educational materials
- Progress tracking and learning analytics

### Content Creation
- Parallel creative approaches for diverse content
- Quality assurance through output validation
- Real-time collaborative content generation

### Enterprise Applications
- Comprehensive audit trails for AI usage
- Safety compliance for customer-facing applications
- Performance monitoring and optimization

## 🛡️ Security & Compliance

The enhanced features include enterprise-grade security:

- **Input Sanitization**: Comprehensive validation and filtering
- **Output Validation**: Safety checks and content verification
- **Audit Trails**: Complete request and response logging
- **Error Handling**: Secure failure modes with user guidance
- **Rate Limiting**: Configurable request throttling
- **Content Moderation**: Automated safety checks

## 📚 Related Examples

- **[Basic OpenAI](../basic-openai/)** - Simple OpenAI integration
- **[Anthropic Chat](../anthropic-chat/)** - Claude-specific features
- **[Multi-Provider](../multi-provider/)** - Provider-agnostic development

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Add new enhanced features or capabilities
4. Include comprehensive tests and documentation
5. Submit a pull request

## 📄 License

This example is part of the SuperDapp Agents SDK and is released under the MIT License.