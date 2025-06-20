import 'dotenv/config';
import { SuperDappAgent, createBotConfig } from '@superdapp/agents';

async function main() {
  try {
    // Initialize the agent
    const agent = new SuperDappAgent(createBotConfig());

    // Add basic commands
    agent.addCommand('/start', async (message, replyMessage, roomId) => {
      await agent.sendConnectionMessage(roomId, 'Hello! I\'m your SuperDapp agent. Type /help to see available commands.');
    });

    agent.addCommand('/help', async (message, replyMessage, roomId) => {
      const helpText = `Available commands:
/start - Start the bot
/help - Show this help message
/status - Show bot status
/ping - Check if bot is responsive`;
      
      await agent.sendConnectionMessage(roomId, helpText);
    });

    agent.addCommand('/status', async (message, replyMessage, roomId) => {
      const botInfo = await agent.getBotInfo();
      const statusText = `Bot Status:
Name: ${botInfo.data.bot_info?.name || 'Unknown'}
Status: ${botInfo.data.bot_info?.isActive ? 'Active' : 'Inactive'}
User: ${botInfo.data.user?.email || 'Unknown'}`;
      
      await agent.sendConnectionMessage(roomId, statusText);
    });

    agent.addCommand('/ping', async (message, replyMessage, roomId) => {
      await agent.sendConnectionMessage(roomId, 'Pong! 🏓');
    });

    // Handle general messages
    agent.addCommand('handleMessage', async (message, replyMessage, roomId) => {
      console.log('Received message:', message.body.m?.body);
      // Add your custom message handling logic here
    });

    // Initialize and start listening
    await agent.initialize();
    console.log('my-superdapp-agent is running...');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
