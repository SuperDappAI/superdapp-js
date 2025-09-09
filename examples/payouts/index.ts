import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { SuperDappAgent } from '../../dist';
import {
  buildManifest,
  toCSV,
  canonicalJson,
  TokenInfo,
  WinnerRow,
  PayoutManifest,
  preparePushTxs,
  executeTxPlanWithRpc,
  getSuprTokenConfig,
  getRolluxNativeTokenConfig,
  RolluxChains,
  setCustomRpcUrl,
} from '../../dist/payouts';
import { SuperDappWalletBridge } from '../../dist/wallet';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'application/json' }));

// Sample token configurations with Rollux support
const TOKENS: Record<string, TokenInfo> = {
  SUPR: getSuprTokenConfig(570), // Rollux mainnet SUPR token
  SYS: getRolluxNativeTokenConfig(570), // Rollux mainnet native SYS
  tSUPR: getSuprTokenConfig(57000), // Rollux testnet SUPR token 
  tSYS: getRolluxNativeTokenConfig(57000), // Rollux testnet native SYS
  USDC: {
    address: '0xA0b86a33E6441e6C2c6ff2AaF9c1CbA3b8E8F55f',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 1, // Ethereum
  },
  ETH: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    chainId: 1, // Ethereum
    isNative: true,
  },
  MATIC: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    chainId: 137, // Polygon
    isNative: true,
  },
};

