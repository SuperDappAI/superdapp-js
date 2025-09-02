/**
 * Payouts Transaction Preparer Module
 * 
 * Provides utilities for preparing blockchain transactions for payout execution
 */

import { PayoutManifest, PreparedTx, PreparedPayout } from './types';

/**
 * Options for preparing push transactions
 */
export interface PreparePushTxsOptions {
  /** Gas strategy to use */
  gasStrategy?: 'fast' | 'standard' | 'slow' | 'custom';
  /** Custom gas price (in wei) */
  customGasPrice?: string;
  /** Maximum fee per gas for EIP-1559 (in wei) */
  maxFeePerGas?: string;
  /** Maximum priority fee per gas for EIP-1559 (in wei) */
  maxPriorityFeePerGas?: string;
  /** Starting nonce for transactions */
  startingNonce?: number;
  /** Whether to batch transactions */
  batchTransactions?: boolean;
}

/**
 * Gas price estimates for different strategies
 */
const GAS_PRICES = {
  slow: '10000000000',      // 10 gwei
  standard: '20000000000',  // 20 gwei
  fast: '30000000000',      // 30 gwei
} as const;

/**
 * Prepare push transactions from a payout manifest
 * 
 * @param manifest - The payout manifest
 * @param options - Transaction preparation options
 * @returns Prepared payout with transaction list
 */
export function preparePushTxs(
  manifest: PayoutManifest,
  options: PreparePushTxsOptions = {}
): PreparedPayout {
  const {
    gasStrategy = 'standard',
    customGasPrice,
    maxFeePerGas = '25000000000',
    maxPriorityFeePerGas = '2000000000',
    startingNonce = 0,
    batchTransactions = false
  } = options;

  // Determine gas price
  let gasPrice: string;
  if (gasStrategy === 'custom' && customGasPrice) {
    gasPrice = customGasPrice;
  } else {
    gasPrice = GAS_PRICES[gasStrategy as keyof typeof GAS_PRICES] || GAS_PRICES.standard;
  }

  const transactions: PreparedTx[] = [];
  let currentNonce = startingNonce;

  // Create transactions for each winner
  for (const winner of manifest.winners) {
    const tx: PreparedTx = {
      to: winner.address,
      value: winner.amount,
      data: '0x', // Simple transfer, no data needed
      gasLimit: '21000', // Standard ETH transfer gas limit
      gasPrice,
      nonce: currentNonce++,
      chainId: winner.token.chainId,
      type: 2, // EIP-1559 transaction
      maxFeePerGas,
      maxPriorityFeePerGas,
    };

    transactions.push(tx);
  }

  // Calculate total gas cost
  const gasLimit = BigInt(21000);
  const gasPriceBig = BigInt(gasPrice);
  const totalGasCost = gasLimit * gasPriceBig * BigInt(transactions.length);

  const preparedPayout: PreparedPayout = {
    manifestId: manifest.id,
    transactions,
    estimatedGasCost: totalGasCost.toString(),
    preparedAt: new Date().toISOString(),
    summary: {
      recipientCount: manifest.winners.length,
      totalAmount: manifest.totalAmount,
      token: manifest.token,
      estimatedDuration: `${Math.ceil(transactions.length / 10)} minutes`, // Estimate 10 tx/min
    },
    validation: {
      isValid: true,
      errors: [],
      warnings: gasStrategy === 'fast' ? ['Gas price is high'] : [],
    },
  };

  return preparedPayout;
}