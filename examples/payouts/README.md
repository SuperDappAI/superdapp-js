# SuperDapp Payouts Agent Example

A comprehensive SuperDapp agent example demonstrating crypto payout functionality for tournaments, contests, and reward distributions.

## Features

### Core Payout Commands
- 🏆 `/create-payout` - Create payouts from winner data (gaming tournaments, contests)
- ✅ `/validate-winners` - Validate winner wallet addresses
- 📊 `/export-manifest` - Export payout manifests to CSV/JSON formats
- 🔍 `/reconcile` - Reconcile and verify payout results
- 📋 `/payout-status` - Check payout execution status

### Interactive Scenarios
- 🎮 **Gaming Tournaments** - eSports prize distributions
- 🏅 **Contest Winners** - Creative contest payouts  
- 💰 **Multi-Token Payouts** - Support for different cryptocurrencies
- 🔒 **Address Validation** - Comprehensive wallet address checking
- 📈 **Batch Processing** - Handle large winner lists efficiently

### Example Scenarios Built-In
- **Tournament Payout**: Gaming competition with prize pool distribution
- **Contest Winners**: Art contest with multiple prize tiers
- **Community Rewards**: Token airdrops and community incentives

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
   
   # Optional: Default token configuration
   DEFAULT_TOKEN_ADDRESS=0xA0b86a33E6441e6C2c6ff2AaF9c1CbA3b8E8F55f
   DEFAULT_CHAIN_ID=1
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
- `/reconcile <payout-id>` - Check payout execution status

### Interactive Menus
- `/scenarios` - Browse payout scenarios with buttons
- `/tokens` - Select different token types for payouts
- `/settings` - Configure payout preferences

## Usage Examples

### Gaming Tournament Payout

```
/create-payout tournament

This creates a realistic gaming tournament payout with:
- 1st Place: 1000 USDC
- 2nd Place: 500 USDC  
- 3rd Place: 250 USDC
- Top 10: 50 USDC each
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

Returns validation results for each address
```

### Export Formats

```
/export-manifest csv
/export-manifest json

Exports the current payout manifest in your preferred format
```

## Payout SDK Features Demonstrated

This example showcases the SuperDapp Payout SDK capabilities:

### 1. Manifest Creation
- Winner data normalization
- Address validation and checksumming
- Amount calculations with proper decimals
- Deterministic manifest hashing

### 2. Multi-Chain Support
- Ethereum mainnet
- Polygon
- Arbitrum
- Custom chain configurations

### 3. Token Management
- Native tokens (ETH, MATIC)
- ERC-20 tokens (USDC, USDT, DAI)
- Custom token configurations
- Decimal handling

### 4. Export Capabilities
- CSV format for spreadsheet analysis
- JSON format for programmatic use
- Canonical JSON with deterministic ordering

### 5. Validation & Reconciliation
- Address format validation
- Checksum verification
- Payout execution tracking
- Result verification

## Architecture

The agent demonstrates proper payout workflow:

1. **Data Collection** - Gather winner data from tournaments/contests
2. **Validation** - Verify all addresses and amounts
3. **Manifest Creation** - Build structured payout instructions
4. **Export** - Generate files for execution systems
5. **Reconciliation** - Track and verify payout completion

## Security Features

- ✅ Address validation and checksumming
- ✅ Amount overflow protection
- ✅ Duplicate winner detection
- ✅ Manifest hash verification
- ✅ Input sanitization

## Integration Examples

This agent can be extended to integrate with:

- Tournament platforms (for automatic winner detection)
- Contest management systems
- Blockchain execution services
- Analytics and reporting tools
- Multi-signature wallet systems

## Error Handling

Comprehensive error handling for:
- Invalid addresses
- Network connectivity issues
- Insufficient data
- Format validation errors
- Export failures

The agent is production-ready and demonstrates best practices for crypto payout management.