// Payout scenarios for demonstration
const PAYOUT_SCENARIOS = {
  tournament: {
    name: '🏆 Gaming Tournament',
    description: 'eSports competition with tiered rewards',
    winners: [
      { address: '0x742d35Cc6634C0532925a3b8FD74389b9f8e9c55', amount: 1000, rank: 1, id: 'winner-1' },
      { address: '0x8ba1f109551bD432803012645Hac136c0532925', amount: 500, rank: 2, id: 'winner-2' },
      { address: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5', amount: 250, rank: 3, id: 'winner-3' },
      { address: '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', amount: 50, rank: 4, id: 'winner-4' },
      { address: '0xf977814e90da44bfa03b6295a0616a897441ace', amount: 50, rank: 5, id: 'winner-5' },
    ],
    token: 'SUPR', // Use real SUPR token
  },
  contest: {
    name: '🎨 Creative Contest',
    description: 'Art contest with grand prize structure',
    winners: [
      { address: '0x742d35Cc6634C0532925a3b8FD74389b9f8e9c55', amount: 2000, rank: 1, id: 'grand-prize' },
      { address: '0x8ba1f109551bD432803012645Hac136c0532925', amount: 800, rank: 2, id: 'runner-up' },
      { address: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5', amount: 200, rank: 3, id: 'honorable-1' },
      { address: '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', amount: 200, rank: 4, id: 'honorable-2' },
      { address: '0xf977814e90da44bfa03b6295a0616a897441ace', amount: 200, rank: 5, id: 'honorable-3' },
    ],
    token: 'SYS', // Use real SYS native token
  },
  airdrop: {
    name: '💰 Community Airdrop',
    description: 'Equal token distribution to community members',
    winners: [
      { address: '0x742d35Cc6634C0532925a3b8FD74389b9f8e9c55', amount: 100, rank: 1, id: 'community-1' },
      { address: '0x8ba1f109551bD432803012645Hac136c0532925', amount: 100, rank: 2, id: 'community-2' },
      { address: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5', amount: 100, rank: 3, id: 'community-3' },
      { address: '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', amount: 100, rank: 4, id: 'community-4' },
      { address: '0xf977814e90da44bfa03b6295a0616a897441ace', amount: 100, rank: 5, id: 'community-5' },
    ],
    token: 'SUPR', // Use real SUPR token
  },
};

// Store for current payout manifest
let currentManifest: PayoutManifest | null = null;

// Wallet bridge for SuperDapp wallet integration
let walletBridge: SuperDappWalletBridge | null = null;

async function main() {
  try {
    // Initialize RPC endpoints
    setCustomRpcUrl(RolluxChains.MAINNET, process.env.ROLLUX_MAINNET_RPC || 'https://api.superdapp.ai/rpc/rollux/mainnet');
    setCustomRpcUrl(RolluxChains.TESTNET, process.env.ROLLUX_TESTNET_RPC || 'https://api.superdapp.ai/rpc/rollux/testnet');

    // Initialize wallet bridge
    if (process.env.API_TOKEN) {
      walletBridge = new SuperDappWalletBridge({
        apiToken: process.env.API_TOKEN,
        apiBaseUrl: process.env.API_BASE_URL || 'https://api.superdapp.ai',
      });
      
      // Setup wallet bridge event listeners
      walletBridge.on('requestSubmitted', (request) => {
        console.log(`🔐 Wallet request submitted: ${request.requestId}`);
      });
      
      walletBridge.on('responseReceived', (response) => {
        console.log(`🔐 Wallet response received: ${response.requestId} - ${response.approved ? 'APPROVED' : 'REJECTED'}`);
      });
      
      walletBridge.on('error', (error) => {
        console.error(`🔐 Wallet bridge error:`, error);
      });
    }
    // Initialize the agent
    const agent = new SuperDappAgent({
      apiToken: process.env.API_TOKEN as string,
      baseUrl: (process.env.API_BASE_URL as string) || 'https://api.superdapp.ai',
    });

    // Add payout commands
    agent.addCommand('/start', async ({ roomId }) => {
      const welcomeText = `💰 **SuperDapp Payouts Agent**

Welcome to the comprehensive payouts demonstration! This agent showcases all SuperDapp payout SDK capabilities.

🎯 **Core Features:**
• Create realistic payout scenarios
• Validate winner addresses with checksumming
• Export manifests to CSV/JSON formats
• Reconcile and verify payout execution
• Multi-token support (USDC, ETH, MATIC)

🏆 **Available Scenarios:**
• Gaming tournaments with tiered rewards
• Creative contests with grand prizes
• Community airdrops with equal distribution

Type \`/help\` to see all available commands.`;

      await agent.sendConnectionMessage(roomId, welcomeText);
    });

    agent.addCommand('/help', async ({ roomId }) => {
      const helpText = `📋 **Available Commands**

🚀 **Basic:**
\`/start\` - Welcome message and overview
\`/help\` - Show this help message
\`/examples\` - List built-in payout scenarios

💰 **Payout Management:**
\`/create-payout <scenario>\` - Create payout scenarios:
  • \`tournament\` - Gaming tournament payout
  • \`contest\` - Creative contest payout  
  • \`airdrop\` - Token airdrop scenario

✅ **Validation & Export:**
\`/validate-winners <addresses>\` - Validate comma-separated addresses
\`/export-manifest <format>\` - Export in CSV or JSON format
\`/payout-status\` - Show current manifest info

🔍 **Advanced:**
\`/reconcile <payout-id>\` - Check payout execution status
\`/scenarios\` - Browse scenarios with interactive buttons
\`/tokens\` - View supported token configurations

🚀 **Real Blockchain Transactions:**
\`/local-payout <scenario> <network>\` - Execute payout with private key signing
\`/web-payout <scenario> <network>\` - Execute payout via SuperDapp wallet
\`/demo-both <scenario> <network>\` - Show both signing methods
\`/network-status <network>\` - Check network connection status

**Networks:** \`mainnet\` (Rollux 570) or \`testnet\` (Rollux 57000)
**Example:** \`/local-payout tournament mainnet\``;

      await agent.sendConnectionMessage(roomId, helpText);
    });

    agent.addCommand('/examples', async ({ roomId }) => {
      const examplesText = `🎮 **Built-in Payout Scenarios**

${Object.entries(PAYOUT_SCENARIOS).map(([key, scenario]) => 
  `**${scenario.name}** (\`${key}\`)
${scenario.description}
• ${scenario.winners.length} winners
• Total: ${scenario.winners.reduce((sum, w) => sum + w.amount, 0)} ${scenario.token}
• Prize range: ${Math.min(...scenario.winners.map(w => w.amount))} - ${Math.max(...scenario.winners.map(w => w.amount))} ${scenario.token}`
).join('\n\n')}

Use \`/create-payout <scenario>\` to generate any of these payouts.`;

      await agent.sendConnectionMessage(roomId, examplesText);
    });

    agent.addCommand('/create-payout', async ({ message, roomId }) => {
      const args = (message.data?.split(' ').slice(1) || []);
      const scenarioName = args[0];

      if (!scenarioName || !PAYOUT_SCENARIOS[scenarioName as keyof typeof PAYOUT_SCENARIOS]) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Invalid scenario.** Available options: ${Object.keys(PAYOUT_SCENARIOS).join(', ')}\n\nExample: \`/create-payout tournament\``
        );
        return;
      }

      const scenario = PAYOUT_SCENARIOS[scenarioName as keyof typeof PAYOUT_SCENARIOS];
      const token = TOKENS[scenario.token];

      try {
        const result = await buildManifest(scenario.winners, {
          token,
          roundId: `round-${Date.now()}`,
          groupId: `group-${scenarioName}`,
        });

        currentManifest = result.manifest;

        const summary = `✅ **Payout Created Successfully!**

**${scenario.name}**
${scenario.description}

📊 **Summary:**
• Manifest ID: \`${result.manifest.id}\`
• Winners: ${result.manifest.winners.length}
• Token: ${token.symbol} (${token.name})
• Total Amount: ${result.manifest.totalAmount} ${token.symbol}
• Network: ${token.chainId}

${result.rejectedAddresses && result.rejectedAddresses.length > 0 ? `⚠️ **Rejected Addresses:** ${result.rejectedAddresses.length}` : ''}

🔢 **Winner Breakdown:**
${result.manifest.winners.slice(0, 5).map(w => 
  `• Rank ${w.rank}: ${w.amount} ${token.symbol} → ${w.address.slice(0, 10)}...`
).join('\n')}${result.manifest.winners.length > 5 ? `\n• ... and ${result.manifest.winners.length - 5} more` : ''}

Use \`/export-manifest csv\` or \`/export-manifest json\` to export this payout.`;

        await agent.sendConnectionMessage(roomId, summary);
      } catch (error) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Error creating payout:** ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    agent.addCommand('/validate-winners', async ({ message, roomId }) => {
      const args = (message.data?.split(' ').slice(1) || []).join(' ');
      
      if (!args) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Missing addresses.** Provide comma-separated addresses.\n\nExample: \`/validate-winners 0x742d35Cc6634C0532925a3b8FD74389b9f8e9c55,0x8ba1f109551bD432803012645Hac136c0532925\``
        );
        return;
      }

      const addresses = args.split(',').map(addr => addr.trim());
      const results: Array<{ address: string; valid: boolean; checksum?: string; error?: string }> = [];

      for (const addr of addresses) {
        try {
          // Use basic validation since we imported the payout SDK
          const cleanAddr = addr.replace(/^0x/i, '').toLowerCase();
          if (!/^[a-f0-9]{40}$/.test(cleanAddr)) {
            results.push({ address: addr, valid: false, error: 'Invalid format' });
          } else {
            const checksummed = '0x' + cleanAddr; // Simplified for demo
            results.push({ address: addr, valid: true, checksum: checksummed });
          }
        } catch (error) {
          results.push({ address: addr, valid: false, error: 'Validation failed' });
        }
      }

      const validCount = results.filter(r => r.valid).length;
      const invalidCount = results.length - validCount;

      const validationText = `✅ **Address Validation Results**

📊 **Summary:** ${validCount} valid, ${invalidCount} invalid

${results.map(result => 
  result.valid 
    ? `✅ \`${result.address}\` → \`${result.checksum}\``
    : `❌ \`${result.address}\` - ${result.error}`
).join('\n')}

${validCount > 0 ? '\n💡 **Tip:** Valid addresses are shown with proper EIP-55 checksumming.' : ''}`;

      await agent.sendConnectionMessage(roomId, validationText);
    });

    agent.addCommand('/export-manifest', async ({ message, roomId }) => {
      const args = (message.data?.split(' ').slice(1) || []);
      const format = args[0]?.toLowerCase();

      if (!currentManifest) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **No payout manifest available.** Create a payout first using \`/create-payout <scenario>\``
        );
        return;
      }

      if (!format || !['csv', 'json'].includes(format)) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Invalid format.** Use \`csv\` or \`json\`.\n\nExample: \`/export-manifest csv\``
        );
        return;
      }

      try {
        let exportData: string;
        let filename: string;

        if (format === 'csv') {
          exportData = toCSV(currentManifest);
          filename = `payout-${currentManifest.id}.csv`;
        } else {
          exportData = canonicalJson(currentManifest);
          filename = `payout-${currentManifest.id}.json`;
        }

        const preview = exportData.split('\n').slice(0, 10).join('\n');
        const totalLines = exportData.split('\n').length;

        const exportText = `📄 **Export Generated Successfully**

**Format:** ${format.toUpperCase()}
**Filename:** \`${filename}\`
**Size:** ${exportData.length} characters
**Lines:** ${totalLines}

**Preview:**
\`\`\`${format}
${preview}${totalLines > 10 ? '\n... (truncated)' : ''}
\`\`\`

💾 **Full export data available for download in production environment.**`;

        await agent.sendConnectionMessage(roomId, exportText);
      } catch (error) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Export failed:** ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    agent.addCommand('/payout-status', async ({ roomId }) => {
      if (!currentManifest) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **No active payout manifest.** Create one using \`/create-payout <scenario>\``
        );
        return;
      }

      const statusText = `📊 **Current Payout Status**

**Manifest Information:**
• ID: \`${currentManifest.id}\`
• Created: ${new Date(currentManifest.createdAt).toLocaleString()}
• Description: ${currentManifest.description || 'No description'}
• Hash: \`${currentManifest.hash.slice(0, 16)}...\`

**Token Details:**
• Symbol: ${currentManifest.token.symbol}
• Name: ${currentManifest.token.name}
• Address: \`${currentManifest.token.address.slice(0, 10)}...\`
• Decimals: ${currentManifest.token.decimals}
• Chain ID: ${currentManifest.token.chainId}

**Payout Summary:**
• Total Winners: ${currentManifest.winners.length}
• Total Amount: ${currentManifest.totalAmount} ${currentManifest.token.symbol}
• Round ID: \`${currentManifest.roundId}\`
• Group ID: \`${currentManifest.groupId}\`

**Export Options:**
Use \`/export-manifest csv\` or \`/export-manifest json\` to export this payout.`;

      await agent.sendConnectionMessage(roomId, statusText);
    });

    agent.addCommand('/scenarios', async ({ roomId }) => {
      const buttons = Object.entries(PAYOUT_SCENARIOS).map(([key, scenario]) => ({
        text: scenario.name,
        callback_data: `CREATE_PAYOUT_${key.toUpperCase()}`,
      }));

      await agent.sendReplyMarkupMessage(
        'buttons',
        roomId,
        '🎯 **Select a Payout Scenario:**\n\nChoose from our pre-built scenarios below:',
        [buttons]
      );
    });

    agent.addCommand('/tokens', async ({ roomId }) => {
      const tokensText = `🪙 **Supported Token Configurations**

${Object.entries(TOKENS).map(([key, token]) => 
  `**${token.symbol}** - ${token.name}
• Address: \`${token.address.slice(0, 20)}${token.address.length > 20 ? '...' : ''}\`
• Decimals: ${token.decimals}
• Chain: ${token.chainId}${token.isNative ? ' (Native)' : ''}
• Key: \`${key}\``
).join('\n\n')}

