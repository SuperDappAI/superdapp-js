import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { SuperDappAgent, createBotConfig } from '../../../src';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'application/json' }));

/**
 * Multi-Provider AI SuperDapp Agent
 *
 * This example demonstrates the model-agnostic capabilities of the SuperDapp AI integration.
 * The same code works with different AI providers - just change environment variables!
 *
 * Supported Providers:
 * - OpenAI (GPT models)
 * - Anthropic (Claude models)
 * - Google AI (Gemini models)
 *
 * Features:
 * - Universal commands that work with any provider
 * - Provider-specific optimizations
 * - Easy switching between providers
 * - Configuration status and comparison tools
 */

function getProviderInfo(provider?: string): string {
  switch (provider) {
    case 'openai':
      return `• **Strengths:** Versatile, creative tasks, coding, conversational
• **Models:** GPT-4, GPT-3.5 Turbo, GPT-4 Turbo
• **Best for:** Code generation, creative writing, general Q&A`;

    case 'anthropic':
      return `• **Strengths:** Reasoning, analysis, long-form writing, ethics
• **Models:** Claude 3 Opus, Sonnet, Haiku
• **Best for:** Research, essays, philosophical discussions`;

    case 'google':
      return `• **Strengths:** Knowledge synthesis, multimodal, factual responses
• **Models:** Gemini Pro, Gemini Pro Vision
• **Best for:** Information synthesis, travel planning, explanations`;

    default:
      return `• Provider-specific capabilities will be shown once configured
• Each provider has unique strengths and optimal use cases`;
  }
}

