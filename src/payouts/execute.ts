/**
 * Payouts Execution Module
 * 
 * Provides utilities for executing prepared payout transactions using viem
 */

import type { WalletClient, PublicClient } from 'viem';
import { PreparedPayout, PreparedTx } from './types';
import { handleError, logError } from '../utils/errors';

/**
 * Options for executing a payout plan
 */
export interface ExecuteOptions {
  /** Viem wallet client for signing and sending transactions */
  wallet: WalletClient;
  /** Viem public client for reading blockchain state and receipts */
  publicClient: PublicClient;
  /** Optional callback fired before each transaction is sent */
  onProgress?: (i: number, tx: PreparedTx, hash?: `0x${string}`) => void;
  /** Optional callback fired after each transaction receipt is received */
  onReceipt?: (i: number, hash: `0x${string}`) => void;
  /** Whether to stop execution on first failure (default: false) */
  stopOnFail?: boolean;
}

/**
 * Execute a prepared payout plan by sending all transactions
 * 
 * @param plan - The prepared payout containing transactions to execute
 * @param opts - Execution options including wallet and callbacks
 * @returns Array of transaction hashes for successful transactions
 */
export async function executeTxPlan(
  plan: PreparedPayout,
  opts: ExecuteOptions
): Promise<`0x${string}`[]> {
  const { wallet, publicClient, onProgress, onReceipt, stopOnFail = false } = opts;
  const successfulHashes: `0x${string}`[] = [];
  const errors: Error[] = [];

  // Use the transactions field from PreparedPayout
  const transactions = plan.transactions;

  if (!transactions || transactions.length === 0) {
    throw new Error('No transactions to execute in the payout plan');
  }

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    if (!tx) continue;

    try {
      // Fire progress callback before sending transaction
      onProgress?.(i, tx);

      // Prepare transaction for viem
      const viemTx: Record<string, unknown> = {
        to: tx.to as `0x${string}`,
        value: BigInt(tx.value),
        data: tx.data as `0x${string}`,
        gas: BigInt(tx.gasLimit),
        nonce: tx.nonce,
      };

      // Add gas pricing based on transaction type
      if (tx.type === 2 || tx.maxFeePerGas) {
        // EIP-1559 transaction
        if (tx.maxFeePerGas) viemTx.maxFeePerGas = BigInt(tx.maxFeePerGas);
        if (tx.maxPriorityFeePerGas) viemTx.maxPriorityFeePerGas = BigInt(tx.maxPriorityFeePerGas);
        viemTx.type = 'eip1559';
      } else if (tx.gasPrice) {
        // Legacy transaction
        viemTx.gasPrice = BigInt(tx.gasPrice);
        viemTx.type = 'legacy';
      }

      // Send transaction
      const hash = await wallet.sendTransaction(viemTx as any);
      successfulHashes.push(hash);

      // Fire progress callback with hash
      onProgress?.(i, tx, hash);

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1
      });

      // Fire receipt callback
      onReceipt?.(i, hash);

      // Check if transaction was successful
      if (receipt.status === 'reverted') {
        const error = new Error(`Transaction ${hash} was reverted`);
        errors.push(error);
        
        if (stopOnFail) {
          logError(handleError(error), `Transaction ${i} execution`);
          throw error;
        }
      }

    } catch (error) {
      const handledError = handleError(error);
      errors.push(handledError);
      logError(handledError, `Transaction ${i} execution`);

      if (stopOnFail) {
        throw handledError;
      }
    }
  }

  // If we have errors but didn't stop on fail, log them
  if (errors.length > 0 && !stopOnFail) {
    console.warn(`Execution completed with ${errors.length} failed transactions out of ${transactions.length} total`);
  }

  return successfulHashes;
}