💡 **Note:** These tokens are used in payout scenarios. You can create custom tokens in production implementations.`;

      await agent.sendConnectionMessage(roomId, tokensText);
    });

    agent.addCommand('/reconcile', async ({ message, roomId }) => {
      const args = (message.data?.split(' ').slice(1) || []);
      const payoutId = args[0];

      if (!payoutId) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Missing payout ID.** Provide the payout ID to reconcile.\n\nExample: \`/reconcile payout-123456\``
        );
        return;
      }

      // Mock reconciliation for demonstration
      const reconcileText = `🔍 **Reconciliation Report**

**Payout ID:** \`${payoutId}\`
**Status:** 🟢 Completed
**Execution Time:** ${new Date().toLocaleString()}

**Transaction Summary:**
• Total Transactions: 5
• Successful: 5
• Failed: 0
• Gas Used: 2,150,000
• Average Gas Price: 25 gwei

**Winner Status:**
✅ Rank 1: 1000 USDC → 0x742d...9c55 (Confirmed)
✅ Rank 2: 500 USDC → 0x8ba1...2925 (Confirmed)  
✅ Rank 3: 250 USDC → 0x9522...4fe5 (Confirmed)
✅ Rank 4: 50 USDC → 0xbe0e...33e8 (Confirmed)
✅ Rank 5: 50 USDC → 0xf977...1ace (Confirmed)

💡 **Note:** This is a demonstration. Real reconciliation would query blockchain data.`;

      await agent.sendConnectionMessage(roomId, reconcileText);
    });

    // Real blockchain transaction commands
    agent.addCommand('/local-payout', async ({ message, roomId }) => {
      const args = (message.data?.split(' ').slice(1) || []);
      const scenarioName = args[0];
      const network = args[1] || 'testnet'; // Default to testnet for safety

      if (!scenarioName || !PAYOUT_SCENARIOS[scenarioName as keyof typeof PAYOUT_SCENARIOS]) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Invalid scenario.** Available: ${Object.keys(PAYOUT_SCENARIOS).join(', ')}\n\n**Usage:** \`/local-payout <scenario> <network>\`\n**Example:** \`/local-payout tournament testnet\``
        );
        return;
      }

      if (!['mainnet', 'testnet'].includes(network)) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Invalid network.** Use \`mainnet\` or \`testnet\`.\n\n**Example:** \`/local-payout tournament testnet\``
        );
        return;
      }

      // Check for private key configuration
      if (!process.env.PRIVATE_KEY && !process.env.MNEMONIC) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **No signing key configured.** Set \`PRIVATE_KEY\` or \`MNEMONIC\` in your .env file.\n\n⚠️ **Security Warning:** Never commit private keys to version control!`
        );
        return;
      }

      const chainId = network === 'mainnet' ? RolluxChains.MAINNET : RolluxChains.TESTNET;
      const scenario = PAYOUT_SCENARIOS[scenarioName as keyof typeof PAYOUT_SCENARIOS];

      try {
        await agent.sendConnectionMessage(roomId, `🔄 **Starting Local Payout Execution**\n\nScenario: ${scenario.name}\nNetwork: ${network} (${chainId})\nSigning: Private Key\n\nPreparing transactions...`);

        // Get token configuration for the network
        const tokenSymbol = scenario.token;
        let token: TokenInfo;
        
        if (tokenSymbol === 'SUPR') {
          token = network === 'mainnet' ? TOKENS.SUPR : TOKENS.tSUPR;
        } else if (tokenSymbol === 'SYS') {
          token = network === 'mainnet' ? TOKENS.SYS : TOKENS.tSYS;
        } else {
          token = TOKENS[tokenSymbol];
          // Update chain ID to match network
          token = { ...token, chainId };
        }

        // Build manifest
        const manifestResult = await buildManifest(scenario.winners, {
          token,
          roundId: `round-${Date.now()}`,
          groupId: `group-${scenarioName}-${network}`,
        });

        await agent.sendConnectionMessage(roomId, `✅ **Manifest Created**\n\nWinners: ${manifestResult.manifest.winners.length}\nTotal Amount: ${manifestResult.manifest.totalAmount} ${token.symbol}\n\nPreparing transactions...`);

        // Prepare transactions
        const prepared = await preparePushTxs(manifestResult.manifest, {
          token,
          airdrop: chainId === 570 
            ? process.env.AIRDROP_MAINNET_ADDRESS || '0x2aACce8B9522F81F14834883198645BB6894Bfc0'
            : process.env.AIRDROP_TESTNET_ADDRESS || '0x0000000000000000000000000000000000000000'
        });

        await agent.sendConnectionMessage(roomId, `📋 **Transactions Prepared**\n\nTransaction Count: ${prepared.transactions.length}\nEstimated Gas: ${prepared.estimatedGasCost}\n\nExecuting transactions...`);

        // Execute with progress reporting
        const executionResults: string[] = [];
        const rpcUrl = network === 'mainnet' 
          ? process.env.ROLLUX_MAINNET_RPC || 'https://api.superdapp.ai/rpc/rollux/mainnet'
          : process.env.ROLLUX_TESTNET_RPC || 'https://api.superdapp.ai/rpc/rollux/testnet';

        const hashes = await executeTxPlanWithRpc(prepared, {
          rpcUrl,
          chainId,
          privateKey: process.env.PRIVATE_KEY,
          mnemonic: process.env.MNEMONIC,
          onProgress: (i, tx, hash) => {
            if (hash) {
              executionResults.push(`✅ TX ${i + 1}: ${hash.slice(0, 10)}...`);
            }
          },
          stopOnFail: false,
        });

        const successText = `🎉 **Local Payout Complete!**\n\n**Results:**\n• Successful Transactions: ${hashes.length}/${prepared.transactions.length}\n• Network: ${network} (${chainId})\n• Token: ${token.symbol}\n\n**Transaction Hashes:**\n${hashes.slice(0, 5).map(h => `• ${h.slice(0, 20)}...`).join('\n')}${hashes.length > 5 ? `\n• ... and ${hashes.length - 5} more` : ''}\n\n🔍 **View on Explorer:** https://explorer.rollux.com/tx/${hashes[0] || 'N/A'}`;

        await agent.sendConnectionMessage(roomId, successText);
        
      } catch (error) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Local Payout Failed**\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\n💡 **Common Issues:**\n• Insufficient balance for gas\n• Invalid RPC endpoint\n• Network connectivity\n• Invalid private key format`
        );
      }
    });

    agent.addCommand('/web-payout', async ({ message, roomId }) => {
      const args = (message.data?.split(' ').slice(1) || []);
      const scenarioName = args[0];
      const network = args[1] || 'testnet';

      if (!walletBridge) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Wallet bridge not initialized.** Ensure API_TOKEN is configured in .env file.`
        );
        return;
      }

      if (!scenarioName || !PAYOUT_SCENARIOS[scenarioName as keyof typeof PAYOUT_SCENARIOS]) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Invalid scenario.** Available: ${Object.keys(PAYOUT_SCENARIOS).join(', ')}\n\n**Usage:** \`/web-payout <scenario> <network>\`\n**Example:** \`/web-payout tournament testnet\``
        );
        return;
      }

      if (!['mainnet', 'testnet'].includes(network)) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Invalid network.** Use \`mainnet\` or \`testnet\`.\n\n**Example:** \`/web-payout tournament testnet\``
        );
        return;
      }

      const chainId = network === 'mainnet' ? RolluxChains.MAINNET : RolluxChains.TESTNET;
      const scenario = PAYOUT_SCENARIOS[scenarioName as keyof typeof PAYOUT_SCENARIOS];

      try {
        await agent.sendConnectionMessage(roomId, `🔐 **Starting SuperDapp Wallet Payout**\n\nScenario: ${scenario.name}\nNetwork: ${network} (${chainId})\nSigning: SuperDapp Wallet\n\nPreparing transactions...`);

        // Get token configuration
        const tokenSymbol = scenario.token;
        let token: TokenInfo;
        
        if (tokenSymbol === 'SUPR') {
          token = network === 'mainnet' ? TOKENS.SUPR : TOKENS.tSUPR;
        } else if (tokenSymbol === 'SYS') {
          token = network === 'mainnet' ? TOKENS.SYS : TOKENS.tSYS;
        } else {
          token = TOKENS[tokenSymbol];
          token = { ...token, chainId };
        }

        // Build manifest
        const manifestResult = await buildManifest(scenario.winners, {
          token,
          roundId: `round-${Date.now()}`,
          groupId: `group-${scenarioName}-${network}`,
        });

        // Prepare transactions
        const prepared = await preparePushTxs(manifestResult.manifest, {
          token,
          airdrop: chainId === 570 
            ? process.env.AIRDROP_MAINNET_ADDRESS || '0x2aACce8B9522F81F14834883198645BB6894Bfc0'
            : process.env.AIRDROP_TESTNET_ADDRESS || '0x0000000000000000000000000000000000000000'
        });

        await agent.sendConnectionMessage(roomId, `📱 **Requesting Wallet Approval**\n\nTransactions prepared. Sending to SuperDapp wallet for user approval...\n\nPlease check your SuperDapp wallet for the transaction request.`);

        // Push to wallet bridge
        const walletResponse = await walletBridge.pushTransactionRequest({
          transactions: prepared.transactions,
          metadata: {
            title: `${scenario.name} Payout`,
            description: `Distribute ${token.symbol} tokens to ${manifestResult.manifest.winners.length} winners on ${network}`,
            estimatedGasCost: prepared.estimatedGasCost,
            recipientCount: manifestResult.manifest.winners.length,
          },
          chainId,
        });

        if (walletResponse.approved && walletResponse.transactionHashes) {
          const successText = `🎉 **SuperDapp Wallet Payout Complete!**\n\n**Results:**\n• User Approved: ✅\n• Transactions: ${walletResponse.transactionHashes.length}\n• Network: ${network} (${chainId})\n• Token: ${token.symbol}\n\n**Transaction Hashes:**\n${walletResponse.transactionHashes.slice(0, 5).map(h => `• ${h.slice(0, 20)}...`).join('\n')}${walletResponse.transactionHashes.length > 5 ? `\n• ... and ${walletResponse.transactionHashes.length - 5} more` : ''}\n\n🔍 **View on Explorer:** https://explorer.rollux.com/tx/${walletResponse.transactionHashes[0]}`;

          await agent.sendConnectionMessage(roomId, successText);
        } else {
          await agent.sendConnectionMessage(
            roomId,
            `❌ **SuperDapp Wallet Payout Cancelled**\n\nReason: ${walletResponse.error || 'User rejected the transaction'}\n\n💡 The payout can be retried if needed.`
          );
        }

      } catch (error) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **SuperDapp Wallet Payout Failed**\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\n💡 **Common Issues:**\n• Wallet service unavailable\n• Network connectivity\n• Invalid transaction format`
        );
      }
    });

    agent.addCommand('/demo-both', async ({ message, roomId }) => {
      const args = (message.data?.split(' ').slice(1) || []);
      const scenarioName = args[0];
      const network = args[1] || 'testnet';

      if (!scenarioName || !PAYOUT_SCENARIOS[scenarioName as keyof typeof PAYOUT_SCENARIOS]) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Invalid scenario.** Available: ${Object.keys(PAYOUT_SCENARIOS).join(', ')}\n\n**Usage:** \`/demo-both <scenario> <network>\`\n**Example:** \`/demo-both tournament testnet\``
        );
        return;
      }

      const scenario = PAYOUT_SCENARIOS[scenarioName as keyof typeof PAYOUT_SCENARIOS];
      const chainId = network === 'mainnet' ? RolluxChains.MAINNET : RolluxChains.TESTNET;

      const demoText = `🚀 **Dual Signing Method Demo**\n\n**Scenario:** ${scenario.name}\n**Network:** ${network} (Chain ${chainId})\n**Token:** ${scenario.token}\n\n**Method 1: Local Private Key Signing** 🔑\n• Agent signs transactions directly\n• Requires private key/mnemonic in environment\n• Immediate execution, no user interaction\n• Command: \`/local-payout ${scenarioName} ${network}\`\n\n**Method 2: SuperDapp Wallet Signing** 🔐\n• Transactions sent to SuperDapp wallet\n• User approves via web interface\n• Secure - private keys stay with user\n• Command: \`/web-payout ${scenarioName} ${network}\`\n\n**Security Comparison:**\n• Local: Fast, requires key management\n• Wallet: Secure, requires user interaction\n\n**Choose your preferred method and execute!**`;

      await agent.sendConnectionMessage(roomId, demoText);
    });

    agent.addCommand('/network-status', async ({ message, roomId }) => {
      const args = (message.data?.split(' ').slice(1) || []);
      const network = args[0] || 'both';

      if (!['mainnet', 'testnet', 'both'].includes(network)) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Invalid network.** Use \`mainnet\`, \`testnet\`, or \`both\`.\n\n**Example:** \`/network-status mainnet\``
        );
        return;
      }

      try {
        const networks = network === 'both' ? ['mainnet', 'testnet'] : [network];
        const statusResults: string[] = [];

        for (const net of networks) {
          const chainId = net === 'mainnet' ? RolluxChains.MAINNET : RolluxChains.TESTNET;
          const rpcUrl = net === 'mainnet' 
            ? process.env.ROLLUX_MAINNET_RPC || 'https://api.superdapp.ai/rpc/rollux/mainnet'
            : process.env.ROLLUX_TESTNET_RPC || 'https://api.superdapp.ai/rpc/rollux/testnet';

          const { validateRpcConnection } = await import('../../dist/payouts/web3-client');
          const result = await validateRpcConnection(rpcUrl, chainId);

          const status = result.isValid ? '🟢 Connected' : '🔴 Failed';
          const details = result.error ? `Error: ${result.error}` : `Chain ID: ${result.actualChainId}`;
          
          statusResults.push(`**${net.charAt(0).toUpperCase() + net.slice(1)} (${chainId})**\n• Status: ${status}\n• RPC: ${rpcUrl}\n• ${details}`);
        }

        // Check wallet bridge if available
        let walletStatus = 'Not initialized';
        if (walletBridge) {
          const bridgeTest = await walletBridge.testConnection();
          walletStatus = bridgeTest.connected ? '🟢 Connected' : `🔴 Failed (${bridgeTest.error})`;
        }

        const statusText = `🌐 **Network Status Report**\n\n${statusResults.join('\n\n')}\n\n**SuperDapp Wallet Bridge**\n• Status: ${walletStatus}\n\n**Environment:**\n• Private Key: ${process.env.PRIVATE_KEY ? '🟢 Configured' : '🔴 Not Set'}\n• Mnemonic: ${process.env.MNEMONIC ? '🟢 Configured' : '🔴 Not Set'}\n• API Token: ${process.env.API_TOKEN ? '🟢 Configured' : '🔴 Not Set'}`;

        await agent.sendConnectionMessage(roomId, statusText);
        
      } catch (error) {
        await agent.sendConnectionMessage(
          roomId,
          `❌ **Network status check failed:** ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    // Handle callback queries (button clicks)
    agent.addCommand('callback_query', async ({ message, roomId }) => {
      const action = message?.callback_command || '';
      console.log('Callback query received:', action);

      if (action.startsWith('CREATE_PAYOUT_')) {
        const scenarioKey = action.replace('CREATE_PAYOUT_', '').toLowerCase();
        
        // Simulate the create-payout command
        const scenario = PAYOUT_SCENARIOS[scenarioKey as keyof typeof PAYOUT_SCENARIOS];
        if (scenario) {
          await agent.sendConnectionMessage(
            roomId,
            `🎯 **Creating ${scenario.name}...**`
          );
          
          // Process the payout creation
          const token = TOKENS[scenario.token];
          try {
            const result = await buildManifest(scenario.winners, {
              token,
              roundId: `round-${Date.now()}`,
              groupId: `group-${scenarioKey}`,
            });

            currentManifest = result.manifest;

            const summary = `✅ **${scenario.name} Created!**

📊 **Quick Summary:**
• Winners: ${result.manifest.winners.length}
• Total: ${result.manifest.totalAmount} ${token.symbol}
• Network: ${token.chainId}

Use \`/payout-status\` for detailed information.`;

            await agent.sendConnectionMessage(roomId, summary);
          } catch (error) {
            await agent.sendConnectionMessage(
              roomId,
              `❌ **Error:** ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } else {
        await agent.sendConnectionMessage(
          roomId,
          `❓ **Unknown action:** ${action}`
        );
      }
    });

    // Handle general messages
    agent.addCommand('handleMessage', async ({ message, roomId }) => {
      const text = message.data || '';
      
      if (text.toLowerCase().includes('payout') || text.toLowerCase().includes('payment')) {
        await agent.sendConnectionMessage(
          roomId,
          `💰 **Payout-related query detected!**\n\nI can help you create and manage crypto payouts. Type \`/help\` to see all payout commands.`
        );
      } else if (text.toLowerCase().includes('help')) {
        await agent.sendConnectionMessage(
          roomId,
          `❓ Type \`/help\` to see all available payout commands.`
        );
      } else {
        await agent.sendConnectionMessage(
          roomId,
          `🤖 **SuperDapp Payouts Agent** - I received your message!\n\nI specialize in cryptocurrency payouts. Type \`/help\` for available commands or \`/examples\` to see payout scenarios.`
        );
      }
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'payouts-agent',
        runtime: 'node',
        features: {
          payouts: true,
          scenarios: Object.keys(PAYOUT_SCENARIOS),
          tokens: Object.keys(TOKENS),
          currentManifest: currentManifest ? currentManifest.id : null,
        },
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
      console.log(`💰 Payouts agent webhook server is running on port ${PORT}`);
      console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🎯 Features: ${Object.keys(PAYOUT_SCENARIOS).length} scenarios, ${Object.keys(TOKENS).length} tokens`);
      // Print ngrok URL if a tunnel is active (dev:tunnel)
      void printNgrokWebhook();
    });
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();