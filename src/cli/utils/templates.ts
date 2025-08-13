import fs from 'fs/promises';
import path from 'path';

interface ProjectConfig {
  name: string;
  template: string;
  description: string;
}

interface TemplateFile {
  path: string;
  content: string;
}

export async function createProjectStructure(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  // Create main directory
  await fs.mkdir(projectPath, { recursive: true });

  // Get template files
  const templateFiles = getTemplateFiles(config);

  // Create all files
  for (const file of templateFiles) {
    const filePath = path.join(projectPath, file.path);
    const dirPath = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Write file
    await fs.writeFile(filePath, file.content);
  }
}

function getBaseFiles(config: ProjectConfig): TemplateFile[] {
  return [
    {
      path: 'package.json',
      content: JSON.stringify(
        {
          name: config.name,
          version: '1.0.0',
          description: config.description,
          main: 'dist/index.js',
          scripts: {
            start: 'node dist/index.js',
            dev: 'tsx watch src/index.ts',
            build: 'npm run clean && tsc',
            clean: 'rm -rf dist',
          },
          dependencies: {
            '@superdapp/agents': '^1.0.0',
            dotenv: '^16.4.5',
          },
          devDependencies: {
            '@types/node': '^20.12.12',
            tsx: '^4.10.5',
            typescript: '^5.4.5',
          },
          engines: {
            node: '>=18.0.0',
          },
        },
        null,
        2
      ),
    },
    {
      path: 'tsconfig.json',
      content: JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'CommonJS',
            lib: ['ES2022'],
            outDir: './dist',
            rootDir: './src',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            declaration: true,
            sourceMap: true,
            moduleResolution: 'node',
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist'],
        },
        null,
        2
      ),
    },
    {
      path: '.env.example',
      content: `# SuperDapp Agent Configuration
API_TOKEN=your_api_token_here
# API_BASE_URL=https://api.superdapp.ai
WEBHOOK_SECRET=your_webhook_secret_here
NODE_ENV=development # or production
PORT=8787
`,
    },
    {
      path: '.gitignore',
      content: `node_modules/
dist/
*.log
.env
.env.local
.DS_Store
Thumbs.db
`,
    },
    {
      path: 'README.md',
      content: getReadmeContent(config),
    },
  ];
}

