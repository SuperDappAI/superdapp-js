import 'dotenv/config';
import { SuperDappAgent, createBotConfig } from '../../src';

async function main() {
  try {
    // Initialize the agent with webhook configuration
    const agent = new SuperDappAgent(createBotConfig(), {
      port: 3000,
      onReady: async () => {
        console.log('Basic agent webhook server is ready!');
      },
    });

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

    // Add a command with buttons
    agent.addCommand('/menu', async (message, replyMessage, roomId) => {
      const buttons = [
        { text: 'Option 1', callback_data: 'OPTION_1' },
        { text: 'Option 2', callback_data: 'OPTION_2' },
      ];

      await agent.sendMessageWithButtons(roomId, 'Choose an option:', buttons);
    });

    // Handle callback queries
    // callback query is a message that is sent when a button is clicked
    // it is sent to the bot and the bot can then send a message to the user
    agent.addCommand(
      'callback_query',
      async (message, replyMessage, roomId) => {
        const callbackData = message.body.m?.body?.callback_query?.data;
        console.log('Callback query received:', callbackData);

        await agent.sendConnectionMessage(
          roomId,
          `You selected: ${callbackData}`
        );
      }
    );

    // Handle general messages
    agent.addCommand('handleMessage', async (message, replyMessage, roomId) => {
      console.log('Received message:', message.messageText);
      await agent.sendConnectionMessage(
        roomId,
        'I received your message! Type /help for available commands.'
      );
    });

    // Start the webhook server
    await agent.start();
    console.log('Basic agent webhook server is running on port 3000...');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
