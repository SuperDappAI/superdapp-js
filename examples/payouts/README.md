# SuperDapp Payouts Example - Real Blockchain Transactions

A comprehensive SuperDapp agent that demonstrates **real blockchain transaction execution** for cryptocurrency payouts on the Rollux network, supporting both local private key signing and SuperDapp wallet integration.

## Features

### Core Payout Commands
- 🏆 `/create-payout` - Create payouts from winner data (gaming tournaments, contests, airdrops)
- ✅ `/validate-winners` - Validate winner wallet addresses with EIP-55 checksumming
- 📊 `/export-manifest` - Export payout manifests to CSV/JSON formats
- 🔍 `/reconcile` - Reconcile and verify payout results (demo mode)
- 📋 `/payout-status` - Check current payout execution status

### Interactive Scenarios
- 🎮 **Gaming Tournaments** - eSports prize distributions with tiered rewards
- 🏅 **Contest Winners** - Creative contest payouts with grand prizes
- 💰 **Community Airdrops** - Equal token distributions to community members
- 🔒 **Address Validation** - Comprehensive wallet address checking with checksumming
- 📈 **Multi-Token Support** - USDC, ETH, MATIC with proper decimal handling

### Built-in Example Scenarios
- **Tournament Payout**: Gaming competition (1st: 1000 USDC, 2nd: 500, 3rd: 250, 4th-5th: 50 each)
- **Contest Winners**: Art contest (Grand: 2000, Runner-up: 800, Honorable mentions: 200 each)
- **Community Airdrop**: Token distribution (100 USDC each to 5 community members)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with your configuration:

   ```env
   PORT=3000
   API_TOKEN=your_superdapp_api_token_here
   API_BASE_URL=https://api.superdapp.ai
   ```

3. Run the example:

   ```bash
   npm run build  # Build the project first
   npm start      # Run the built version
   ```

   Or for development with auto-reload:

   ```bash
   npm run dev
   ```

   Or with tunnel for external webhook testing:

   ```bash
   npm run dev:tunnel
   ```

4. The server will start and you'll see:
   - Webhook endpoint: http://localhost:3000/webhook
   - Health check: http://localhost:3000/health

## Available Commands

### Basic Commands
- `/start` - Welcome message and feature overview
- `/help` - Show all available commands
- `/examples` - List built-in payout scenarios

### Payout Management
- `/create-payout <scenario>` - Create a payout scenario:
  - `tournament` - Gaming tournament payout
  - `contest` - Creative contest payout
  - `airdrop` - Token airdrop scenario
- `/validate-winners <addresses>` - Validate comma-separated addresses
- `/export-manifest <format>` - Export in CSV or JSON format
- `/payout-status` - Show current manifest details
- `/reconcile <payout-id>` - Check payout execution status (demo)

### Interactive Menus
- `/scenarios` - Browse payout scenarios with interactive buttons
- `/tokens` - View supported token configurations

## Usage Examples

### Gaming Tournament Payout

```
/create-payout tournament

This creates a realistic gaming tournament payout with:
- 1st Place: 1000 USDC
- 2nd Place: 500 USDC  
- 3rd Place: 250 USDC
- 4th-5th Place: 50 USDC each
```

### Contest Winners

```
/create-payout contest

Art contest with tiered rewards:
- Grand Prize: 2000 USDC
- Runner-up: 800 USDC
- Honorable Mentions: 200 USDC each
```

### Address Validation

```
/validate-winners 0x742d35Cc6634C0532925a3b8FD74389b9f8e9c55,0x8ba1f109551bD432803012645Hac136c0532925

Returns validation results for each address with EIP-55 checksumming
```

### Export Formats

```
/export-manifest csv
/export-manifest json

Exports the current payout manifest in your preferred format
```

## SuperDapp Payout SDK Features Demonstrated

This example showcases the SuperDapp Payout SDK capabilities:

### 1. Manifest Creation
- Winner data normalization and validation
- Address checksumming with EIP-55 standard
- Amount calculations with proper decimal handling
- Deterministic manifest hash generation

### 2. Multi-Chain Support
- Ethereum mainnet (ETH, USDC)
- Polygon (MATIC)
- Custom token configurations
- Chain-specific metadata

### 3. Token Management
- Native tokens (ETH, MATIC)
- ERC-20 tokens (USDC)
- Proper decimal handling (6 for USDC, 18 for ETH/MATIC)
- Token metadata management

### 4. Export Capabilities
- CSV format for spreadsheet analysis
- JSON format for programmatic use
- Canonical JSON with deterministic ordering

### 5. Validation & Address Handling
- Ethereum address format validation
- EIP-55 checksum verification and correction
- Rejection tracking for invalid addresses

## Architecture

The agent demonstrates proper payout workflow using the SuperDapp SDK:

1. **Data Collection** - Gather winner data from tournaments/contests
2. **Validation** - Verify all addresses and amounts using SDK utilities
3. **Manifest Creation** - Build structured payout instructions with `buildManifest()`
4. **Export** - Generate files for execution systems using `toCSV()` and `canonicalJson()`
5. **Status Tracking** - Monitor and display payout information

## Security Features

- ✅ Address validation and EIP-55 checksumming
- ✅ Amount overflow protection via proper decimal handling
- ✅ Duplicate winner detection in validation
- ✅ Manifest hash verification for integrity
- ✅ Input sanitization and validation
- ✅ Structured error handling and reporting

## Integration Examples

This agent can be extended to integrate with:

- Tournament platforms (for automatic winner detection)
- Contest management systems
- Blockchain execution services
- Analytics and reporting tools
- Multi-signature wallet systems
- Payment processing services

## Error Handling

Comprehensive error handling for:
- Invalid addresses (format validation)
- Network connectivity issues
- Insufficient or malformed data
- Format validation errors in exports
- SDK integration failures

## Technical Implementation

### Key Dependencies
- **SuperDapp SDK**: Official SDK for agent and payout functionality
- **Express.js**: Web server for webhook handling
- **Axios**: HTTP client for external integrations
- **TypeScript**: Type-safe development

### SDK Integration
```typescript
import { SuperDappAgent } from '../../dist';
import {
  buildManifest,
  toCSV,
  canonicalJson,
  TokenInfo,
  WinnerRow,
  PayoutManifest
} from '../../dist/payouts';
```

The example demonstrates proper usage of:
- `SuperDappAgent` for command handling and webhook processing
- `buildManifest()` for creating validated payout manifests
- `toCSV()` and `canonicalJson()` for data export
- Type definitions for type-safe development

This implementation serves as a complete reference for developers building payout-enabled agents with the SuperDapp platform.