function getBasicAgentFiles(config: ProjectConfig): TemplateFile[] {
  return [
    {
      path: 'src/index.ts',
      content: `import 'dotenv/config';
import { SuperDappAgent, createBotConfig } from '@superdapp/agents';

async function main() {
  try {
    // Initialize the agent with webhook configuration
    const agent = new SuperDappAgent(createBotConfig(), {
      port: 8787,
      secret: process.env.WEBHOOK_SECRET,
      onReady: async () => {
        console.log('${config.name} webhook server is ready!');
      },
    });

    // Add basic commands
    agent.addCommand('/start', async ({ roomId }) => {
      await agent.sendConnectionMessage(
        roomId,
        "👋 **Hello!** I'm your SuperDapp agent. Type \`/help\` to see available commands."
      );
    });

    agent.addCommand('/help', async ({ roomId }) => {
      const helpText = \`📋 **Available Commands**

🚀 \\\`/start\\\` - Start the bot
❓ \\\`/help\\\` - Show this help message
📊 \\\`/status\\\` - Show bot status
🏓 \\\`/ping\\\` - Check if bot is responsive
📱 \\\`/menu\\\` - Show interactive menu
🔗 \\\`/join\\\` - Join a channel
🚪 \\\`/leave\\\` - Leave a channel
📝 \\\`/test-multiselect\\\` - Test multiselect functionality
🖼️ \\\`/test-image\\\` - Test image sending\`;

      await agent.sendConnectionMessage(roomId, helpText);
    });

    agent.addCommand('/status', async ({ roomId }) => {
      const client = agent.getClient();
      const botInfo = await client.getMe();
      console.log(botInfo);
      const statusText = \`🤖 **Bot Status**

📛 **Name:** \${botInfo.data.username || 'Unknown'}
🟢 **Status:** \${botInfo.data.enabled ? 'Active' : 'Inactive'}
📅 **Created:** \${new Date(botInfo.data.created_at).toLocaleDateString()}
🔗 **Webhook:** \${botInfo.data.webhook_url || 'Not configured'}\`;

      await agent.sendConnectionMessage(roomId, statusText);
    });

    agent.addCommand('/ping', async ({ roomId }) => {
      await agent.sendConnectionMessage(
        roomId,
        '🏓 **Pong!** Bot is responsive!'
      );
    });

    // ⚠️ IMPORTANT: Use COMMAND:VALUE format with colon separator when mapping multiple commands with different values
    agent.addCommand('/menu', async ({ roomId }) => {
      const buttons = [
        { text: '📊 Get Status', callback_data: 'GET_STATUS' },
        { text: '❓ Help', callback_data: 'GET_HELP' },
      ];

      await agent.sendReplyMarkupMessage(
        'buttons',
        roomId,
        '🎯 **Choose an option:**',
        [buttons]
      );
    });

    agent.addCommand('/test-multiselect', async ({ roomId }) => {
      const topics = ['Crypto', 'Tech', 'News', 'Sports', 'Politics'];

      const topicsReplyMarkup = {
        type: 'multiselect',
        actions: [
          ...topics.map((topic, idx) => [
            {
              index: \`\${idx + 1}\`,
              text: \`\${idx + 1} - \${topic}\`,
              callback_data: \`TOPIC_SELECTION:\${topic}\`,
            },
          ]),
          // the last button is the confirm button
          [
            {
              text: '✅ Confirm',
              callback_data: 'CONFIRM_TOPICS:',
            },
          ],
        ],
      };

      await agent.sendReplyMarkupMessage(
        'multiselect',
        roomId,
        '📝 **Select topics:**',
        topicsReplyMarkup.actions
      );
    });

    // join bot to channel user is owner of
    agent.addCommand('/join', async ({ message, roomId }) => {
      const client = agent.getClient();
      const channels = await client.getChannels(message.rawMessage.senderId);

      const replyMarkup = channels.data.map((channel: any) => [
        {
          text: channel.name,
          callback_data: \`JOIN_CHANNEL:\${channel.name}\`,
        },
      ]);

      await agent.sendReplyMarkupMessage(
        'buttons',
        roomId,
        '🎯 **Choose a group to join:**',
        replyMarkup
      );
    });

    // leave channel bot is in
    agent.addCommand('/leave', async ({ roomId }) => {
      const client = agent.getClient();
      const botInfo = await client.getMe();
      const channels = await client.getBotChannels();

      const replyMarkup = channels.data.map((channel: any) => [
        {
          text: channel.name,
          callback_data: \`LEAVE_CHANNEL:\${channel.id}\`,
        },
      ]);

      await agent.sendReplyMarkupMessage(
        'buttons',
        roomId,
        '🎯 **Choose a group to leave:**',
        replyMarkup
      );
    });

    // Handle callback queries
    // ✅ The callback_data is automatically parsed into message.callback_command and message.data
    // Format: COMMAND:VALUE (e.g., "JOIN_CHANNEL:my-channel" → callback_command="JOIN_CHANNEL", data="my-channel")
    agent.addCommand('callback_query', async ({ message, roomId }) => {
      const client = agent.getClient();
      const channelId = message.data;

      console.log('Callback query received:', message);

      switch (message.callback_command) {
        case 'JOIN_CHANNEL':
          if (!channelId) return;

          await client.joinChannel(channelId, message.rawMessage.id);
          await agent.sendConnectionMessage(roomId, '✅ **Joined channel!**');
          break;
        case 'LEAVE_CHANNEL':
          if (!channelId) return;

          await client.leaveChannel(channelId, message.rawMessage.id);
          await agent.sendConnectionMessage(roomId, '🚪 **Left channel!**');
          break;
        case 'GET_STATUS':
          await agent.sendConnectionMessage(
            roomId,
            '🟢 **Bot is running smoothly!** Everything is working perfectly.'
          );
          break;
        case 'GET_HELP':
          await agent.sendConnectionMessage(
            roomId,
            '❓ Type \`/help\` to see all available commands.'
          );
          break;
        case 'CONFIRM_TOPICS':
          await agent.sendConnectionMessage(
            roomId,
            '✅ **Topics confirmed!** Your selections have been saved successfully.'
          );
          break;
        default:
          await agent.sendConnectionMessage(
            roomId,
            '❌ **Unknown option selected.** Please try again.'
          );
      }
    });

    // send image
    agent.addCommand('/test-image', async ({ message, roomId }) => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '/path-to-image/test-image.jpg');
      const channelId = (message.data?.split(' ')[1] || '').trim();

      if (!fs.existsSync(filePath)) {
        await agent.sendConnectionMessage(roomId, '❌ **Image file not found.**');
        return;
      }

      if (!channelId) return;

      const fileStream = fs.createReadStream(filePath);
      await agent.sendChannelImage(
        channelId,
        fileStream,
        '🖼️ **Here is a test image!**'
      );
      await agent.sendConnectionMessage(roomId, '✅ **Image sent to channel!**');
    });

    // Start the webhook server
    await agent.start();
    console.log('Server is running on port ' + (process.env.PORT));
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
`,
    },
  ];
}

