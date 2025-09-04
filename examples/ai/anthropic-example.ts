import { SuperDappAgent, createBotConfig } from '../../src';

/**
 * Anthropic Claude Integration Example
 * 
 * This example demonstrates how to build an AI-powered agent using Anthropic Claude.
 * 
 * Prerequisites:
 * 1. Install AI dependencies: npm install ai @ai-sdk/anthropic
 * 2. Set environment variables:
 *    - API_TOKEN=your_superdapp_api_token
 *    - AI_PROVIDER=anthropic
 *    - AI_MODEL=claude-3-sonnet-20240229
 *    - AI_API_KEY=sk-ant-your-anthropic-api-key
 * 3. Run: npx ts-node examples/ai/anthropic-example.ts
 */

async function main() {
  console.log('🚀 Starting Anthropic Claude-powered SuperDapp Agent...');

  try {
    // Create agent with AI configuration from environment
    const agent = new SuperDappAgent(createBotConfig());

    // Intelligent Q&A with Claude's reasoning capabilities
    agent.addCommand('/analyze', async (message, replyMessage, roomId) => {
      const topic = message.body.m?.body?.split(' ').slice(1).join(' ');
      if (!topic) {
        await agent.sendConnectionMessage(roomId, 'Please provide a topic to analyze! Usage: /analyze climate change impacts');
        return;
      }

      try {
        console.log(`🧠 Analyzing topic: "${topic}"`);
        const aiClient = agent.getAiClient();
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
        
        await agent.sendConnectionMessage(roomId, response);
        console.log(`✅ Analysis completed successfully`);
      } catch (error) {
        console.error('Analysis Error:', error);
        await agent.sendConnectionMessage(roomId, 'Sorry, I had trouble analyzing that topic. Please try again.');
      }
    });

    // Essay and long-form writing
    agent.addCommand('/essay', async (message, replyMessage, roomId) => {
      const prompt = message.body.m?.body?.split(' ').slice(1).join(' ');
      if (!prompt) {
        await agent.sendConnectionMessage(roomId, 'Please provide an essay topic! Usage: /essay The importance of renewable energy');
        return;
      }

      try {
        const aiClient = agent.getAiClient();
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
        
        await agent.sendConnectionMessage(roomId, response);
      } catch (error) {
        console.error('Essay Writing Error:', error);
        await agent.sendConnectionMessage(roomId, 'Sorry, I had trouble writing that essay.');
      }
    });

    // Research assistance with citations awareness
    agent.addCommand('/research', async (message, replyMessage, roomId) => {
      const query = message.body.m?.body?.split(' ').slice(1).join(' ');
      if (!query) {
        await agent.sendConnectionMessage(roomId, 'Please provide a research query! Usage: /research latest developments in quantum computing');
        return;
      }

      try {
        const aiClient = agent.getAiClient();
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
        
        await agent.sendConnectionMessage(roomId, response);
      } catch (error) {
        console.error('Research Error:', error);
        await agent.sendConnectionMessage(roomId, 'Sorry, I had trouble with that research request.');
      }
    });

    // Philosophical and ethical discussions
    agent.addCommand('/ethics', async (message, replyMessage, roomId) => {
      const question = message.body.m?.body?.split(' ').slice(1).join(' ');
      if (!question) {
        await agent.sendConnectionMessage(roomId, 'Please provide an ethical question! Usage: /ethics Is AI consciousness possible?');
        return;
      }

      try {
        const aiClient = agent.getAiClient();
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
        
        await agent.sendConnectionMessage(roomId, response);
      } catch (error) {
        console.error('Ethics Discussion Error:', error);
        await agent.sendConnectionMessage(roomId, 'Sorry, I had trouble with that ethical discussion.');
      }
    });

    // Creative storytelling with Claude's narrative abilities
    agent.addCommand('/story', async (message, replyMessage, roomId) => {
      const prompt = message.body.m?.body?.split(' ').slice(1).join(' ');
      if (!prompt) {
        await agent.sendConnectionMessage(roomId, 'Please provide a story prompt! Usage: /story A detective who can see emotions as colors');
        return;
      }

      try {
        const aiClient = agent.getAiClient();
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
        
        await agent.sendConnectionMessage(roomId, response);
      } catch (error) {
        console.error('Story Writing Error:', error);
        await agent.sendConnectionMessage(roomId, 'Sorry, I had trouble writing that story.');
      }
    });

    // General conversation with Claude's personality
    agent.addCommand('/claude', async (message, replyMessage, roomId) => {
      const userMessage = message.body.m?.body?.split(' ').slice(1).join(' ');
      if (!userMessage) {
        await agent.sendConnectionMessage(roomId, 'Please provide a message! Usage: /claude How do you think about consciousness?');
        return;
      }

      try {
        const aiClient = agent.getAiClient();
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
        
        await agent.sendConnectionMessage(roomId, response);
      } catch (error) {
        console.error('Claude Conversation Error:', error);
        await agent.sendConnectionMessage(roomId, 'Sorry, I encountered an issue. Please try again.');
      }
    });

    // Help command
    agent.addCommand('/help', async (message, replyMessage, roomId) => {
      const helpText = `🧠 **Claude-Powered Agent Commands**

**Analysis & Research:**
• \`/analyze <topic>\` - Deep analysis of complex topics
• \`/research <query>\` - Research assistance
• \`/essay <topic>\` - Academic essay writing
• \`/ethics <question>\` - Ethical discussions

**Creative Writing:**
• \`/story <prompt>\` - Creative storytelling
• \`/claude <message>\` - General conversation

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

    // Initialize agent
    await agent.initialize();
    console.log('✅ Claude-powered agent initialized successfully!');
    console.log('🔗 Available commands: /analyze, /research, /essay, /ethics, /story, /claude, /help');

  } catch (error) {
    if (error.message.includes('AI configuration')) {
      console.error('❌ AI Configuration Error:', error.message);
      console.error('Please set up your Anthropic configuration:');
      console.error('1. AI_PROVIDER=anthropic');
      console.error('2. AI_MODEL=claude-3-sonnet-20240229');
      console.error('3. AI_API_KEY=sk-ant-your-anthropic-api-key');
      console.error('Or run: superagent configure');
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