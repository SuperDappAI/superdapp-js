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
# API_BASE_URL=https://api.superdapp.com
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
    // Initialize the agent
    const agent = new SuperDappAgent(createBotConfig());

    // Add basic commands
    agent.addCommand('/start', async (message, replyMessage, roomId) => {
      await agent.sendConnectionMessage(roomId, 'Hello! I\\'m your SuperDapp agent. Type /help to see available commands.');
    });

    agent.addCommand('/help', async (message, replyMessage, roomId) => {
      const helpText = \`Available commands:
/start - Start the bot
/help - Show this help message
/status - Show bot status
/ping - Check if bot is responsive\`;
      
      await agent.sendConnectionMessage(roomId, helpText);
    });

    agent.addCommand('/status', async (message, replyMessage, roomId) => {
      const botInfo = await agent.getBotInfo();
      const statusText = \`Bot Status:
Name: \${botInfo.data.bot_info?.name || 'Unknown'}
Status: \${botInfo.data.bot_info?.isActive ? 'Active' : 'Inactive'}
User: \${botInfo.data.user?.email || 'Unknown'}\`;
      
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
    console.log('${config.name} is running...');
    
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
    // Initialize the agent
    const agent = new SuperDappAgent(createBotConfig());
    const newsGenerator = new NewsGenerator();

    // Add news-specific commands
    agent.addCommand('/start', async (message, replyMessage, roomId) => {
      await agent.sendConnectionMessage(roomId, 'Hello! I\\'m your AI News agent. Type /help to see available commands.');
    });

    agent.addCommand('/help', async (message, replyMessage, roomId) => {
      const helpText = \`Available commands:
/start - Start the bot
/help - Show this help message
/news - Get latest news
/topics - List available news topics
/subscribe <topic> - Subscribe to news updates\`;
      
      await agent.sendConnectionMessage(roomId, helpText);
    });

    agent.addCommand('/news', async (message, replyMessage, roomId) => {
      const news = await newsGenerator.getLatestNews();
      await agent.sendConnectionMessage(roomId, news);
    });

    agent.addCommand('/topics', async (message, replyMessage, roomId) => {
      const topics = newsGenerator.getAvailableTopics();
      await agent.sendConnectionMessage(roomId, \`Available topics: \${topics.join(', ')}\`);
    });

    // Initialize and start listening
    await agent.initialize();
    console.log('${config.name} is running...');
    
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
    return 'Latest crypto news: Bitcoin reaches new highs as institutional adoption increases.';
  }

  getAvailableTopics(): string[] {
    return this.topics;
  }

  async generateNewsForTopic(topic: string): Promise<string> {
    // Implement topic-specific news generation
    return \`Latest news for \${topic}: [Generated content would go here]\`;
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
    // Initialize the agent
    const agent = new SuperDappAgent(createBotConfig());
    const tradingAssistant = new TradingAssistant();

    // Add trading-specific commands
    agent.addCommand('/start', async (message, replyMessage, roomId) => {
      await agent.sendConnectionMessage(roomId, 'Hello! I\\'m your AI Trading assistant. Type /help to see available commands.');
    });

    agent.addCommand('/help', async (message, replyMessage, roomId) => {
      const helpText = \`Available commands:
/start - Start the bot
/help - Show this help message
/price <symbol> - Get current price
/portfolio - View portfolio summary
/alerts - Manage price alerts\`;
      
      await agent.sendConnectionMessage(roomId, helpText);
    });

    agent.addCommand('/price', async (message, replyMessage, roomId) => {
      const symbol = message.body.m?.body?.split(' ')[1] || 'BTC';
      const price = await tradingAssistant.getPrice(symbol);
      await agent.sendConnectionMessage(roomId, \`\${symbol.toUpperCase()}: $\${price}\`);
    });

    agent.addCommand('/portfolio', async (message, replyMessage, roomId) => {
      const portfolio = await tradingAssistant.getPortfolioSummary();
      await agent.sendConnectionMessage(roomId, portfolio);
    });

    // Initialize and start listening
    await agent.initialize();
    console.log('${config.name} is running...');
    
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
  async getPrice(symbol: string): Promise<string> {
    // Implement price fetching logic here
    // This is a mock implementation
    const mockPrices: { [key: string]: number } = {
      BTC: 65000,
      ETH: 3200,
      ADA: 0.45,
    };
    
    return (mockPrices[symbol.toUpperCase()] || 0).toLocaleString();
  }

  async getPortfolioSummary(): Promise<string> {
    // Implement portfolio summary logic
    return 'Portfolio Summary:\\nTotal Value: $10,000\\nBTC: 0.1 ($6,500)\\nETH: 1.0 ($3,200)\\nCash: $300';
  }

  async setPriceAlert(symbol: string, price: number): Promise<void> {
    // Implement price alert logic
    console.log(\`Price alert set for \${symbol} at $\${price}\`);
  }
}
`,
    },
  ];
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
API_BASE_URL=https://api.superdapp.com
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