function getNewsAgentFiles(config: ProjectConfig): TemplateFile[] {
  return [
    {
      path: 'src/index.ts',
      content: `import 'dotenv/config';
import { SuperDappAgent, createBotConfig } from '@superdapp/agents';
import { NewsGenerator } from './newsGenerator';

async function main() {
  try {
    // Initialize the agent with webhook configuration
    const agent = new SuperDappAgent(createBotConfig(), {
      port: 8787,
      secret: process.env.WEBHOOK_SECRET,
      onReady: async () => {
        console.log('${config.name} webhook server is ready!');
      },
    });
    const newsGenerator = new NewsGenerator();

    // Add news-specific commands
    agent.addCommand('/start', async ({ roomId }) => {
      await agent.sendConnectionMessage(
        roomId,
        "👋 **Hello!** I'm your AI News agent. Type \`/help\` to see available commands."
      );
    });

    agent.addCommand('/help', async ({ roomId }) => {
      const helpText = \`📋 **Available Commands**

🚀 \\\`/start\\\` - Start the bot
❓ \\\`/help\\\` - Show this help message
📰 \\\`/news\\\` - Get latest news
📂 \\\`/topics\\\` - List available news topics
🔔 \\\`/subscribe <topic>\\\` - Subscribe to news updates
📱 \\\`/menu\\\` - Show interactive menu
📝 \\\`/test-multiselect\\\` - Test topic selection\`;

      await agent.sendConnectionMessage(roomId, helpText);
    });

    agent.addCommand('/news', async ({ roomId }) => {
      const news = await newsGenerator.getLatestNews();
      await agent.sendConnectionMessage(roomId, \`📰 **Latest News**\n\n\${news}\`);
    });

    // ⚠️ IMPORTANT: Use COMMAND:VALUE format with colon separator when mapping multiple commands with different values
    agent.addCommand('/topics', async ({ roomId }) => {
      const topics = newsGenerator.getAvailableTopics();
      const options = topics.map(topic => ({
        text: topic.charAt(0).toUpperCase() + topic.slice(1),
        callback_data: \`TOPIC:\${topic.toUpperCase()}\`
      }));
      
      await agent.sendReplyMarkupMessage(
        'buttons',
        roomId,
        '📂 **Select news topics:**',
        [options]
      );
    });

    agent.addCommand('/test-multiselect', async ({ roomId }) => {
      const topics = newsGenerator.getAvailableTopics();

      const topicsReplyMarkup = {
        type: 'multiselect',
        actions: [
          ...topics.map((topic, idx) => [
            {
              index: \`\${idx + 1}\`,
              text: \`\${idx + 1} - \${topic.charAt(0).toUpperCase() + topic.slice(1)}\`,
              callback_data: \`TOPIC_SELECTION:\${topic}\`,
            },
          ]),
          [
            {
              text: '✅ Confirm Selection',
              callback_data: 'CONFIRM_TOPICS:',
            },
          ],
        ],
      };

      await agent.sendReplyMarkupMessage(
        'multiselect',
        roomId,
        '📝 **Select news topics:**',
        topicsReplyMarkup.actions
      );
    });

    // ⚠️ IMPORTANT: Use COMMAND:VALUE format with colon separator when mapping multiple commands with different values
    agent.addCommand('/menu', async ({ roomId }) => {
      const buttons = [
        { text: '📰 Latest News', callback_data: 'GET_NEWS' },
        { text: '📂 Topics', callback_data: 'GET_TOPICS' },
        { text: '🔔 Subscribe', callback_data: 'SUBSCRIBE' },
        { text: '📝 Test Multiselect', callback_data: 'TEST_MULTISELECT' },
      ];

      await agent.sendReplyMarkupMessage(
        'buttons',
        roomId,
        '📱 **News Agent Menu:**',
        [buttons]
      );
    });

    // Handle callback queries
    // ✅ The callback_data is automatically parsed into message.callback_command and message.data
    // Format: COMMAND:VALUE (e.g., "TOPIC:CRYPTO" → callback_command="TOPIC", data="CRYPTO")
    agent.addCommand('callback_query', async ({ message, roomId }) => {
      console.log('Callback query received:', message);

      if (message.callback_command === 'TOPIC') {
        const topic = message.data?.toLowerCase() || '';
        const news = await newsGenerator.generateNewsForTopic(topic);
        await agent.sendConnectionMessage(roomId, \`📰 **\${topic.charAt(0).toUpperCase() + topic.slice(1)} News**\n\n\${news}\`);
      } else if (message.callback_command === 'TOPIC_SELECTION') {
        const topic = message.data || '';
        const news = await newsGenerator.generateNewsForTopic(topic);
        await agent.sendConnectionMessage(roomId, \`📰 **\${topic.charAt(0).toUpperCase() + topic.slice(1)} News**\n\n\${news}\`);
      } else {
        switch (message.callback_command) {
          case 'GET_NEWS':
            const news = await newsGenerator.getLatestNews();
            await agent.sendConnectionMessage(roomId, \`📰 **Latest News**\n\n\${news}\`);
            break;
          case 'GET_TOPICS':
            const topics = newsGenerator.getAvailableTopics();
            await agent.sendConnectionMessage(roomId, \`📂 **Available topics:** \${topics.join(', ')}\`);
            break;
          case 'SUBSCRIBE':
            await agent.sendConnectionMessage(roomId, '🔔 **Use** \`/subscribe <topic>\` **to subscribe to news updates.**');
            break;
          case 'TEST_MULTISELECT':
            const topicsForMultiselect = newsGenerator.getAvailableTopics();
            const multiselectActions = [
              ...topicsForMultiselect.map((topic, idx) => [
                {
                  index: \`\${idx + 1}\`,
                  text: \`\${idx + 1} - \${topic.charAt(0).toUpperCase() + topic.slice(1)}\`,
                  callback_data: \`TOPIC_SELECTION:\${topic}\`,
                },
              ]),
              [
                {
                  text: '✅ Confirm Selection',
                  callback_data: 'CONFIRM_TOPICS:',
                },
              ],
            ];
            await agent.sendReplyMarkupMessage(
              'multiselect',
              roomId,
              '📝 **Select news topics:**',
              multiselectActions
            );
            break;
          case 'CONFIRM_TOPICS':
            await agent.sendConnectionMessage(roomId, '✅ **Topics confirmed!** Your selections have been saved successfully.');
            break;
          default:
            await agent.sendConnectionMessage(roomId, '❌ **Unknown option selected.** Please try again.');
        }
      }
    });

    // Start the webhook server
    await agent.start();
    console.log('Server is running on port ' + (process.env.PORT));
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
`,
    },
    {
      path: 'src/newsGenerator.ts',
      content: `export class NewsGenerator {
  private topics = ['crypto', 'blockchain', 'defi', 'nft', 'tech'];

  async getLatestNews(): Promise<string> {
    // Implement your news generation logic here
    return 'Bitcoin reaches new highs as institutional adoption increases. Ethereum 2.0 continues to show promising results with improved scalability and reduced energy consumption.';
  }

  getAvailableTopics(): string[] {
    return this.topics;
  }

  async generateNewsForTopic(topic: string): Promise<string> {
    // Implement topic-specific news generation
    const newsByTopic: { [key: string]: string } = {
      crypto: 'Bitcoin and Ethereum lead the market with strong performance. Altcoins show mixed results as market sentiment improves.',
      blockchain: 'New blockchain innovations emerge with focus on scalability and interoperability. Layer 2 solutions gain traction.',
      defi: 'DeFi protocols see increased TVL as yield farming opportunities expand. New lending platforms launch with innovative features.',
      nft: 'NFT market shows signs of recovery with high-profile sales. Gaming NFTs continue to dominate the space.',
      tech: 'AI and blockchain convergence accelerates. New partnerships between tech giants and crypto companies announced.'
    };
    
    return newsByTopic[topic] || \`Latest news for \${topic}: [Generated content would go here]\`;
  }
}
`,
    },
  ];
}

