import 'dotenv/config';
import { SuperDappAgent, createBotConfig } from '../../src';
import * as schedule from 'node-schedule';

async function main() {
  try {
    // Initialize the agent with webhook configuration
    const agent = new SuperDappAgent(createBotConfig(), {
      port: 3001,
      onReady: async () => {
        console.log('Advanced agent webhook server is ready!');
      },
    });

    // Store user subscriptions (in a real app, use a database)
    const userSubscriptions = new Map<string, string[]>();

    // Add advanced commands
    agent.addCommand('/start', async (message, replyMessage, roomId) => {
      const welcomeText = `🚀 Welcome to the Advanced SuperDapp Agent!

This agent demonstrates advanced features:
• Scheduled messages
• User subscriptions
• File uploads
• Interactive menus
• Data persistence

Type /help to see all available commands.`;

      await agent.sendConnectionMessage(roomId, welcomeText);
    });

    agent.addCommand('/help', async (message, replyMessage, roomId) => {
      const helpText = `🔧 Available commands:

📱 Basic:
/start - Welcome message
/help - Show this help
/status - Bot status

📊 Data:
/subscribe <topic> - Subscribe to updates
/unsubscribe <topic> - Unsubscribe from updates
/mysubs - Show your subscriptions

🔔 Notifications:
/notify <message> - Schedule a notification
/schedule <time> <message> - Schedule at specific time

🎯 Interactive:
/menu - Show interactive menu
/poll <question> - Create a poll

💰 Crypto:
/price <symbol> - Get current price
/portfolio - Show portfolio summary

⚙️ Advanced:
/debug - Debug information
/logs - Show recent logs`;

      await agent.sendConnectionMessage(roomId, helpText);
    });

    agent.addCommand('/subscribe', async (message, replyMessage, roomId) => {
      const args = message.body.m?.body?.split(' ').slice(1) || [];
      const topic = args[0];

      if (!topic) {
        await agent.sendConnectionMessage(
          roomId,
          'Please specify a topic: /subscribe <topic>'
        );
        return;
      }

      const userSubs = userSubscriptions.get(roomId) || [];
      if (!userSubs.includes(topic)) {
        userSubs.push(topic);
        userSubscriptions.set(roomId, userSubs);
        await agent.sendConnectionMessage(roomId, `✅ Subscribed to: ${topic}`);
      } else {
        await agent.sendConnectionMessage(
          roomId,
          `ℹ️ Already subscribed to: ${topic}`
        );
      }
    });

    agent.addCommand('/mysubs', async (message, replyMessage, roomId) => {
      const userSubs = userSubscriptions.get(roomId) || [];
      if (userSubs.length === 0) {
        await agent.sendConnectionMessage(
          roomId,
          'You have no active subscriptions.'
        );
      } else {
        await agent.sendConnectionMessage(
          roomId,
          `Your subscriptions: ${userSubs.join(', ')}`
        );
      }
    });

    agent.addCommand('/menu', async (message, replyMessage, roomId) => {
      const menuText = `🎯 Interactive Menu:

Choose an option:
1️⃣ Get latest news
2️⃣ Check portfolio
3️⃣ Set price alert
4️⃣ Subscribe to updates
5️⃣ View analytics

Reply with the number of your choice.`;

      await agent.sendConnectionMessage(roomId, menuText);
    });

    agent.addCommand('/price', async (message, replyMessage, roomId) => {
      const args = message.body.m?.body?.split(' ').slice(1) || [];
      const symbol = args[0] || 'BTC';

      // Mock price data (in a real app, integrate with an API)
      const mockPrices: { [key: string]: number } = {
        BTC: 65000 + Math.random() * 5000,
        ETH: 3200 + Math.random() * 500,
        ADA: 0.45 + Math.random() * 0.1,
        DOT: 25 + Math.random() * 5,
      };

      const price = mockPrices[symbol.toUpperCase()];
      if (price) {
        const formattedPrice = price.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        });

        await agent.sendConnectionMessage(
          roomId,
          `💰 ${symbol.toUpperCase()}: ${formattedPrice}`
        );
      } else {
        await agent.sendConnectionMessage(
          roomId,
          `❌ Price not found for: ${symbol}`
        );
      }
    });

    agent.addCommand('/portfolio', async (message, replyMessage, roomId) => {
      const portfolioText = `📊 Portfolio Summary:

💰 Total Value: $12,450.00
📈 24h Change: +2.45% (+$298.50)

Holdings:
🟠 BTC: 0.15 ($9,750.00)
🔵 ETH: 0.8 ($2,560.00)
🟢 ADA: 200 ($90.00)
🔴 DOT: 2 ($50.00)

⚡ Recent Activity:
• Bought 0.02 BTC at $64,500
• Sold 100 ADA at $0.44
• Set price alert for ETH at $3,500`;

      await agent.sendConnectionMessage(roomId, portfolioText);
    });

    // Handle general messages with smart routing
    agent.addCommand('handleMessage', async (message, replyMessage, roomId) => {
      const text = message.body.m?.body?.toLowerCase() || '';

      // Handle menu selections
      if (/^[1-5]$/.test(text.trim())) {
        const option = parseInt(text.trim());
        const responses = [
          '📰 Here are the latest news updates...',
          '📊 Checking your portfolio...',
          '🚨 Price alert setup initiated...',
          '📢 Subscription options available...',
          '📈 Analytics dashboard loading...',
        ];

        await agent.sendConnectionMessage(
          roomId,
          responses[option - 1] || 'Invalid option'
        );
        return;
      }

      // Handle conversational AI responses
      if (text.includes('hello') || text.includes('hi')) {
        await agent.sendConnectionMessage(
          roomId,
          '👋 Hello! How can I help you today?'
        );
      } else if (text.includes('price') || text.includes('cost')) {
        await agent.sendConnectionMessage(
          roomId,
          '💰 Use /price <symbol> to get current prices!'
        );
      } else if (text.includes('help')) {
        await agent.sendConnectionMessage(
          roomId,
          '❓ Type /help to see all available commands.'
        );
      } else {
        await agent.sendConnectionMessage(
          roomId,
          `🤖 I received: "${message.body.m?.body}"\n\nType /help for available commands.`
        );
      }
    });

    // Schedule periodic notifications for subscribers
    schedule.scheduleJob('0 */2 * * *', async () => {
      // Every 2 hours
      console.log('Sending scheduled notifications...');

      for (const [roomId, topics] of userSubscriptions) {
        if (topics.includes('crypto')) {
          await agent.sendConnectionMessage(
            roomId,
            '🔔 Crypto Update: Bitcoin is showing strong momentum!'
          );
        }
        if (topics.includes('news')) {
          await agent.sendConnectionMessage(
            roomId,
            '📰 News Alert: Major DeFi protocol announces new features.'
          );
        }
      }
    });

    // Start the webhook server
    await agent.start();
    console.log(
      '🚀 Advanced agent webhook server is running on port 3001 with scheduled tasks...'
    );
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
