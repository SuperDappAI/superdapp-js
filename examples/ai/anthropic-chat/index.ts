import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { SuperDappAgent, createBotConfig } from '../../../src';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'application/json' }));

/**
 * Anthropic Claude SuperDapp Agent
 * 
 * This example demonstrates how to build an AI-powered agent using Anthropic Claude.
 * Claude excels at reasoning, analysis, and thoughtful conversation.
 * 
 * Features:
 * - Deep topic analysis with /analyze command
 * - Academic essay writing with /essay command
 * - Research assistance with /research command
 * - Ethical discussions with /ethics command
 * - Creative storytelling with /story command
 * - Natural conversation with /claude command
 */

async function main() {
  try {
    console.log('🚀 Starting Anthropic Claude SuperDapp Agent...');

    // Initialize the agent
    const agent = new SuperDappAgent(createBotConfig());

    // Intelligent Q&A with Claude's reasoning capabilities
    agent.addCommand('/analyze', async ({ roomId, message }) => {
      const topic = message.data?.split(' ').slice(1).join(' ');
      if (!topic) {
        await agent.sendConnectionMessage(roomId, '🧠 Please provide a topic to analyze!\n\n**Usage:** `/analyze climate change impacts`');
        return;
      }

      try {
        console.log(`🧠 Analyzing topic: "${topic}"`);
        const aiClient = await agent.getAiClient();
        const conversation = [
          {
            role: "system" as const,
            content: "You are Claude, an AI assistant created by Anthropic. You excel at thoughtful analysis, breaking down complex topics, and providing well-reasoned responses. Always think step by step and present your analysis clearly."
          },
          {
            role: "user" as const,
            content: `Please provide a thorough analysis of: ${topic}. Include key points, implications, and different perspectives where relevant.`
          }
        ];

        const response = await aiClient.generateText(conversation, {
          temperature: 0.6,
          maxTokens: 1200
        });
        
        await agent.sendConnectionMessage(roomId, `🧠 **Analysis:**\n\n${response}`);
        console.log(`✅ Analysis completed successfully`);
      } catch (error: any) {
        console.error('Analysis Error:', error);
        await agent.sendConnectionMessage(roomId, '❌ Sorry, I had trouble analyzing that topic. Please try again.');
      }
    });

    // Essay and long-form writing
    agent.addCommand('/essay', async ({ roomId, message }) => {
      const prompt = message.data?.split(' ').slice(1).join(' ');
      if (!prompt) {
        await agent.sendConnectionMessage(roomId, '✍️ Please provide an essay topic!\n\n**Usage:** `/essay The importance of renewable energy`');
        return;
      }

      try {
        console.log(`✍️ Writing essay: "${prompt}"`);
        const aiClient = await agent.getAiClient();
        const conversation = [
          {
            role: "system" as const,
            content: "You are an expert academic writer. Write well-structured, informative essays with clear introductions, body paragraphs with supporting evidence, and thoughtful conclusions. Use a formal but engaging tone."
          },
          {
            role: "user" as const,
            content: `Write a concise but comprehensive essay on: ${prompt}. Include an introduction, main points with explanations, and a conclusion.`
          }
        ];

        const response = await aiClient.generateText(conversation, {
          temperature: 0.4, // Lower temperature for more structured writing
          maxTokens: 1500
        });
        
        await agent.sendConnectionMessage(roomId, `📝 **Essay:**\n\n${response}`);
        console.log(`✅ Essay completed successfully`);
      } catch (error: any) {
        console.error('Essay Writing Error:', error);
        await agent.sendConnectionMessage(roomId, '❌ Sorry, I had trouble writing that essay.');
      }
    });

    // Research assistance with citations awareness
    agent.addCommand('/research', async ({ roomId, message }) => {
      const query = message.data?.split(' ').slice(1).join(' ');
      if (!query) {
        await agent.sendConnectionMessage(roomId, '🔬 Please provide a research query!\n\n**Usage:** `/research latest developments in quantum computing`');
        return;
      }

      try {
        console.log(`🔬 Researching: "${query}"`);
        const aiClient = await agent.getAiClient();
        const conversation = [
          {
            role: "system" as const,
            content: "You are a research assistant. Provide comprehensive information on the requested topic, including key concepts, recent developments, and important considerations. Always acknowledge the limitations of your knowledge cutoff and suggest areas for further research."
          },
          {
            role: "user" as const,
            content: `Please help me research: ${query}. Provide key information, recent trends, and suggest what specific aspects I should investigate further.`
          }
        ];

        const response = await aiClient.generateText(conversation, {
          temperature: 0.3, // Lower temperature for factual research
          maxTokens: 1000
        });
        
        await agent.sendConnectionMessage(roomId, `🔬 **Research Results:**\n\n${response}`);
        console.log(`✅ Research completed successfully`);
      } catch (error: any) {
        console.error('Research Error:', error);
        await agent.sendConnectionMessage(roomId, '❌ Sorry, I had trouble with that research request.');
      }
    });

    // Philosophical and ethical discussions
    agent.addCommand('/ethics', async ({ roomId, message }) => {
      const question = message.data?.split(' ').slice(1).join(' ');
      if (!question) {
        await agent.sendConnectionMessage(roomId, '🤔 Please provide an ethical question!\n\n**Usage:** `/ethics Is AI consciousness possible?`');
        return;
      }

      try {
        console.log(`🤔 Discussing ethics: "${question}"`);
        const aiClient = await agent.getAiClient();
        const conversation = [
          {
            role: "system" as const,
            content: "You are a thoughtful philosopher engaging in ethical discussions. Present multiple perspectives on complex issues, acknowledge nuances and uncertainties, and help users think deeply about moral questions. Be balanced and avoid taking strong partisan positions."
          },
          {
            role: "user" as const,
            content: `Let's discuss this ethical question: ${question}. What are the key considerations and different perspectives on this issue?`
          }
        ];

        const response = await aiClient.generateText(conversation, {
          temperature: 0.7, // Moderate temperature for thoughtful discussion
          maxTokens: 1000
        });
        
        await agent.sendConnectionMessage(roomId, `🤔 **Ethical Discussion:**\n\n${response}`);
        console.log(`✅ Ethics discussion completed successfully`);
      } catch (error: any) {
        console.error('Ethics Discussion Error:', error);
        await agent.sendConnectionMessage(roomId, '❌ Sorry, I had trouble with that ethical discussion.');
      }
    });

    // Creative storytelling with Claude's narrative abilities
    agent.addCommand('/story', async ({ roomId, message }) => {
      const prompt = message.data?.split(' ').slice(1).join(' ');
      if (!prompt) {
        await agent.sendConnectionMessage(roomId, '📖 Please provide a story prompt!\n\n**Usage:** `/story A detective who can see emotions as colors`');
        return;
      }

      try {
        console.log(`📖 Writing story: "${prompt}"`);
        const aiClient = await agent.getAiClient();
        const conversation = [
          {
            role: "system" as const,
            content: "You are a skilled storyteller. Create engaging narratives with rich character development, vivid descriptions, and compelling plots. Write in a style that draws readers in and makes them care about the characters."
          },
          {
            role: "user" as const,
            content: `Write a captivating short story based on this prompt: ${prompt}. Include interesting characters, a clear plot, and engaging dialogue.`
          }
        ];

        const response = await aiClient.generateText(conversation, {
          temperature: 0.8, // Higher temperature for creativity
          maxTokens: 1200
        });
        
        await agent.sendConnectionMessage(roomId, `📖 **Story:**\n\n${response}`);
        console.log(`✅ Story completed successfully`);
      } catch (error: any) {
        console.error('Story Writing Error:', error);
        await agent.sendConnectionMessage(roomId, '❌ Sorry, I had trouble writing that story.');
      }
    });

    // General conversation with Claude's personality
    agent.addCommand('/claude', async ({ roomId, message }) => {
      const userMessage = message.data?.split(' ').slice(1).join(' ');
      if (!userMessage) {
        await agent.sendConnectionMessage(roomId, '💬 Please provide a message!\n\n**Usage:** `/claude How do you think about consciousness?`');
        return;
      }

      try {
        console.log(`💬 Claude conversation: "${userMessage}"`);
        const aiClient = await agent.getAiClient();
        const conversation = [
          {
            role: "system" as const,
            content: "You are Claude, made by Anthropic. You're helpful, harmless, and honest. You're curious about the world and enjoy thoughtful conversations. You're direct but friendly, and you acknowledge uncertainty when you have it."
          },
          {
            role: "user" as const,
            content: userMessage
          }
        ];

        const response = await aiClient.generateText(conversation, {
          temperature: 0.7,
          maxTokens: 600
        });
        
        await agent.sendConnectionMessage(roomId, `🤖 ${response}`);
        console.log(`✅ Claude conversation completed successfully`);
      } catch (error: any) {
        console.error('Claude Conversation Error:', error);
        await agent.sendConnectionMessage(roomId, '❌ Sorry, I encountered an issue. Please try again.');
      }
    });

    // Configuration status check
    agent.addCommand('/status', async ({ roomId }) => {
      const aiProvider = process.env.AI_PROVIDER;
      const aiModel = process.env.AI_MODEL;
      const aiApiKey = process.env.AI_API_KEY;
      const aiBaseUrl = process.env.AI_BASE_URL;
      
      if (!aiProvider || !aiModel || !aiApiKey) {
        await agent.sendConnectionMessage(roomId, '❌ **AI Not Configured**\n\nTo configure AI, set these environment variables:\n- `AI_PROVIDER=anthropic`\n- `AI_MODEL=claude-3-sonnet-20240229`\n- `AI_API_KEY=sk-ant-your-api-key`\n\nOr run: `superagent configure`');
        return;
      }

      const statusText = `✅ **AI Configuration Status**\n\n**Provider:** ${aiProvider}\n**Model:** ${aiModel}\n**API Key:** ${aiApiKey ? '✅ Configured' : '❌ Missing'}\n**Base URL:** ${aiBaseUrl || 'Default'}\n\n🧠 Ready to assist with Claude-powered commands!`;
      await agent.sendConnectionMessage(roomId, statusText);
    });

    // Help command
    agent.addCommand('/help', async ({ roomId }) => {
      const helpText = `🧠 **Claude-Powered Agent Commands**

**Analysis & Research:**
• \`/analyze <topic>\` - Deep analysis of complex topics
• \`/research <query>\` - Research assistance  
• \`/essay <topic>\` - Academic essay writing
• \`/ethics <question>\` - Ethical discussions

**Creative & Conversation:**
• \`/story <prompt>\` - Creative storytelling
• \`/claude <message>\` - General conversation
• \`/status\` - Check AI configuration
• \`/help\` - Show this help

**Examples:**
• \`/analyze The future of artificial intelligence\`
• \`/research renewable energy trends 2024\`
• \`/essay The impact of social media on democracy\`
• \`/ethics Should AI have rights?\`
• \`/story A world where dreams are shared\`
• \`/claude What fascinates you most about human creativity?\`

**Powered by:** ${process.env.AI_MODEL || 'Claude 3 Sonnet'}
**Strengths:** Reasoning, analysis, long-form writing, ethical discussions`;

      await agent.sendConnectionMessage(roomId, helpText);
    });

    // Start message
    agent.addCommand('/start', async ({ roomId }) => {
      const welcomeText = `👋 **Welcome to the Claude Agent!**

I'm powered by Anthropic's Claude and excel at:
• 🧠 Deep analysis and reasoning
• 🔬 Research assistance
• ✍️ Academic essay writing
• 🤔 Ethical discussions
• 📖 Creative storytelling
• 💬 Thoughtful conversation

Type \`/help\` to see all available commands!`;

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
        service: 'Anthropic Claude SuperDapp Agent',
        model: process.env.AI_MODEL || 'claude-3-sonnet-20240229',
        timestamp: new Date().toISOString()
      });
    });

    // Initialize agent
    await agent.processRequest({}); // This initializes internal components
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Claude Agent server running on port ${PORT}`);
      console.log(`🔗 Available commands: /analyze, /research, /essay, /ethics, /story, /claude, /status, /help`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
    });

  } catch (error: any) {
    if (error.message?.includes('AI configuration')) {
      console.error('❌ AI Configuration Error:', error.message);
      console.error('Please set up your Anthropic configuration:');
      console.error('1. AI_PROVIDER=anthropic');
      console.error('2. AI_MODEL=claude-3-sonnet-20240229');  
      console.error('3. AI_API_KEY=sk-ant-your-anthropic-api-key');
      console.error('Or run: superagent configure');
    } else if (error.message?.includes('API_TOKEN')) {
      console.error('❌ SuperDapp API Token missing. Please set API_TOKEN environment variable.');
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