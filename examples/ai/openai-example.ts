import { SuperDappAgent, createBotConfig } from '../../src';

/**
 * OpenAI Integration Example
 * 
 * This example demonstrates how to build an AI-powered agent using OpenAI.
 * 
 * Prerequisites:
 * 1. Install AI dependencies: npm install ai @ai-sdk/openai
 * 2. Set environment variables:
 *    - API_TOKEN=your_superdapp_api_token
 *    - AI_PROVIDER=openai
 *    - AI_MODEL=gpt-4
 *    - AI_API_KEY=sk-your-openai-api-key
 * 3. Run: npx ts-node examples/ai/openai-example.ts
 */

async function main() {
  console.log('🚀 Starting OpenAI-powered SuperDapp Agent...');

  try {
    // Create agent with AI configuration from environment
    const agent = new SuperDappAgent(createBotConfig());

    // Basic AI text generation
    agent.addCommand('/ask', async (message, replyMessage, roomId) => {
      const question = message.body.m?.body?.split(' ').slice(1).join(' ');
      if (!question) {
        await agent.sendConnectionMessage(roomId, 'Please provide a question! Usage: /ask What is TypeScript?');
        return;
      }

      try {
        console.log(`🤖 Processing question: "${question}"`);
        const aiClient = agent.getAiClient();
        const response = await aiClient.generateText(question, {
          temperature: 0.7,
          maxTokens: 500
        });
        
        await agent.sendConnectionMessage(roomId, response);
        console.log(`✅ Response sent successfully`);
      } catch (error) {
        console.error('AI Error:', error);
        await agent.sendConnectionMessage(roomId, 'Sorry, I had trouble processing that question. Please try again.');
      }
    });

    // Conversation with system prompt
    agent.addCommand('/chat', async (message, replyMessage, roomId) => {
      const userMessage = message.body.m?.body?.split(' ').slice(1).join(' ');
      if (!userMessage) {
        await agent.sendConnectionMessage(roomId, 'Please provide a message! Usage: /chat Hello, how are you?');
        return;
      }

      try {
        const aiClient = agent.getAiClient();
        const conversation = [
          {
            role: "system" as const,
            content: "You are a helpful and friendly AI assistant. Keep your responses concise and engaging."
          },
          {
            role: "user" as const,
            content: userMessage
          }
        ];

        const response = await aiClient.generateText(conversation, {
          temperature: 0.8,
          maxTokens: 300
        });
        
        await agent.sendConnectionMessage(roomId, response);
      } catch (error) {
        console.error('Chat Error:', error);
        await agent.sendConnectionMessage(roomId, 'Sorry, I encountered an issue. Please try again.');
      }
    });

    // Code assistance
    agent.addCommand('/code', async (message, replyMessage, roomId) => {
      const question = message.body.m?.body?.split(' ').slice(1).join(' ');
      if (!question) {
        await agent.sendConnectionMessage(roomId, 'Please ask a coding question! Usage: /code How do I create a React component?');
        return;
      }

      try {
        const aiClient = agent.getAiClient();
        const conversation = [
          {
            role: "system" as const,
            content: "You are an expert software developer. Provide clear, practical answers with code examples when appropriate. Focus on best practices and modern approaches."
          },
          {
            role: "user" as const,
            content: question
          }
        ];

        const response = await aiClient.generateText(conversation, {
          temperature: 0.3, // Lower temperature for more focused coding responses
          maxTokens: 1000
        });
        
        await agent.sendConnectionMessage(roomId, response);
      } catch (error) {
        console.error('Code Assistant Error:', error);
        await agent.sendConnectionMessage(roomId, 'Sorry, I had trouble with that coding question.');
      }
    });

    // Creative writing
    agent.addCommand('/write', async (message, replyMessage, roomId) => {
      const prompt = message.body.m?.body?.split(' ').slice(1).join(' ');
      if (!prompt) {
        await agent.sendConnectionMessage(roomId, 'Please provide a writing prompt! Usage: /write A story about a time-traveling cat');
        return;
      }

      try {
        const aiClient = agent.getAiClient();
        const conversation = [
          {
            role: "system" as const,
            content: "You are a creative writing assistant. Write engaging, imaginative content based on user prompts. Keep it appropriate and entertaining."
          },
          {
            role: "user" as const,
            content: `Write a short creative piece based on this prompt: ${prompt}`
          }
        ];

        const response = await aiClient.generateText(conversation, {
          temperature: 0.9, // Higher temperature for more creative responses
          maxTokens: 800
        });
        
        await agent.sendConnectionMessage(roomId, response);
      } catch (error) {
        console.error('Creative Writing Error:', error);
        await agent.sendConnectionMessage(roomId, 'Sorry, I had trouble with that creative writing request.');
      }
    });

    // Help command
    agent.addCommand('/help', async (message, replyMessage, roomId) => {
      const helpText = `🤖 **OpenAI-Powered Agent Commands**

**Basic Commands:**
• \`/ask <question>\` - Ask any question
• \`/chat <message>\` - Have a conversation
• \`/code <question>\` - Get coding help
• \`/write <prompt>\` - Creative writing
• \`/help\` - Show this help

**Examples:**
• \`/ask What is machine learning?\`
• \`/chat How's your day going?\`
• \`/code How do I use async/await in JavaScript?\`
• \`/write A poem about the ocean\`

**Powered by:** ${process.env.AI_MODEL || 'GPT-4'}`;

      await agent.sendConnectionMessage(roomId, helpText);
    });

    // Initialize agent
    await agent.initialize();
    console.log('✅ OpenAI-powered agent initialized successfully!');
    console.log('🔗 Available commands: /ask, /chat, /code, /write, /help');

  } catch (error) {
    if (error.message.includes('AI configuration')) {
      console.error('❌ AI Configuration Error:', error.message);
      console.error('Please set up your OpenAI configuration:');
      console.error('1. AI_PROVIDER=openai');
      console.error('2. AI_MODEL=gpt-4');
      console.error('3. AI_API_KEY=sk-your-openai-api-key');
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