function getTradingAgentFiles(config: ProjectConfig): TemplateFile[] {
  return [
    {
      path: 'src/index.ts',
      content: `import 'dotenv/config';
import { SuperDappAgent, createBotConfig } from '@superdapp/agents';
import { TradingAssistant } from './tradingAssistant';

async function main() {
  try {
    // Initialize the agent with webhook configuration
    const agent = new SuperDappAgent(createBotConfig(), {
      port: 8787,
      secret: process.env.WEBHOOK_SECRET,
      onReady: async () => {
        console.log('${config.name} webhook server is ready!');
      },
    });
    const tradingAssistant = new TradingAssistant();

    // Add trading-specific commands
    agent.addCommand('/start', async ({ roomId }) => {
      await agent.sendConnectionMessage(
        roomId,
        "👋 **Hello!** I'm your AI Trading assistant. Type \`/help\` to see available commands."
      );
    });

    agent.addCommand('/help', async ({ roomId }) => {
      const helpText = \`📋 **Available Commands**

🚀 \\\`/start\\\` - Start the bot
❓ \\\`/help\\\` - Show this help message
💰 \\\`/price <symbol>\\\` - Get current price
📊 \\\`/portfolio\\\` - View portfolio summary
🔔 \\\`/alerts\\\` - Manage price alerts
📱 \\\`/menu\\\` - Show interactive menu
📈 \\\`/watchlist\\\` - Manage watchlist\`;

      await agent.sendConnectionMessage(roomId, helpText);
    });

    agent.addCommand('/price', async ({ message, roomId }) => {
      const symbol = message.messageText?.split(' ')[1] || 'BTC';
      const price = await tradingAssistant.getPrice(symbol);
      await agent.sendConnectionMessage(roomId, \`💰 **\${symbol.toUpperCase()} Price:** \${price}\`);
    });

    agent.addCommand('/portfolio', async ({ roomId }) => {
      const portfolio = await tradingAssistant.getPortfolioSummary();
      await agent.sendConnectionMessage(roomId, \`📊 **Portfolio Summary**\n\n\${portfolio}\`);
    });

    // ⚠️ IMPORTANT: Use COMMAND:VALUE format with colon separator when mapping multiple commands with different values
    agent.addCommand('/watchlist', async ({ roomId }) => {
      const watchlist = tradingAssistant.getWatchlist();
      const options = watchlist.map(symbol => ({
        text: symbol,
        callback_data: \`PRICE:\${symbol}\`
      }));
      
      await agent.sendReplyMarkupMessage(
        'buttons',
        roomId,
        '📈 **Select from watchlist:**',
        [options]
      );
    });

    // ⚠️ IMPORTANT: Use COMMAND:VALUE format with colon separator when mapping multiple commands with different values
    agent.addCommand('/menu', async ({ roomId }) => {
      const buttons = [
        { text: '💰 BTC Price', callback_data: 'PRICE:BTC' },
        { text: '💰 ETH Price', callback_data: 'PRICE:ETH' },
        { text: '📊 Portfolio', callback_data: 'GET_PORTFOLIO' },
        { text: '🔔 Set Alert', callback_data: 'SET_ALERT' },
        { text: '📈 Watchlist', callback_data: 'GET_WATCHLIST' },
      ];

      await agent.sendReplyMarkupMessage(
        'buttons',
        roomId,
        '📱 **Trading Assistant Menu:**',
        [buttons]
      );
    });

    // Handle callback queries
    // ✅ The callback_data is automatically parsed into message.callback_command and message.data
    // Format: COMMAND:VALUE (e.g., "PRICE:BTC" → callback_command="PRICE", data="BTC")
    agent.addCommand('callback_query', async ({ message, roomId }) => {
      console.log('Callback query received:', message);

      if (message.callback_command === 'PRICE') {
        const symbol = message.data || '';
        const price = await tradingAssistant.getPrice(symbol);
        await agent.sendConnectionMessage(roomId, \`💰 **\${symbol} Price:** \${price}\`);
      } else {
        switch (message.callback_command) {
          case 'GET_PORTFOLIO':
            const portfolio = await tradingAssistant.getPortfolioSummary();
            await agent.sendConnectionMessage(roomId, \`📊 **Portfolio Summary**\n\n\${portfolio}\`);
            break;
          case 'SET_ALERT':
            await agent.sendConnectionMessage(roomId, '🔔 **Use** \`/alerts\` **to manage price alerts.**');
            break;
          case 'GET_WATCHLIST':
            const watchlist = tradingAssistant.getWatchlist();
            const options = watchlist.map(symbol => ({
              text: symbol,
              callback_data: \`PRICE:\${symbol}\`
            }));
            await agent.sendReplyMarkupMessage(
              'buttons',
              roomId,
              '📈 **Select from watchlist:**',
              [options]
            );
            break;
          default:
            await agent.sendConnectionMessage(roomId, '❌ **Unknown option selected.** Please try again.');
        }
      }
    });

    // Start the webhook server
    await agent.start();
    console.log('Server is running on port ' + (process.env.PORT));
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
`,
    },
    {
      path: 'src/tradingAssistant.ts',
      content: `export class TradingAssistant {
  private watchlist = ['BTC', 'ETH', 'ADA', 'SOL', 'DOT'];

  async getPrice(symbol: string): Promise<string> {
    // Implement price fetching logic here
    // This is a mock implementation
    const mockPrices: { [key: string]: number } = {
      BTC: 65000,
      ETH: 3200,
      ADA: 0.45,
      SOL: 95.50,
      DOT: 6.80,
    };
    
    return (mockPrices[symbol.toUpperCase()] || 0).toLocaleString();
  }

  async getPortfolioSummary(): Promise<string> {
    // Implement portfolio summary logic
    return \`💰 **Total Value:** $15,250.00

📈 **Holdings:**
• BTC: 0.1 ($6,500.00)
• ETH: 1.0 ($3,200.00)
• ADA: 1000 ($450.00)
• SOL: 10 ($955.00)
• DOT: 100 ($680.00)

💵 **Cash:** $3,465.00

📊 **24h Change:** +2.5%\`;
  }

  getWatchlist(): string[] {
    return this.watchlist;
  }

  async setPriceAlert(symbol: string, price: number): Promise<void> {
    // Implement price alert logic
    console.log(\`🔔 Price alert set for \${symbol} at \${price}\`);
  }

  async getMarketOverview(): Promise<string> {
    return \`📊 **Market Overview**

🟢 **Top Gainers:**
• SOL: +8.5%
• DOT: +5.2%
• ADA: +3.1%

🔴 **Top Losers:**
• BTC: -1.2%
• ETH: -0.8%

📈 **Market Cap:** $2.1T
  💹 **24h Volume:** $85.2B\`;
  }
}
`,
    },
  ];
}

