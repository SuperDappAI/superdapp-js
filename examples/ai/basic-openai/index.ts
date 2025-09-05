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
 * Basic OpenAI SuperDapp Agent
 * 
 * This example demonstrates how to build an AI-powered agent using OpenAI.
 * It combines basic configuration examples with practical AI commands.
 * 
 * Features:
 * - Basic Q&A with /ask command
 * - Conversational chat with /chat command  
 * - Code assistance with /code command
 * - Creative writing with /write command
 * - Proper error handling and user guidance
 */

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
}async function main() {
  try {
    console.log('🚀 Starting Basic OpenAI SuperDapp Agent...');

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

    // Basic AI text generation
    agent.addCommand('/ask', async ({ roomId, message }) => {
      const question = message.data?.split(' ').slice(1).join(' ');
      if (!question) {
        await agent.sendConnectionMessage(
          roomId,
          '❓ Please provide a question!\n\n**Usage:** `/ask What is TypeScript?`'
        );
        return;
      }

      try {
        console.log(`🤖 Processing question: "${question}"`);
        const aiClient = await agent.getAiClient();
        const response = await aiClient.generateText(question, {
          temperature: 0.7,
          maxTokens: 500,
        });

        await agent.sendConnectionMessage(
          roomId,
          `💡 **Answer:**\n\n${response}`
        );
        console.log(`✅ Response sent successfully`);
      } catch (error: any) {
        console.error('AI Error:', error);
        if (error.message?.includes('AI configuration')) {
          await agent.sendConnectionMessage(
            roomId,
            '⚠️ **AI Configuration Error**\n\nAI is not properly configured. Please check your environment variables:\n- `AI_PROVIDER=openai`\n- `AI_MODEL=gpt-4`\n- `AI_API_KEY=sk-your-openai-api-key`\n\nOr run: `superagent configure`'
          );
        } else {
          await agent.sendConnectionMessage(
            roomId,
            '❌ Sorry, I had trouble processing that question. Please try again.'
          );
        }
      }
    });

    // Conversation with system prompt
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
        console.log(`💬 Processing chat: "${userMessage}"`);
        const aiClient = await agent.getAiClient();
        const conversation = [
          {
            role: 'system' as const,
            content:
              'You are a helpful and friendly AI assistant. Keep your responses concise, engaging, and conversational. Use emojis sparingly but appropriately.',
          },
          {
            role: 'user' as const,
            content: userMessage,
          },
        ];

        const response = await aiClient.generateText(conversation, {
          temperature: 0.8,
          maxTokens: 300,
        });

        await agent.sendConnectionMessage(roomId, `🤖 ${response}`);
        console.log(`✅ Chat response sent successfully`);
      } catch (error: any) {
        console.error('Chat Error:', error);
        await agent.sendConnectionMessage(
          roomId,
          '❌ Sorry, I encountered an issue. Please try again.'
        );
      }
    });

    // Code assistance
    agent.addCommand('/code', async ({ roomId, message }) => {
      const question = message.data?.split(' ').slice(1).join(' ');
      if (!question) {
        await agent.sendConnectionMessage(
          roomId,
          '👨‍💻 Please ask a coding question!\n\n**Usage:** `/code How do I create a React component?`'
        );
        return;
      }

      try {
        console.log(`👨‍💻 Processing coding question: "${question}"`);
        const aiClient = await agent.getAiClient();
        const conversation = [
          {
            role: 'system' as const,
            content:
              'You are an expert software developer. Provide clear, practical answers with code examples when appropriate. Focus on best practices and modern approaches. Format code blocks properly with markdown.',
          },
          {
            role: 'user' as const,
            content: question,
          },
        ];

        const response = await aiClient.generateText(conversation, {
          temperature: 0.3, // Lower temperature for more focused coding responses
          maxTokens: 1000,
        });

        await agent.sendConnectionMessage(
          roomId,
          `💻 **Code Assistance:**\n\n${response}`
        );
        console.log(`✅ Code response sent successfully`);
      } catch (error: any) {
        console.error('Code Assistant Error:', error);
        await agent.sendConnectionMessage(
          roomId,
          '❌ Sorry, I had trouble with that coding question.'
        );
      }
    });

    // Creative writing
    agent.addCommand('/write', async ({ roomId, message }) => {
      const prompt = message.data?.split(' ').slice(1).join(' ');
      if (!prompt) {
        await agent.sendConnectionMessage(
          roomId,
          '✍️ Please provide a writing prompt!\n\n**Usage:** `/write A story about a time-traveling cat`'
        );
        return;
      }

      try {
        console.log(`✍️ Processing creative writing: "${prompt}"`);
        const aiClient = await agent.getAiClient();
        const conversation = [
          {
            role: 'system' as const,
            content:
              'You are a creative writing assistant. Write engaging, imaginative content based on user prompts. Keep it appropriate and entertaining. Use descriptive language and create compelling narratives.',
          },
          {
            role: 'user' as const,
            content: `Write a short creative piece based on this prompt: ${prompt}`,
          },
        ];

        const response = await aiClient.generateText(conversation, {
          temperature: 0.9, // Higher temperature for more creative responses
          maxTokens: 800,
        });

        await agent.sendConnectionMessage(
          roomId,
          `📝 **Creative Writing:**\n\n${response}`
        );
        console.log(`✅ Creative writing sent successfully`);
      } catch (error: any) {
        console.error('Creative Writing Error:', error);
        await agent.sendConnectionMessage(
          roomId,
          '❌ Sorry, I had trouble with that creative writing request.'
        );
      }
    });

    // Configuration status check
    agent.addCommand('/status', async ({ roomId }) => {
      // For now, we'll check if AI environment variables are set
      // since we don't have direct access to agent.getConfig()
      const aiProvider = process.env.AI_PROVIDER;
      const aiModel = process.env.AI_MODEL;
      const aiApiKey = process.env.AI_API_KEY;
      const aiBaseUrl = process.env.AI_BASE_URL;

      if (!aiProvider || !aiModel || !aiApiKey) {
        await agent.sendConnectionMessage(
          roomId,
          '❌ **AI Not Configured**\n\nTo configure AI, set these environment variables:\n- `AI_PROVIDER=openai`\n- `AI_MODEL=gpt-4`\n- `AI_API_KEY=sk-your-api-key`\n\nOr run: `superagent configure`'
        );
        return;
      }

      const statusText = `✅ **AI Configuration Status**\n\n**Provider:** ${aiProvider}\n**Model:** ${aiModel}\n**API Key:** ${aiApiKey ? '✅ Configured' : '❌ Missing'}\n**Base URL:** ${aiBaseUrl || 'Default'}\n\n🤖 Ready to assist with AI-powered commands!`;
      await agent.sendConnectionMessage(roomId, statusText);
    });

    // Help command
    agent.addCommand('/help', async ({ roomId }) => {
      const helpText = `🤖 **Basic OpenAI Agent Commands**

**AI Commands:**
• \`/ask <question>\` - Ask any question
• \`/chat <message>\` - Have a conversation  
• \`/code <question>\` - Get coding help
• \`/write <prompt>\` - Creative writing
• \`/status\` - Check AI configuration
• \`/help\` - Show this help

**Examples:**
• \`/ask What is machine learning?\`
• \`/chat How's your day going?\`
• \`/code How do I use async/await in JavaScript?\`
• \`/write A poem about the ocean\`

**Powered by:** ${process.env.AI_MODEL || 'OpenAI GPT-4'}`;

      await agent.sendConnectionMessage(roomId, helpText);
    });

    // Start message
    agent.addCommand('/start', async ({ roomId }) => {
      const welcomeText = `👋 **Welcome to the Basic OpenAI Agent!**

I'm powered by OpenAI and ready to help you with:
• 💡 Answering questions
• 💬 Having conversations
• 👨‍💻 Coding assistance  
• ✍️ Creative writing

Type \`/help\` to see all available commands!`;

      await agent.sendConnectionMessage(roomId, welcomeText);
    });

    // Setup webhook endpoint
    app.post('/webhook', async (req, res) => {
      try {
        await agent.processRequest(req.body);
        res.status(200).json({ status: 'success' });
      } catch (error) {
        console.error('Webhook processing error:', error);
        res
          .status(500)
          .json({ status: 'error', message: (error as Error).message });
      }
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'Basic OpenAI SuperDapp Agent',
        model: process.env.AI_MODEL || 'gpt-4',
        timestamp: new Date().toISOString(),
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Basic OpenAI Agent server running on port ${PORT}`);
      console.log(
        `🔗 Available commands: /ask, /chat, /code, /write, /status, /help`
      );
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
      // Print ngrok URL if a tunnel is active (dev:tunnel)
      void printNgrokWebhook();
    });
  } catch (error: any) {
    if (error.message?.includes('AI configuration')) {
      console.error('❌ AI Configuration Error:', error.message);
      console.error('Please set up your OpenAI configuration:');
      console.error('1. AI_PROVIDER=openai');
      console.error('2. AI_MODEL=gpt-4');
      console.error('3. AI_API_KEY=sk-your-openai-api-key');
      console.error('Or run: superagent configure');
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
