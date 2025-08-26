import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { SuperDappAgent } from '../../src';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'application/json' }));

async function main() {
  try {
    // Initialize the agent
    const agent = new SuperDappAgent({
      apiToken: process.env.API_TOKEN as string,
      baseUrl:
        (process.env.API_BASE_URL as string) || 'https://api.superdapp.ai',
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
❓ \`/help\` - Show this help`;
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
        [buttons]
      );
    });

    // Handle callback queries (button clicks)
    // When a user clicks an inline button, superdapp sends a callback_query event
    // containing the button's callback_data. This handler processes those clicks
    // and responds accordingly (e.g., "YES" or "NO" from the feedback buttons)
    agent.addCommand('callback_query', async ({ message, roomId }) => {
      const action = message?.callback_command || '';
      const actionValue = message?.data || '';
      console.log('Callback query received:', { action, actionValue });

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
            `❓ **Unknown option:** ${action}${actionValue ? ':' + actionValue : ''}`
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

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'basic-agent',
        runtime: 'node',
      });
    });

    // Webhook endpoint
    app.post('/webhook', async (req, res) => {
      try {
        const body =
          typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const response = await agent.processRequest(body);

        res.status(200).json(response);
      } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Basic agent webhook server is running on port ${PORT}`);
      console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
