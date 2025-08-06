import 'dotenv/config';
import { SuperDappAgent, createBotConfig } from '../../src';

async function main() {
  try {
    // Initialize the agent with webhook configuration
    const agent = new SuperDappAgent(createBotConfig(), {
      port: 8787,
      onReady: async () => {
        console.log('Basic agent webhook server is ready!');
      },
    });

    // Add basic commands
    agent.addCommand('/start', async ({ roomId }) => {
      await agent.sendConnectionMessage(
        roomId,
        "👋 **Hello!** I'm a basic SuperDapp agent."
      );
    });

    agent.addCommand('/ping', async ({ roomId }) => {
      await agent.sendConnectionMessage(
        roomId,
        '🏓 **Pong!** Bot is responsive!'
      );
    });

    agent.addCommand('/help', async ({ roomId }) => {
      const helpText = `📋 **Available Commands**

🚀 \`/start\` - Start the bot
🏓 \`/ping\` - Test bot responsiveness
❓ \`/help\` - Show this help
🖼️ \`/image <channel_id>\` - Send test image to channel`;
      await agent.sendConnectionMessage(roomId, helpText);
    });

    // Add a command with buttons
    agent.addCommand('/menu', async ({ roomId }) => {
      const buttons = [
        { text: '✅ Yes', callback_data: 'YES' },
        { text: '❌ No', callback_data: 'NO' },
      ];

      await agent.sendReplyMarkupMessage(
        'buttons',
        roomId,
        '🎯 **Do you like this bot?**',
        [buttons] // Array de arrays para compatibilidade
      );
    });

    // Send image command
    agent.addCommand('/image', async ({ message, roomId }) => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, 'your-image.png');

      const channelId = message.data?.replace('/image', '').trim();

      if (!fs.existsSync(filePath)) {
        await agent.sendConnectionMessage(
          roomId,
          'Image file not found. Please add a image file to the examples/basic directory.'
        );
        return;
      }

      if (!channelId) {
        await agent.sendConnectionMessage(
          roomId,
          'Please provide a channel ID: /image <channel_id>'
        );
        return;
      }

      const fileStream = fs.createReadStream(filePath);

      await agent.sendChannelImage(
        channelId,
        fileStream,
        'Here is a test image from the basic example!'
      );
      await agent.sendConnectionMessage(roomId, 'Image sent to channel!');
    });

    // Handle callback queries
    // callback query is a message that is sent when a button is clicked
    // it is sent to the bot and the bot can then send a message to the user
    agent.addCommand('callback_query', async ({ message, roomId }) => {
      const callbackData = message.data;
      console.log('Callback query received:', callbackData);

      // Check if callback data exists
      if (!callbackData) {
        await agent.sendConnectionMessage(
          roomId,
          '❌ **Error:** No callback data received.'
        );
        return;
      }

      // Parse callback data to determine action type
      const [action, actionValue] = callbackData.split(':');

      switch (action) {
        case 'YES':
          await agent.sendConnectionMessage(
            roomId,
            '😊 **Great!** Thank you for your positive feedback!'
          );
          break;

        case 'NO':
          await agent.sendConnectionMessage(
            roomId,
            "😔 **Sorry to hear that.** We'll try to improve!"
          );
          break;

        default:
          await agent.sendConnectionMessage(
            roomId,
            `❓ **Unknown option:** ${callbackData}`
          );
      }
    });

    // Handle general messages
    agent.addCommand('handleMessage', async ({ message, roomId }) => {
      console.log('Received message:', message.data);
      await agent.sendConnectionMessage(
        roomId,
        '📨 **I received your message!** Type `/help` for available commands.'
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
