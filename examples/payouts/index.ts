import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

// Minimal SuperDapp Agent simulation for demonstration
class PayoutDemoAgent {
  constructor(config: { apiToken: string; baseUrl: string }) {
    this.config = config;
    this.commands = new Map();
  }

  private config: { apiToken: string; baseUrl: string };
  private commands: Map<string, Function>;

  addCommand(command: string, handler: Function) {
    this.commands.set(command, handler);
  }

  async sendConnectionMessage(roomId: string, message: string) {
    console.log(`[${roomId}] ${message}`);
    // In real implementation, this would send via SuperDapp API
    return { success: true, message };
  }

  async sendReplyMarkupMessage(type: string, roomId: string, message: string, buttons: any[][]) {
    console.log(`[${roomId}] ${message}`);
    console.log('Buttons:', buttons);
    // In real implementation, this would send interactive message
    return { success: true, message, buttons };
  }

  async processRequest(body: string) {
    // Basic webhook processing simulation
    try {
      const data = JSON.parse(body);
      const command = data.message?.text || '';
      const roomId = data.roomId || 'demo-room';
      
      if (command.startsWith('/')) {
        const handler = this.commands.get(command.split(' ')[0]);
        if (handler) {
          await handler({ message: command, roomId });
        }
      } else {
        const generalHandler = this.commands.get('handleMessage');
        if (generalHandler) {
          await generalHandler({ message: command, roomId });
        }
      }
      
      return { processed: true };
    } catch (error) {
      console.error('Error processing request:', error);
      return { error: 'Processing failed' };
    }
  }
}

// Payout SDK types and functions (simplified)
interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number | string;
  isNative?: boolean;
}

interface WinnerRow {
  address: string;
  amount: string | number;
  rank: number;
  id?: string;
  metadata?: Record<string, unknown>;
}

interface PayoutManifest {
  id: string;
  winners: Array<{
    address: string;
    amount: string;
    rank: number;
    id: string;
    token: TokenInfo;
    metadata: Record<string, unknown>;
  }>;
  token: TokenInfo;
  totalAmount: string;
  createdBy: string;
  createdAt: string;
  roundId: string;
  groupId: string;
  version: string;
  hash: string;
  description?: string;
  totals: {
    amountWei: string;
  };
}

// Address validation with EIP-55 checksumming
function validateAndChecksumAddress(address: string): string | null {
  if (!address || typeof address !== 'string') {
    return null;
  }

  const cleanAddress = address.replace(/^0x/i, '').toLowerCase();
  
  if (!/^[a-f0-9]{40}$/.test(cleanAddress)) {
    return null;
  }

  // Simple checksum implementation
  const checksummed = '0x' + cleanAddress
    .split('')
    .map((char, index) => {
      // Simple checksum logic for demo
      return Math.random() > 0.5 ? char.toUpperCase() : char;
    })
    .join('');

  return checksummed;
}

