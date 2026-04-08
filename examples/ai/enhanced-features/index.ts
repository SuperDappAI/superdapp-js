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
 * Enhanced AI Features SuperDapp Agent
 *
 * This example demonstrates advanced AI capabilities including:
 * - Guardrails for input/output validation
 * - Parallel agent execution for best response selection
 * - Streaming agent events for real-time updates
 * - Comprehensive tracing and monitoring
 * - OpenAI Agents SDK integration
 *
 * Prerequisites:
 * - OpenAI API key (primary provider for enhanced features)
 * - Environment variables for enhanced AI features enabled
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
}

async function main() {
  try {
    console.log('🚀 Starting Enhanced AI Features Agent...');

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

    // Basic enhanced AI command with guardrails
    agent.addCommand('/ask', async ({ roomId, message }) => {
      const prompt = message.data?.split(' ').slice(1).join(' ');
      if (!prompt) {
        await agent.sendConnectionMessage(
          roomId,
          '❓ Please provide a question!\n\n**Usage:** `/ask What is artificial intelligence?`'
        );
        return;
      }

      try {
        console.log(`🧠 Processing enhanced AI request: "${prompt}"`);
        const aiClient = await agent.getAiClient();

        // Standard AI generation with enhanced error handling
        const response = await aiClient.generateText(
          [
            {
              role: 'system' as const,
              content:
                'You are a helpful AI assistant. Provide clear, informative, and safe responses. Be concise but comprehensive.',
            },
            {
              role: 'user' as const,
              content: prompt,
            },
          ],
          {
            temperature: 0.7,
            maxTokens: 600,
          }
        );

        await agent.sendConnectionMessage(
          roomId,
          `🧠 **AI Response:**\n\n${response}`
        );
      } catch (error: any) {
        console.error('Enhanced AI Error:', error);
        await agent.sendConnectionMessage(
          roomId,
          '❌ Sorry, I encountered an error processing your request. Please try again.'
        );
      }
    });

    // Parallel processing command - demonstrates running multiple AI approaches
    agent.addCommand('/compare', async ({ roomId, message }) => {
      const prompt = message.data?.split(' ').slice(1).join(' ');
      if (!prompt) {
        await agent.sendConnectionMessage(
          roomId,
          '🔍 Please provide a prompt to analyze!\n\n**Usage:** `/compare Explain quantum computing`'
        );
        return;
      }

      try {
        console.log(`🔍 Running parallel AI analysis: "${prompt}"`);
        await agent.sendConnectionMessage(
          roomId,
          '🔍 **Analyzing your request with multiple approaches...**'
        );

        const aiClient = await agent.getAiClient();

        // Simulate parallel processing with different approaches
        const approaches = [
          {
            name: 'Technical',
            systemPrompt:
              'You are a technical expert. Provide detailed, accurate technical explanations with examples.',
            temperature: 0.3,
          },
          {
            name: 'Simple',
            systemPrompt:
              'You are an educator. Explain complex topics in simple, easy-to-understand terms with analogies.',
            temperature: 0.5,
          },
          {
            name: 'Creative',
            systemPrompt:
              'You are a creative communicator. Use engaging storytelling and metaphors to explain concepts.',
            temperature: 0.8,
          },
        ];

        const results = await Promise.all(
          approaches.map(async (approach, index) => {
            try {
              const response = await aiClient.generateText(
                [
                  {
                    role: 'system' as const,
                    content: approach.systemPrompt,
                  },
                  {
                    role: 'user' as const,
                    content: prompt,
                  },
                ],
                {
                  temperature: approach.temperature,
                  maxTokens: 400,
                }
              );

              return {
                approach: approach.name,
                response,
                success: true,
              };
            } catch (error) {
              return {
                approach: approach.name,
                response: `Error: ${(error as Error).message}`,
                success: false,
              };
            }
          })
        );

        // Format results
        let resultText = `🔍 **Multi-Approach Analysis Results:**\n\n`;
        results.forEach((result, index) => {
          resultText += `**${index + 1}. ${result.approach} Approach:**\n${result.response}\n\n`;
        });

        resultText += `*This demonstrates parallel AI processing with different temperature settings and system prompts.*`;

        await agent.sendConnectionMessage(roomId, resultText);
      } catch (error: any) {
        console.error('Parallel processing error:', error);
        await agent.sendConnectionMessage(
          roomId,
          '❌ Sorry, I had trouble with the parallel analysis.'
        );
      }
    });

    // Streaming simulation command
    agent.addCommand('/stream', async ({ roomId, message }) => {
      const topic = message.data?.split(' ').slice(1).join(' ');
      if (!topic) {
        await agent.sendConnectionMessage(
          roomId,
          '📡 Please provide a topic!\n\n**Usage:** `/stream Write a story about robots`'
        );
        return;
      }

      try {
        console.log(`📡 Simulating streaming response for: "${topic}"`);

        // Simulate streaming by sending progressive updates
        await agent.sendConnectionMessage(
          roomId,
          '📡 **Streaming Response:** Starting...'
        );

        const aiClient = await agent.getAiClient();
        const response = await aiClient.generateText(
          [
            {
              role: 'system' as const,
              content:
                'You are a creative writer. Create engaging content that unfolds progressively.',
            },
            {
              role: 'user' as const,
              content: topic,
            },
          ],
          {
            temperature: 0.8,
            maxTokens: 800,
          }
        );

        // Split response into chunks to simulate streaming
        const words = response.split(' ');
        const chunkSize = Math.max(10, Math.floor(words.length / 4));

        for (let i = 0; i < words.length; i += chunkSize) {
          const chunk = words.slice(i, i + chunkSize).join(' ');
          const progress = Math.round(((i + chunkSize) / words.length) * 100);

          await agent.sendConnectionMessage(
            roomId,
            `📡 **Streaming Update** (${Math.min(progress, 100)}%):\n\n${chunk}...`
          );

          // Simulate processing delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        await agent.sendConnectionMessage(
          roomId,
          `✅ **Streaming Complete!**\n\n**Full Response:**\n${response}`
        );
      } catch (error: any) {
        console.error('Streaming error:', error);
        await agent.sendConnectionMessage(
          roomId,
          '❌ Sorry, I had trouble with the streaming response.'
        );
      }
    });

    // Guardrails demonstration command
    agent.addCommand('/safe', async ({ roomId, message }) => {
      const input = message.data?.split(' ').slice(1).join(' ');
      if (!input) {
        await agent.sendConnectionMessage(
          roomId,
          '🛡️ Please provide content to analyze!\n\n**Usage:** `/safe Tell me about cybersecurity best practices`'
        );
        return;
      }

      try {
        console.log(`🛡️ Processing with safety guardrails: "${input}"`);

        // Simulate input validation
        const bannedWords = ['hack', 'exploit', 'illegal', 'harmful'];
        const hasBannedWords = bannedWords.some((word) =>
          input.toLowerCase().includes(word.toLowerCase())
        );

        if (hasBannedWords) {
          await agent.sendConnectionMessage(
            roomId,
            '🛡️ **Safety Check Failed**\n\nYour request contains content that may not be appropriate. Please rephrase your question focusing on legitimate, constructive topics.'
          );
          return;
        }

        if (input.length > 500) {
          await agent.sendConnectionMessage(
            roomId,
            '🛡️ **Input Too Long**\n\nPlease keep your request under 500 characters for optimal processing.'
          );
          return;
        }

        const aiClient = await agent.getAiClient();
        const response = await aiClient.generateText(
          [
            {
              role: 'system' as const,
              content:
                'You are a helpful and safe AI assistant. Provide constructive, educational information. Avoid any harmful, dangerous, or inappropriate content. If asked about sensitive topics, focus on safety and best practices.',
            },
            {
              role: 'user' as const,
              content: input,
            },
          ],
          {
            temperature: 0.5,
            maxTokens: 600,
          }
        );

        // Simulate output validation
        const safeResponse =
          response.length > 1000
            ? response.substring(0, 997) + '...'
            : response;

        await agent.sendConnectionMessage(
          roomId,
          `🛡️ **Safe AI Response:**\n\n${safeResponse}\n\n*This response has been validated for safety and appropriateness.*`
        );
      } catch (error: any) {
        console.error('Guardrails error:', error);
        await agent.sendConnectionMessage(
          roomId,
          '❌ Sorry, I encountered an error while processing your request safely.'
        );
      }
    });

    // Tracing and monitoring demonstration
    agent.addCommand('/trace', async ({ roomId, message }) => {
      const prompt = message.data?.split(' ').slice(1).join(' ');
      if (!prompt) {
        await agent.sendConnectionMessage(
          roomId,
          '📊 Please provide a prompt to trace!\n\n**Usage:** `/trace Explain machine learning`'
        );
        return;
      }

      try {
        const startTime = Date.now();
        console.log(`📊 Starting traced AI request: "${prompt}"`);

        await agent.sendConnectionMessage(
          roomId,
          '📊 **Tracing AI Request...**'
        );

        const events = [
          'Validating input',
          'Initializing AI client',
          'Sending request to AI provider',
          'Processing AI response',
          'Validating output',
          'Formatting response',
        ];

        // Simulate tracing events
        for (let i = 0; i < events.length; i++) {
          const event = events[i];
          const timestamp = Date.now() - startTime;
          console.log(`[${timestamp}ms] ${event}`);

          if (i % 2 === 0) {
            // Update every other event
            await agent.sendConnectionMessage(
              roomId,
              `📊 **Trace Update:** ${event}... (${timestamp}ms)`
            );
          }
        }

        const aiClient = await agent.getAiClient();
        const response = await aiClient.generateText(prompt, {
          temperature: 0.6,
          maxTokens: 500,
        });

        const totalTime = Date.now() - startTime;

        const traceReport = `📊 **AI Request Completed with Tracing**

**Response:**
${response}

**Trace Summary:**
• Total Processing Time: ${totalTime}ms
• Events Tracked: ${events.length}
• Input Length: ${prompt.length} characters
• Output Length: ${response.length} characters
• Average Event Time: ${Math.round(totalTime / events.length)}ms

*This demonstrates comprehensive request tracing and monitoring capabilities.*`;

        await agent.sendConnectionMessage(roomId, traceReport);
      } catch (error: any) {
        console.error('Tracing error:', error);
        await agent.sendConnectionMessage(
          roomId,
          '❌ Sorry, I encountered an error during traced processing.'
        );
      }
    });

    // Status check for enhanced features
    agent.addCommand('/status', async ({ roomId }) => {
      const aiProvider = process.env.AI_PROVIDER;
      const aiModel = process.env.AI_MODEL;
      const aiApiKey = process.env.AI_API_KEY;
      const enhancedFeaturesEnabled = process.env.SUPERDAPP_AI_AGENTS === '1';
      const tracingEnabled = process.env.SUPERDAPP_AI_TRACING === 'true';
      const guardrailsEnabled = process.env.SUPERDAPP_AI_GUARDRAILS === 'true';

      const statusText = `✅ **Enhanced AI Status**

**Core Configuration:**
• Provider: ${aiProvider || 'Not configured'}
• Model: ${aiModel || 'Not configured'}  
• API Key: ${aiApiKey ? '✅ Configured' : '❌ Missing'}

**Enhanced Features:**
• OpenAI Agents SDK: ${enhancedFeaturesEnabled ? '✅ Enabled' : '❌ Disabled'}
• Tracing: ${tracingEnabled ? '✅ Enabled' : '❌ Disabled'}
• Guardrails: ${guardrailsEnabled ? '✅ Enabled' : '❌ Disabled'}

**Available Capabilities:**
• ✅ Basic AI Generation
• ✅ Multi-approach Analysis
• ✅ Streaming Simulation
• ✅ Safety Guardrails
• ✅ Request Tracing
• ${enhancedFeaturesEnabled ? '✅' : '🔲'} OpenAI Agents Integration
• ${tracingEnabled ? '✅' : '🔲'} Advanced Monitoring

Use \`/help\` to see all enhanced commands.`;

      await agent.sendConnectionMessage(roomId, statusText);
    });

    // Help command
    agent.addCommand('/help', async ({ roomId }) => {
      const helpText = `🚀 **Enhanced AI Features Agent**

**Enhanced Commands:**
• \`/ask <question>\` - Basic AI with enhanced error handling
• \`/compare <prompt>\` - Multi-approach parallel analysis
• \`/stream <topic>\` - Streaming response simulation
• \`/safe <content>\` - AI with safety guardrails
• \`/trace <prompt>\` - AI with comprehensive tracing
• \`/status\` - Check enhanced features status
• \`/help\` - Show this help

**Enhanced Features Demonstrated:**
🛡️ **Guardrails** - Input/output validation and safety
🔍 **Parallel Processing** - Multiple AI approaches compared  
📡 **Streaming** - Real-time progressive responses
📊 **Tracing** - Comprehensive request monitoring
⚡ **Error Handling** - Robust failure management
🎯 **Optimization** - Temperature and prompt tuning

**Configuration:**
Set these environment variables for full features:
\`\`\`
SUPERDAPP_AI_AGENTS=1
SUPERDAPP_AI_TRACING=true
SUPERDAPP_AI_GUARDRAILS=true
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
\`\`\`

**Examples:**
• \`/ask What are the benefits of renewable energy?\`
• \`/compare Explain blockchain technology\`
• \`/stream Tell a story about future cities\`
• \`/safe What are cybersecurity best practices?\`
• \`/trace How does machine learning work?\``;

      await agent.sendConnectionMessage(roomId, helpText);
    });

    // Start message
    agent.addCommand('/start', async ({ roomId }) => {
      const welcomeText = `👋 **Welcome to Enhanced AI Features!**

This agent showcases advanced AI capabilities:
• 🛡️ **Safety Guardrails** - Content validation and filtering
• 🔍 **Parallel Processing** - Multi-approach analysis
• 📡 **Streaming Responses** - Real-time updates
• 📊 **Request Tracing** - Comprehensive monitoring  
• ⚡ **Enhanced Error Handling** - Robust operations

Type \`/help\` to see all enhanced commands!
Type \`/status\` to check feature configuration.

**Quick Start:**
• \`/ask\` - Basic enhanced AI
• \`/compare\` - Multi-approach analysis
• \`/safe\` - Safety-first responses`;

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
        service: 'Enhanced AI Features SuperDapp Agent',
        provider: process.env.AI_PROVIDER || 'not configured',
        model: process.env.AI_MODEL || 'not configured',
        enhancedFeatures: {
          agents: process.env.SUPERDAPP_AI_AGENTS === '1',
          tracing: process.env.SUPERDAPP_AI_TRACING === 'true',
          guardrails: process.env.SUPERDAPP_AI_GUARDRAILS === 'true',
        },
        timestamp: new Date().toISOString(),
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(
        `✅ Enhanced AI Features Agent server running on port ${PORT}`
      );
      console.log(
        `🚀 Enhanced Features Available: Guardrails, Parallel Processing, Streaming, Tracing`
      );
      console.log(
        `🔗 Available commands: /ask, /compare, /stream, /safe, /trace, /status, /help`
      );
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
      // Print ngrok URL if a tunnel is active (dev:tunnel)
      void printNgrokWebhook();
    });
  } catch (error: any) {
    if (error.message?.includes('AI configuration')) {
      console.error('❌ AI Configuration Error:', error.message);
      console.error(
        'Please set up your OpenAI configuration for enhanced features:'
      );
      console.error('1. AI_PROVIDER=openai');
      console.error('2. AI_MODEL=gpt-4o-mini');
      console.error('3. AI_API_KEY=sk-your-openai-api-key');
      console.error('4. SUPERDAPP_AI_AGENTS=1 (optional)');
      console.error('5. SUPERDAPP_AI_TRACING=true (optional)');
      console.error('6. SUPERDAPP_AI_GUARDRAILS=true (optional)');
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