export function getTemplateFiles(config: ProjectConfig): TemplateFile[] {
  const baseFiles = getBaseFiles(config);

  switch (config.template) {
    case 'news':
      return [...baseFiles, ...getNewsAgentFiles(config)];
    case 'trading':
      return [...baseFiles, ...getTradingAgentFiles(config)];
    case 'basic':
    default:
      return [...baseFiles, ...getBasicAgentFiles(config)];
  }
}

function getReadmeContent(config: ProjectConfig): string {
  return `# ${config.name}

${config.description}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Configure your environment:
   \`\`\`bash
   superagent configure
   \`\`\`

3. Run the agent:
   \`\`\`bash
   npm run dev
   \`\`\`

## Configuration

Copy \`.env.example\` to \`.env\` and fill in your configuration:

\`\`\`
API_TOKEN=your_superdapp_api_token
API_BASE_URL=https://api.superdapp.ai
\`\`\`

## Commands

- \`npm start\` - Run the compiled agent
- \`npm run dev\` - Run the agent in development mode with hot reload
- \`npm run build\` - Build the TypeScript code
- \`npm run clean\` - Clean the build directory

## Development

This agent is built using the SuperDapp Agents SDK. You can extend its functionality by:

1. Adding new command handlers
2. Integrating with external APIs
3. Implementing custom business logic
4. Adding scheduled tasks

## Deployment

Deploy your agent using the SuperDapp CLI:

\`\`\`bash
superagent deploy
\`\`\`

## Support

For more information, visit the [SuperDapp documentation](https://docs.superdapp.com).
`;
}