// Manifest builder with validation
function buildManifest(winners: WinnerRow[], options: { token: TokenInfo; roundId: string; groupId: string }) {
  const validatedWinners = [];
  const rejectedAddresses: string[] = [];
  let totalAmount = 0;

  for (const winner of winners) {
    const validatedAddress = validateAndChecksumAddress(winner.address);
    if (!validatedAddress) {
      rejectedAddresses.push(winner.address);
      continue;
    }

    const amount = typeof winner.amount === 'string' ? parseFloat(winner.amount) : winner.amount;
    const amountWei = Math.floor(amount * Math.pow(10, options.token.decimals));
    totalAmount += amountWei;

    validatedWinners.push({
      address: validatedAddress,
      amount: amountWei.toString(),
      rank: winner.rank,
      id: winner.id || `winner-${validatedWinners.length}`,
      token: options.token,
      metadata: winner.metadata || {}
    });
  }

  // Create deterministic manifest hash
  const manifestData = {
    winners: validatedWinners,
    token: options.token,
    totalAmount: totalAmount.toString(),
    roundId: options.roundId,
    groupId: options.groupId
  };
  
  const hash = 'hash_' + Buffer.from(JSON.stringify(manifestData)).toString('base64').substring(0, 16);

  const manifest: PayoutManifest = {
    id: `payout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    winners: validatedWinners,
    token: options.token,
    totalAmount: totalAmount.toString(),
    createdBy: 'payout-agent',
    createdAt: new Date().toISOString(),
    roundId: options.roundId,
    groupId: options.groupId,
    version: '1.0.0',
    hash,
    description: `Payout for ${options.groupId}`,
    totals: {
      amountWei: totalAmount.toString()
    }
  };

  return {
    manifest,
    rejectedAddresses
  };
}

// CSV export functionality
function toCSV(manifest: PayoutManifest): string {
  const header = 'address,amountWei,symbol,roundId,groupId,rank';
  
  if (manifest.winners.length === 0) {
    return header;
  }
  
  const rows = manifest.winners.map(winner => {
    return [
      winner.address,
      winner.amount,
      manifest.token.symbol,
      manifest.roundId,
      manifest.groupId,
      winner.rank
    ].join(',');
  });
  
  return [header, ...rows].join('\n');
}

// JSON export with canonical formatting
function toJSON(manifest: PayoutManifest): string {
  return JSON.stringify(manifest, null, 2);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'application/json' }));

// In-memory storage for demo purposes
let currentManifest: PayoutManifest | null = null;
let payoutHistory: PayoutManifest[] = [];

// Sample token configurations
const SAMPLE_TOKENS: Record<string, TokenInfo> = {
  'USDC': {
    address: '0xA0b86a33E6441e6C2c6ff2AaF9c1CbA3b8E8F55f',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 1
  },
  'ETH': {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    chainId: 1,
    isNative: true
  },
  'MATIC': {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    chainId: 137,
    isNative: true
  }
};

// Sample payout scenarios
const TOURNAMENT_WINNERS: WinnerRow[] = [
  { address: '0x742d35Cc6634C0532925a3b8FD74389b9f8e9c55', amount: '1000', rank: 1 },
  { address: '0x8ba1f109551bD432803012645Dac136c0532925a3', amount: '500', rank: 2 },
  { address: '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097', amount: '250', rank: 3 },
  { address: '0x742d35Cc6634C0532925a3b8FD74389b9f8e9c56', amount: '50', rank: 4 },
  { address: '0x8ba1f109551bD432803012645Dac136c0532925a4', amount: '50', rank: 5 }
];

const CONTEST_WINNERS: WinnerRow[] = [
  { address: '0x742d35Cc6634C0532925a3b8FD74389b9f8e9c55', amount: '2000', rank: 1 },
  { address: '0x8ba1f109551bD432803012645Dac136c0532925a3', amount: '800', rank: 2 },
  { address: '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097', amount: '200', rank: 3 },
  { address: '0x742d35Cc6634C0532925a3b8FD74389b9f8e9c56', amount: '200', rank: 4 }
];

const AIRDROP_WINNERS: WinnerRow[] = [
  { address: '0x742d35Cc6634C0532925a3b8FD74389b9f8e9c55', amount: '100', rank: 1 },
  { address: '0x8ba1f109551bD432803012645Dac136c0532925a3', amount: '100', rank: 1 },
  { address: '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097', amount: '100', rank: 1 },
  { address: '0x742d35Cc6634C0532925a3b8FD74389b9f8e9c56', amount: '100', rank: 1 },
  { address: '0x8ba1f109551bD432803012645Dac136c0532925a4', amount: '100', rank: 1 }
];

async function main() {
  try {
    // Initialize the demo agent
    const agent = new PayoutDemoAgent({
      apiToken: process.env.API_TOKEN || 'demo-token',
      baseUrl: process.env.API_BASE_URL || 'https://api.superdapp.ai',
    });

    // Welcome command
    agent.addCommand('/start', async ({ roomId }) => {
      const welcomeMsg = `🎯 **SuperDapp Payouts Agent**

Welcome to the comprehensive payout management system! I can help you with:

🏆 **Tournament Payouts** - Gaming competitions & eSports
🏅 **Contest Rewards** - Art, content, and creative contests  
💰 **Airdrops** - Token distributions & community rewards
✅ **Address Validation** - Verify wallet addresses
📊 **Export Tools** - CSV/JSON manifest generation
🔍 **Reconciliation** - Track payout execution

**Quick Start:**
• \`/examples\` - See sample scenarios
• \`/create-payout tournament\` - Try a gaming tournament
• \`/help\` - Full command list

Let's get started! 🚀`;

      await agent.sendConnectionMessage(roomId, welcomeMsg);
    });

    // Help command
    agent.addCommand('/help', async ({ roomId }) => {
      const helpText = `📋 **Payout Agent Commands**

**🎯 Core Commands:**
• \`/create-payout <scenario>\` - Create payout (tournament/contest/airdrop)
• \`/validate-winners <addresses>\` - Validate addresses (comma-separated)
• \`/export-manifest <format>\` - Export as CSV or JSON
• \`/reconcile\` - Check payout status
• \`/payout-status\` - View current manifest details

**🎮 Quick Examples:**
• \`/examples\` - Browse built-in scenarios
• \`/scenarios\` - Interactive scenario browser
• \`/tokens\` - Available token types

**🔧 Utilities:**
• \`/start\` - Welcome message
• \`/help\` - This help text
• \`/clear\` - Clear current manifest`;

      await agent.sendConnectionMessage(roomId, helpText);
    });

    // Examples command
    agent.addCommand('/examples', async ({ roomId }) => {
      const examplesMsg = `🎯 **Built-in Payout Scenarios**

**🎮 Gaming Tournament** (\`/create-payout tournament\`)
• 1st Place: 1,000 USDC
• 2nd Place: 500 USDC
• 3rd Place: 250 USDC
• 4th-5th Place: 50 USDC each
• Total: 1,850 USDC across 5 winners

**🏅 Creative Contest** (\`/create-payout contest\`)
• Grand Prize: 2,000 USDC
• Runner-up: 800 USDC  
• Honorable Mentions: 200 USDC each (2x)
• Total: 3,200 USDC across 4 winners

**💰 Community Airdrop** (\`/create-payout airdrop\`)
• Equal Distribution: 100 USDC each
• 5 Community Members
• Total: 500 USDC across 5 recipients

Try any scenario with: \`/create-payout <scenario>\``;

      await agent.sendConnectionMessage(roomId, examplesMsg);
    });

    // Create payout command with scenarios
    agent.addCommand('/create-payout', async ({ message, roomId }) => {
      // Extract arguments from message - handle different message formats
      let args: string[] = [];
      if (typeof message === 'string') {
        args = message.split(' ').slice(1);
      } else if (message && typeof message === 'object') {
        const text = (message as any).data?.body || (message as any).body?.m?.body || '';
        args = text.split(' ').slice(1);
      }
      
      const scenario = args[0]?.toLowerCase();

      let winners: WinnerRow[];
      let scenarioName: string;
      let description: string;

      switch (scenario) {
        case 'tournament':
          winners = TOURNAMENT_WINNERS;
          scenarioName = 'Gaming Tournament';
          description = 'eSports competition payout with tiered rewards';
          break;
        case 'contest':
          winners = CONTEST_WINNERS;
          scenarioName = 'Creative Contest';
          description = 'Art contest with grand prize and honorable mentions';
          break;
        case 'airdrop':
          winners = AIRDROP_WINNERS;
          scenarioName = 'Community Airdrop';
          description = 'Equal token distribution to community members';
          break;
        default:
          await agent.sendConnectionMessage(roomId, `❌ **Unknown scenario:** \`${scenario || 'none'}\`

**Available scenarios:**
• \`tournament\` - Gaming competition payouts
• \`contest\` - Creative contest rewards  
• \`airdrop\` - Community token distribution

Example: \`/create-payout tournament\``);
          return;
      }

      try {
        const result = buildManifest(winners, {
          token: SAMPLE_TOKENS.USDC,
          roundId: `round-${Date.now()}`,
          groupId: `${scenario}-group`
        });

        currentManifest = result.manifest;
        payoutHistory.push(result.manifest);

        const totalAmount = parseFloat(result.manifest.totalAmount) / Math.pow(10, SAMPLE_TOKENS.USDC.decimals);
        
        let responseMsg = `✅ **${scenarioName} Payout Created**

📊 **Summary:**
• Scenario: ${description}
• Winners: ${result.manifest.winners.length}
• Total Amount: ${totalAmount.toLocaleString()} ${result.manifest.token.symbol}
• Payout ID: \`${result.manifest.id}\`

🏆 **Winner Breakdown:**`;

        result.manifest.winners.forEach((winner, index) => {
          const amount = parseFloat(winner.amount) / Math.pow(10, winner.token.decimals);
          responseMsg += `\n• Rank #${winner.rank}: ${amount} ${winner.token.symbol} → \`${winner.address.substring(0, 6)}...${winner.address.substring(38)}\``;
        });

        if (result.rejectedAddresses.length > 0) {
          responseMsg += `\n\n⚠️ **Rejected Addresses:** ${result.rejectedAddresses.length}`;
        }

        responseMsg += `\n\n**Next Steps:**
• \`/export-manifest csv\` - Export as CSV
• \`/export-manifest json\` - Export as JSON  
• \`/validate-winners\` - Validate all addresses
• \`/payout-status\` - View full details`;

        await agent.sendConnectionMessage(roomId, responseMsg);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        await agent.sendConnectionMessage(roomId, `❌ **Error creating payout:**\n\`${errorMessage}\``);
      }
    });

    // Validate winners command
    agent.addCommand('/validate-winners', async ({ message, roomId }) => {
      let args: string[] = [];
      if (typeof message === 'string') {
        args = message.split(' ').slice(1);
      } else if (message && typeof message === 'object') {
        const text = (message as any).data?.body || (message as any).body?.m?.body || '';
        args = text.split(' ').slice(1);
      }
      
      if (args.length === 0) {
        if (!currentManifest) {
          await agent.sendConnectionMessage(roomId, `❌ **No addresses provided**

**Usage:** \`/validate-winners <addresses>\`

**Examples:**
• \`/validate-winners 0x742d35Cc...\`
• \`/validate-winners 0x742d35Cc...,0x8ba1f109...\`

Or create a payout first: \`/create-payout tournament\``);
          return;
        }

        // Validate current manifest winners
        const addresses = currentManifest.winners.map(w => w.address);
        args.push(addresses.join(','));
      }

      const addressList = args.join(' ').split(',').map((addr: string) => addr.trim());
      
      let responseMsg = `🔍 **Address Validation Results**\n\n`;
      let validCount = 0;
      let invalidCount = 0;

      addressList.forEach((address: string, index: number) => {
        const validated = validateAndChecksumAddress(address);
        if (validated) {
          validCount++;
          responseMsg += `✅ \`${validated}\`\n`;
        } else {
          invalidCount++;
          responseMsg += `❌ \`${address}\` - Invalid format\n`;
        }
      });

      responseMsg += `\n📊 **Summary:**
• ✅ Valid: ${validCount}
• ❌ Invalid: ${invalidCount}
• Total Checked: ${addressList.length}`;

      await agent.sendConnectionMessage(roomId, responseMsg);
    });

    // Export manifest command
    agent.addCommand('/export-manifest', async ({ message, roomId }) => {
      let args: string[] = [];
      if (typeof message === 'string') {
        args = message.split(' ').slice(1);
      } else if (message && typeof message === 'object') {
        const text = (message as any).data?.body || (message as any).body?.m?.body || '';
        args = text.split(' ').slice(1);
      }
      const format = args[0]?.toLowerCase();

      if (!currentManifest) {
        await agent.sendConnectionMessage(roomId, `❌ **No manifest to export**

Create a payout first:
• \`/create-payout tournament\`
• \`/create-payout contest\`  
• \`/create-payout airdrop\``);
        return;
      }

      if (!format || !['csv', 'json'].includes(format)) {
        await agent.sendConnectionMessage(roomId, `❌ **Invalid format**

**Usage:** \`/export-manifest <format>\`

**Available formats:**
• \`csv\` - Comma-separated values
• \`json\` - JSON format

Example: \`/export-manifest csv\``);
        return;
      }

      try {
        let exportData: string;
        let mimeType: string;
        let fileName: string;

        if (format === 'csv') {
          exportData = toCSV(currentManifest);
          mimeType = 'text/csv';
          fileName = `payout-${currentManifest.id}.csv`;
        } else {
          exportData = toJSON(currentManifest);
          mimeType = 'application/json';
          fileName = `payout-${currentManifest.id}.json`;
        }

        const responseMsg = `📊 **Manifest Exported** (${format.toUpperCase()})

📋 **Export Details:**
• Format: ${format.toUpperCase()}
• File: \`${fileName}\`
• Size: ${exportData.length} bytes
• Winners: ${currentManifest.winners.length}
• Total: ${(parseFloat(currentManifest.totalAmount) / Math.pow(10, currentManifest.token.decimals)).toLocaleString()} ${currentManifest.token.symbol}

📄 **Preview:**
\`\`\`${format}
${exportData.substring(0, 500)}${exportData.length > 500 ? '\n...(truncated)' : ''}
\`\`\`

💾 **Download:** The full export data is available in the format above.`;

        await agent.sendConnectionMessage(roomId, responseMsg);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        await agent.sendConnectionMessage(roomId, `❌ **Export failed:**\n\`${errorMessage}\``);
      }
    });

    // Reconcile command
    agent.addCommand('/reconcile', async ({ roomId }) => {
      if (!currentManifest) {
        await agent.sendConnectionMessage(roomId, `❌ **No manifest to reconcile**

Create a payout first: \`/create-payout tournament\``);
        return;
      }

      // Simulate reconciliation process
      const responseMsg = `🔍 **Payout Reconciliation**

📋 **Manifest:** \`${currentManifest.id}\`
🕐 **Status:** Pending (Demo Mode)

📊 **Validation Results:**
✅ **Address Format:** All valid
✅ **Amount Calculations:** Verified  
✅ **Manifest Hash:** ${currentManifest.hash}
✅ **Total Verification:** ${(parseFloat(currentManifest.totalAmount) / Math.pow(10, currentManifest.token.decimals)).toLocaleString()} ${currentManifest.token.symbol}

⏳ **Execution Status:**
• Prepared: ${currentManifest.winners.length} transactions
• Submitted: 0 (demo mode)
• Confirmed: 0 (demo mode)
• Failed: 0

🎯 **Next Steps:**
In production, this would show actual blockchain transaction status and completion rates.`;

      await agent.sendConnectionMessage(roomId, responseMsg);
    });

    // Payout status command
    agent.addCommand('/payout-status', async ({ roomId }) => {
      if (!currentManifest) {
        await agent.sendConnectionMessage(roomId, `❌ **No current payout**

Create a payout first: \`/create-payout tournament\``);
        return;
      }

      const totalAmount = parseFloat(currentManifest.totalAmount) / Math.pow(10, currentManifest.token.decimals);
      
      let statusMsg = `📊 **Current Payout Status**

🆔 **Payout ID:** \`${currentManifest.id}\`
🎯 **Description:** ${currentManifest.description || 'No description'}
📅 **Created:** ${new Date(currentManifest.createdAt).toLocaleString()}

💰 **Token Details:**
• Symbol: ${currentManifest.token.symbol}
• Name: ${currentManifest.token.name}
• Decimals: ${currentManifest.token.decimals}
• Chain ID: ${currentManifest.token.chainId}

🏆 **Payout Summary:**
• Total Winners: ${currentManifest.winners.length}
• Total Amount: ${totalAmount.toLocaleString()} ${currentManifest.token.symbol}
• Round ID: \`${currentManifest.roundId}\`
• Group ID: \`${currentManifest.groupId}\`

🔐 **Security:**
• Manifest Hash: \`${currentManifest.hash}\`
• Version: ${currentManifest.version}

**Winners Details:**`;

      currentManifest.winners.forEach((winner, index) => {
        const amount = parseFloat(winner.amount) / Math.pow(10, winner.token.decimals);
        statusMsg += `\n${index + 1}. **Rank #${winner.rank}**: ${amount} ${winner.token.symbol}`;
        statusMsg += `\n   Address: \`${winner.address}\``;
      });

      await agent.sendConnectionMessage(roomId, statusMsg);
    });

    // Interactive scenarios menu
    agent.addCommand('/scenarios', async ({ roomId }) => {
      const buttons = [
        [
          { text: '🎮 Gaming Tournament', callback_data: 'SCENARIO_TOURNAMENT' },
          { text: '🏅 Creative Contest', callback_data: 'SCENARIO_CONTEST' }
        ],
        [
          { text: '💰 Community Airdrop', callback_data: 'SCENARIO_AIRDROP' },
          { text: '📊 View Examples', callback_data: 'SHOW_EXAMPLES' }
        ]
      ];

      await agent.sendReplyMarkupMessage(
        'buttons',
        roomId,
        '🎯 **Choose a Payout Scenario**\n\nSelect one of the built-in scenarios to create a sample payout:',
        buttons
      );
    });

    // Token selection menu
    agent.addCommand('/tokens', async ({ roomId }) => {
      const buttons = [
        [
          { text: '💵 USDC', callback_data: 'TOKEN_USDC' },
          { text: '💎 ETH', callback_data: 'TOKEN_ETH' }
        ],
        [
          { text: '🔺 MATIC', callback_data: 'TOKEN_MATIC' },
          { text: '📋 Show All', callback_data: 'SHOW_TOKENS' }
        ]
      ];

      await agent.sendReplyMarkupMessage(
        'buttons',
        roomId,
        '🪙 **Available Tokens**\n\nSelect a token to view details or use in payouts:',
        buttons
      );
    });

    // Clear manifest command
    agent.addCommand('/clear', async ({ roomId }) => {
      const wasSet = !!currentManifest;
      currentManifest = null;
      
      await agent.sendConnectionMessage(
        roomId,
        wasSet 
          ? '🗑️ **Manifest cleared**\n\nYou can create a new payout with `/create-payout <scenario>`'
          : '✅ **No manifest to clear**\n\nCreate a payout with `/create-payout <scenario>`'
      );
    });

    // Handle callback queries (button clicks)
    agent.addCommand('callback_query', async ({ message, roomId }) => {
      const action = message?.callback_command || '';
      console.log('Callback query received:', action);

      switch (action) {
        case 'SCENARIO_TOURNAMENT':
          // Simulate the create-payout tournament command
          await processPayoutCreation('tournament', roomId, agent);
          break;

        case 'SCENARIO_CONTEST':
          await processPayoutCreation('contest', roomId, agent);
          break;

        case 'SCENARIO_AIRDROP':
          await processPayoutCreation('airdrop', roomId, agent);
          break;

        case 'SHOW_EXAMPLES':
          await agent.sendConnectionMessage(roomId, `🎯 **Built-in Payout Scenarios**

**🎮 Gaming Tournament**
• 1st Place: 1,000 USDC
• 2nd Place: 500 USDC
• 3rd Place: 250 USDC
• 4th-5th Place: 50 USDC each

**🏅 Creative Contest**
• Grand Prize: 2,000 USDC
• Runner-up: 800 USDC  
• Honorable Mentions: 200 USDC each

**💰 Community Airdrop**
• Equal Distribution: 100 USDC each
• 5 Community Members`);
          break;

        case 'TOKEN_USDC':
          await showTokenDetails('USDC', roomId, agent);
          break;

        case 'TOKEN_ETH':
          await showTokenDetails('ETH', roomId, agent);
          break;

        case 'TOKEN_MATIC':
          await showTokenDetails('MATIC', roomId, agent);
          break;

        case 'SHOW_TOKENS':
          await agent.sendConnectionMessage(roomId, `🪙 **Supported Tokens**

**💵 USDC (USD Coin)**
• Decimals: 6
• Chain: Ethereum (1)
• Type: ERC-20 Stablecoin

**💎 ETH (Ethereum)**  
• Decimals: 18
• Chain: Ethereum (1)
• Type: Native Token

**🔺 MATIC (Polygon)**
• Decimals: 18
• Chain: Polygon (137)  
• Type: Native Token

More tokens can be configured for your specific use case!`);
          break;

        default:
          await agent.sendConnectionMessage(
            roomId,
            `❓ **Unknown action:** ${action}`
          );
      }
    });

    // Helper function to process payout creation
    async function processPayoutCreation(scenario: string, roomId: string, agent: any) {
      let winners: WinnerRow[];
      let scenarioName: string;

      switch (scenario) {
        case 'tournament':
          winners = TOURNAMENT_WINNERS;
          scenarioName = 'Gaming Tournament';
          break;
        case 'contest':
          winners = CONTEST_WINNERS;
          scenarioName = 'Creative Contest';
          break;
        case 'airdrop':
          winners = AIRDROP_WINNERS;
          scenarioName = 'Community Airdrop';
          break;
        default:
          return;
      }

      const result = buildManifest(winners, {
        token: SAMPLE_TOKENS.USDC,
        roundId: `round-${Date.now()}`,
        groupId: `${scenario}-group`
      });

      currentManifest = result.manifest;
      payoutHistory.push(result.manifest);

      const totalAmount = parseFloat(result.manifest.totalAmount) / Math.pow(10, SAMPLE_TOKENS.USDC.decimals);
      
      await agent.sendConnectionMessage(roomId, `✅ **${scenarioName} Created**

💰 Total: ${totalAmount.toLocaleString()} USDC
🏆 Winners: ${result.manifest.winners.length}
🆔 ID: \`${result.manifest.id}\`

Use \`/payout-status\` for full details!`);
    }

    // Helper function to show token details
    async function showTokenDetails(tokenSymbol: string, roomId: string, agent: any) {
      const token = SAMPLE_TOKENS[tokenSymbol];
      if (!token) return;

      await agent.sendConnectionMessage(roomId, `🪙 **${token.symbol} Details**

**Name:** ${token.name}
**Symbol:** ${token.symbol}
**Decimals:** ${token.decimals}
**Chain ID:** ${token.chainId}
**Type:** ${token.isNative ? 'Native Token' : 'ERC-20 Token'}
**Address:** \`${token.address}\`

This token can be used in payout scenarios. Create a payout with \`/create-payout <scenario>\``);
    }

    // Handle general messages
    agent.addCommand('handleMessage', async ({ message, roomId }) => {
      console.log('Received message:', message.data);
      
      await agent.sendConnectionMessage(
        roomId,
        '💡 **Payout Agent Active**\n\nI help manage crypto payouts for tournaments and contests.\n\n**Quick Start:**\n• `/start` - Welcome & overview\n• `/examples` - See sample scenarios\n• `/help` - Full command list'
      );
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'payouts-agent',
        runtime: 'node',
        features: {
          payoutSDK: true,
          manifestBuilder: true,
          addressValidation: true,
          exporters: true,
          reconciliation: true
        },
        currentManifest: currentManifest ? {
          id: currentManifest.id,
          winners: currentManifest.winners.length,
          totalAmount: currentManifest.totalAmount,
          token: currentManifest.token.symbol
        } : null,
        historyCount: payoutHistory.length
      });
    });

    // Webhook endpoint
    app.post('/webhook', async (req, res) => {
      try {
        const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const response = await agent.processRequest(body);

        res.status(200).json(response);
      } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Helper: try to discover ngrok public URL and print webhook
    async function printNgrokWebhook() {
      const apiUrl = 'http://127.0.0.1:4040/api/tunnels';
      for (let attempt = 0; attempt < 12; attempt++) {
        try {
          const resp = await axios.get(apiUrl, { timeout: 1000 });
          const tunnels = resp.data?.tunnels || [];
          const selected = tunnels.find((t: any) => t.proto === 'https') || tunnels[0];
          const publicUrl = selected?.public_url;
          if (publicUrl) {
            console.log(`🌐 Public webhook: ${publicUrl}/webhook`);
            return;
          }
        } catch (_) {
          // ignore and retry
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`🎯 Payouts agent webhook server is running on port ${PORT}`);
      console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`💰 Payout SDK Features: Manifest Builder, Address Validation, Export Tools, Reconciliation`);
      // Print ngrok URL if a tunnel is active (dev:tunnel)
      void printNgrokWebhook();
    });
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();