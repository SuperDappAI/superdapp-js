/**
 * Transaction Preparer Module
 * 
 * Prepares transaction plans for push-only payouts using SuperDappAirdrop
 */

import { encodeFunctionData } from 'viem';
import { PayoutManifest, PreparedPayout, PreparedTx, TokenInfo } from './types';
import { getAirdropAddress, isSupportedChain, getChainMetadata } from './chain-config';

/**
 * Options for preparing push transactions
 */
export interface PushPrepareOptions {
  /** SuperDappAirdrop contract address (optional - will auto-resolve from token.chainId if not provided) */
  airdrop?: `0x${string}`;
  /** Token information */
  token: TokenInfo;
  /** Maximum recipients per batch (default: 50) */
  maxPerBatch?: number;
  /** Whether to use single approval for ERC-20 tokens (default: true) */
  singleApproval?: boolean;
}

/**
 * SuperDappAirdrop contract ABI
 */
const SUPERDAPP_AIRDROP_ABI = [
  {
    name: 'batchTokenTransfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' }
    ],
    outputs: []
  },
  {
    name: 'batchNativeTransfer',
    type: 'function', 
    stateMutability: 'payable',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' }
    ],
    outputs: []
  }
] as const;

/**
 * ERC-20 token ABI (approve function)
 */
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

/**
 * Chunk an array into smaller arrays of specified size
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Prepare transaction plan for push-only payouts
 */
export function preparePushTxs(
  manifest: PayoutManifest,
  opts: PushPrepareOptions
): PreparedPayout {
  const { airdrop: providedAirdrop, token, maxPerBatch = 50, singleApproval = true } = opts;
  const totalWei = manifest.totals.amountWei;
  const transactions: PreparedTx[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Resolve airdrop contract address
    let airdrop: `0x${string}`;
    
    if (providedAirdrop) {
      airdrop = providedAirdrop;
    } else {
      // Auto-resolve from chain configuration
      const resolvedAddress = getAirdropAddress(token.chainId);
      if (!resolvedAddress || !isSupportedChain(token.chainId)) {
        const chainMetadata = getChainMetadata(token.chainId);
        const chainName = chainMetadata?.name || `Chain ID ${token.chainId}`;
        errors.push(`SuperDappAirdrop contract not configured for ${chainName}. Please provide the airdrop contract address manually.`);
        throw new Error(`Unsupported chain: ${token.chainId}`);
      }
      airdrop = resolvedAddress;
    }
    // Prepare recipients and amounts from winners
    const recipients = manifest.winners.map(winner => winner.address as `0x${string}`);
    const amounts = manifest.winners.map(winner => BigInt(winner.amount));

    // Validate that recipients and amounts arrays have same length
    if (recipients.length !== amounts.length) {
      errors.push('Recipients and amounts arrays must have same length');
    }

    if (token.isNative === true) {
      // Native token path
      
      // 1. Add funding transaction to airdrop contract
      transactions.push({
        to: airdrop,
        value: totalWei,
        data: '0x',
        gasLimit: '21000',
        gasPrice: '20000000000', // 20 gwei default
        nonce: 0, // Will be set by caller
        chainId: token.chainId,
        type: 2,
        maxFeePerGas: '25000000000',
        maxPriorityFeePerGas: '2000000000'
      });

      // 2. Create batched native transfers
      const recipientChunks = chunkArray(recipients, maxPerBatch);
      const amountChunks = chunkArray(amounts, maxPerBatch);

      for (let i = 0; i < recipientChunks.length; i++) {
        const chunkRecipients = recipientChunks[i];
        const chunkAmounts = amountChunks[i];

        const data = encodeFunctionData({
          abi: SUPERDAPP_AIRDROP_ABI,
          functionName: 'batchNativeTransfer',
          args: [chunkRecipients as readonly `0x${string}`[], chunkAmounts as readonly bigint[]]
        });

        transactions.push({
          to: airdrop,
          value: '0',
          data,
          gasLimit: '500000', // Higher gas for batch operations
          gasPrice: '20000000000',
          nonce: 0, // Will be set by caller
          chainId: token.chainId,
          type: 2,
          maxFeePerGas: '25000000000',
          maxPriorityFeePerGas: '2000000000'
        });
      }

    } else {
      // ERC-20 token path

      // 1. Add approval transaction if singleApproval is true
      if (singleApproval) {
        const approveData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [airdrop, BigInt(totalWei)]
        });

        transactions.push({
          to: token.address,
          value: '0',
          data: approveData,
          gasLimit: '100000',
          gasPrice: '20000000000',
          nonce: 0, // Will be set by caller
          chainId: token.chainId,
          type: 2,
          maxFeePerGas: '25000000000',
          maxPriorityFeePerGas: '2000000000'
        });
      }

      // 2. Create batched token transfers
      const recipientChunks = chunkArray(recipients, maxPerBatch);
      const amountChunks = chunkArray(amounts, maxPerBatch);

      for (let i = 0; i < recipientChunks.length; i++) {
        const chunkRecipients = recipientChunks[i];
        const chunkAmounts = amountChunks[i];

        const data = encodeFunctionData({
          abi: SUPERDAPP_AIRDROP_ABI,
          functionName: 'batchTokenTransfer',
          args: [token.address as `0x${string}`, chunkRecipients as readonly `0x${string}`[], chunkAmounts as readonly bigint[]]
        });

        transactions.push({
          to: airdrop,
          value: '0',
          data,
          gasLimit: '500000',
          gasPrice: '20000000000',
          nonce: 0, // Will be set by caller
          chainId: token.chainId,
          type: 2,
          maxFeePerGas: '25000000000',
          maxPriorityFeePerGas: '2000000000'
        });
      }
    }

    // Calculate estimated gas cost
    const estimatedGasCost = transactions
      .reduce((total, tx) => total + BigInt(tx.gasLimit) * BigInt(tx.gasPrice), BigInt(0))
      .toString();

    // Return prepared payout
    return {
      manifestId: manifest.id,
      transactions,
      estimatedGasCost,
      preparedAt: new Date().toISOString(),
      summary: {
        recipientCount: manifest.winners.length,
        totalAmount: manifest.totalAmount,
        token: manifest.token,
        estimatedDuration: `${Math.ceil(transactions.length * 15)}s` // Estimate 15s per tx
      },
      validation: {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    };

  } catch (error) {
    errors.push(`Failed to prepare transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      manifestId: manifest.id,
      transactions: [],
      estimatedGasCost: '0',
      preparedAt: new Date().toISOString(),
      summary: {
        recipientCount: 0,
        totalAmount: '0',
        token: manifest.token,
        estimatedDuration: '0s'
      },
      validation: {
        isValid: false,
        errors,
        warnings
      }
    };
  }
}