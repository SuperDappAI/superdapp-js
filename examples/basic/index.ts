import 'dotenv/config';
import { SuperDappAgent, createBotConfig } from '../src';

async function main() {
  try {
    // Initialize the agent
    const agent = new SuperDappAgent(createBotConfig());

    // Add basic commands
    agent.addCommand('/start', async (message, replyMessage, roomId) => {
      await agent.sendConnectionMessage(
        roomId,
        "Hello! I'm a basic SuperDapp agent."
      );
    });

    agent.addCommand('/ping', async (message, replyMessage, roomId) => {
      await agent.sendConnectionMessage(roomId, 'Pong! 🏓');
    });

    agent.addCommand('/help', async (message, replyMessage, roomId) => {
      const helpText = `Available commands:
/start - Start the bot
/ping - Test bot responsiveness
/help - Show this help`;
      await agent.sendConnectionMessage(roomId, helpText);
    });

    // Handle general messages
    agent.addCommand('handleMessage', async (message, replyMessage, roomId) => {
      console.log('Received message:', message.body.m?.body);
      await agent.sendConnectionMessage(
        roomId,
        'I received your message! Type /help for available commands.'
      );
    });

    // Initialize and start
    await agent.initialize();
    console.log('Basic agent is running...');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