// Helper: try to discover ngrok public URL and print webhook
async function printNgrokWebhook() {
  const apiUrl = 'http://127.0.0.1:4040/api/tunnels';
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const resp = await axios.get(apiUrl, { timeout: 1000 });
      const tunnels = resp.data?.tunnels || [];
      const selected =
        tunnels.find((t: any) => t.proto === 'https') || tunnels[0];
      const publicUrl = selected?.public_url;
      if (publicUrl) {
        console.log(`🌐 Public webhook: ${publicUrl}/webhook`);
        return;
      }
    } catch (_) {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

async function main() {
  try {
    console.log('🚀 Starting Multi-Provider AI Agent...');

    // Initialize the agent with error handling
    let config;
    try {
      config = createBotConfig();
    } catch (error: any) {
      if (error.message?.includes('API_TOKEN is required')) {
        console.error('❌ Configuration Error: API_TOKEN is required');
        console.error('Please set up your SuperDapp API token in .env file:');
        console.error('1. Copy .env.example to .env');
        console.error('2. Add your API_TOKEN=your_actual_token');
        console.error(
          '3. Configure AI settings (AI_PROVIDER, AI_MODEL, AI_API_KEY)'
        );
        process.exit(1);
      }
      throw error;
    }

    const agent = new SuperDappAgent(config);

    // Show current configuration
    agent.addCommand('/status', async ({ roomId }) => {
      const aiProvider = process.env.AI_PROVIDER;
      const aiModel = process.env.AI_MODEL;
      const aiApiKey = process.env.AI_API_KEY;
      const aiBaseUrl = process.env.AI_BASE_URL;

      if (!aiProvider || !aiModel || !aiApiKey) {
        await agent.sendConnectionMessage(
          roomId,
          '❌ **AI Not Configured**\n\nPlease configure an AI provider. See `/help` for setup instructions.'
        );
        return;
      }

      const statusMessage = `🤖 **AI Configuration Status**

**Provider:** ${aiProvider}
**Model:** ${aiModel}
**API Key:** ${aiApiKey ? '***' + aiApiKey.slice(-4) : 'Not set'}
**Base URL:** ${aiBaseUrl || 'Default'}

**Provider Capabilities:**
${getProviderInfo(aiProvider)}

To switch providers, change your environment variables and restart the agent.`;

      await agent.sendConnectionMessage(roomId, statusMessage);
    });

    // Universal text generation - works with any provider
    agent.addCommand('/generate', async ({ roomId, message }) => {
      const prompt = message.data?.split(' ').slice(1).join(' ');
      if (!prompt) {
        await agent.sendConnectionMessage(
          roomId,
          '💭 Please provide a prompt!\n\n**Usage:** `/generate Explain quantum physics`'
        );
        return;
      }

      try {
        const aiProvider = process.env.AI_PROVIDER;
        const aiModel = process.env.AI_MODEL;
        console.log(
          `🤖 Generating text using ${aiProvider || 'unknown'} - ${aiModel || 'unknown'}`
        );

        const aiClient = await agent.getAiClient();
        const response = await aiClient.generateText(prompt, {
          temperature: 0.7,
          maxTokens: 500,
        });

        await agent.sendConnectionMessage(
          roomId,
          `**Generated by ${aiProvider?.toUpperCase()} ${aiModel}:**\n\n${response}`
        );
      } catch (error: any) {
        console.error('Generation Error:', error);
        if (error.message?.includes('AI configuration')) {
          await agent.sendConnectionMessage(
            roomId,
            '⚠️ AI is not configured. Use `/status` to check configuration or `/help` for setup instructions.'
          );
        } else {
          await agent.sendConnectionMessage(
            roomId,
            '❌ Sorry, I had trouble generating that response.'
          );
        }
      }
    });

    // Compare responses (shows current provider info)
    agent.addCommand('/compare', async ({ roomId, message }) => {
      const prompt = message.data?.split(' ').slice(1).join(' ');
      if (!prompt) {
        await agent.sendConnectionMessage(
          roomId,
          '🔍 Please provide a prompt to compare!\n\n**Usage:** `/compare Write a haiku about technology`'
        );
        return;
      }

      try {
        const aiProvider = process.env.AI_PROVIDER;
        const currentProvider = aiProvider || 'unknown';

        await agent.sendConnectionMessage(
          roomId,
          `🤖 Generating response using **${currentProvider.toUpperCase()}**...\n\n*To compare with other providers, change your AI_PROVIDER environment variable and restart.*`
        );

        const aiClient = await agent.getAiClient();
        const response = await aiClient.generateText(prompt, {
          temperature: 0.7,
          maxTokens: 300,
        });

        await agent.sendConnectionMessage(
          roomId,
          `**${currentProvider.toUpperCase()} Response:**\n\n${response}\n\n*Try the same prompt with different providers to see how they differ!*`
        );
      } catch (error: any) {
        console.error('Compare Error:', error);
        await agent.sendConnectionMessage(
          roomId,
          '❌ Sorry, I had trouble generating that comparison.'
        );
      }
    });

    // Conversation that adapts to provider strengths
    agent.addCommand('/chat', async ({ roomId, message }) => {
      const userMessage = message.data?.split(' ').slice(1).join(' ');
      if (!userMessage) {
        await agent.sendConnectionMessage(
          roomId,
          '💬 Please provide a message!\n\n**Usage:** `/chat Hello, how are you?`'
        );
        return;
      }

      try {
        const provider = process.env.AI_PROVIDER;

        // Adapt system prompt based on provider strengths
        let systemPrompt = 'You are a helpful AI assistant.';

        switch (provider) {
          case 'openai':
            systemPrompt =
              "You are a versatile AI assistant powered by OpenAI. You're good at creative tasks, coding, and general conversations. Be helpful and engaging.";
            break;
          case 'anthropic':
            systemPrompt =
              'You are Claude, created by Anthropic. You excel at thoughtful analysis, reasoning, and nuanced discussions. Be helpful, honest, and acknowledge uncertainty when appropriate.';
            break;
          case 'google':
            systemPrompt =
              "You are Gemini, Google's AI assistant. You're knowledgeable and helpful across many domains. Provide clear, informative responses.";
            break;
        }

        const aiClient = await agent.getAiClient();
        const conversation = [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userMessage },
        ];

        const response = await aiClient.generateText(conversation, {
          temperature: 0.8,
          maxTokens: 400,
        });

        await agent.sendConnectionMessage(roomId, response);
      } catch (error: any) {
        console.error('Chat Error:', error);
        await agent.sendConnectionMessage(
          roomId,
          '❌ Sorry, I encountered an issue with the chat.'
        );
      }
    });

    // Provider-specific optimal tasks
    agent.addCommand('/optimal', async ({ roomId }) => {
      const provider = process.env.AI_PROVIDER;

      const suggestions = {
        openai: [
          '/generate Write a Python function to sort a list',
          '/generate Create a marketing slogan for a coffee shop',
          '/generate Explain the concept of recursion',
          '/chat How do I improve my coding skills?',
        ],
        anthropic: [
          '/generate Analyze the ethical implications of AI in hiring',
          '/generate Write a thoughtful essay on climate change',
          '/generate Compare different philosophical approaches to consciousness',
          '/chat What are the key considerations in moral decision-making?',
        ],
        google: [
          '/generate Summarize the latest developments in renewable energy',
          '/generate Create a travel itinerary for Japan',
          '/generate Explain how search engines work',
          '/chat What are the benefits of machine learning?',
        ],
      };

      const providerSuggestions = suggestions[
        provider as keyof typeof suggestions
      ] || [
        '/generate Tell me about artificial intelligence',
        '/chat Hello, how can you help me?',
      ];

      const messageText = `🎯 **Optimal Tasks for ${provider?.toUpperCase() || 'Current Provider'}**

Here are some tasks that work great with ${provider || 'your current provider'}:

${providerSuggestions.map((cmd) => `• \`${cmd}\``).join('\n')}

**Try these commands to see what ${provider || 'your AI provider'} does best!**`;

      await agent.sendConnectionMessage(roomId, messageText);
    });

    // Help command
    agent.addCommand('/help', async ({ roomId }) => {
      const aiProvider = process.env.AI_PROVIDER?.toUpperCase() || 'AI';
      const aiModel = process.env.AI_MODEL || 'Not configured';

      const helpText = `🤖 **Multi-Provider AI Agent**

**Current Provider:** ${aiProvider}
**Model:** ${aiModel}

**Universal Commands:**
• \`/status\` - Show AI configuration and provider info
• \`/generate <prompt>\` - Generate text with current provider
• \`/chat <message>\` - Have a conversation
• \`/compare <prompt>\` - Generate and show provider info
• \`/optimal\` - See optimal tasks for current provider
• \`/help\` - Show this help

**Key Features:**
✅ **Model Agnostic** - Same code, different providers
✅ **Easy Switching** - Change via environment variables
✅ **Provider Optimization** - Adapts to provider strengths
✅ **Configuration Status** - Always know what's configured

**Switch Providers:**

🔹 **OpenAI:**
\`\`\`
AI_PROVIDER=openai
AI_MODEL=gpt-4
AI_API_KEY=sk-your-openai-api-key
\`\`\`

🔹 **Anthropic:**
\`\`\`
AI_PROVIDER=anthropic
AI_MODEL=claude-3-sonnet-20240229
AI_API_KEY=sk-ant-your-anthropic-api-key
\`\`\`

🔹 **Google AI:**
\`\`\`
AI_PROVIDER=google
AI_MODEL=gemini-pro
AI_API_KEY=your-google-ai-api-key
\`\`\`

**Examples:**
• \`/generate Write a poem about space exploration\`
• \`/chat What makes you unique as an AI?\`
• \`/compare Explain quantum computing in simple terms\``;

      await agent.sendConnectionMessage(roomId, helpText);
    });

    // Start message
    agent.addCommand('/start', async ({ roomId }) => {
      const aiProvider = process.env.AI_PROVIDER?.toUpperCase() || 'Unknown';
      const aiModel = process.env.AI_MODEL || 'Not configured';

      const welcomeText = `👋 **Welcome to the Multi-Provider AI Agent!**

**Currently using:** ${aiProvider} (${aiModel})

This agent demonstrates model-agnostic AI integration:
• 🔄 **Universal Commands** - Same interface, any provider
• 🎯 **Provider Optimization** - Adapts to each AI's strengths  
• ⚙️ **Easy Switching** - Change providers via environment variables
• 📊 **Configuration Tools** - Monitor and compare providers

Type \`/help\` to see all available commands!
Type \`/status\` to check your current AI configuration.`;

      await agent.sendConnectionMessage(roomId, welcomeText);
    });

    // Setup webhook endpoint
    app.post('/webhook', async (req, res) => {
      try {
        await agent.processRequest(req.body);
        res.status(200).json({ status: 'success' });
      } catch (error: any) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ status: 'error', message: error.message });
      }
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'Multi-Provider AI SuperDapp Agent',
        provider: process.env.AI_PROVIDER || 'not configured',
        model: process.env.AI_MODEL || 'not configured',
        timestamp: new Date().toISOString(),
      });
    });

    // Start server
    const aiProvider = process.env.AI_PROVIDER?.toUpperCase() || 'UNKNOWN';
    const aiModel = process.env.AI_MODEL || 'unknown';

    app.listen(PORT, () => {
      console.log(`✅ Multi-Provider AI Agent server running on port ${PORT}`);
      console.log(`🤖 Current AI Provider: ${aiProvider} (${aiModel})`);
      console.log(
        `🔗 Available commands: /status, /generate, /chat, /compare, /optimal, /help`
      );
      console.log(
        `💡 Tip: Try different providers by changing AI_PROVIDER environment variable`
      );
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
      // Print ngrok URL if a tunnel is active (dev:tunnel)
      void printNgrokWebhook();
    });
  } catch (error: any) {
    if (error.message?.includes('AI configuration')) {
      console.error('❌ AI Configuration Error:', error.message);
      console.error('\nPlease configure an AI provider:');
      console.error('\n🔹 OpenAI:');
      console.error('  AI_PROVIDER=openai');
      console.error('  AI_MODEL=gpt-4');
      console.error('  AI_API_KEY=sk-your-openai-api-key');
      console.error('\n🔹 Anthropic:');
      console.error('  AI_PROVIDER=anthropic');
      console.error('  AI_MODEL=claude-3-sonnet-20240229');
      console.error('  AI_API_KEY=sk-ant-your-anthropic-api-key');
      console.error('\n🔹 Google:');
      console.error('  AI_PROVIDER=google');
      console.error('  AI_MODEL=gemini-pro');
      console.error('  AI_API_KEY=your-google-ai-api-key');
      console.error('\nOr run: superagent configure');
    } else if (error.message?.includes('API_TOKEN')) {
      console.error(
        '❌ SuperDapp API Token missing. Please set API_TOKEN environment variable.'
      );
    } else {
      console.error('❌ Agent initialization failed:', error.message);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default main;
