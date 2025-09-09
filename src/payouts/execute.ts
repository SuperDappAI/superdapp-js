/**
 * Payouts Execution Module
 * 
 * Provides utilities for executing prepared payout transactions using viem
 */

import type { WalletClient, PublicClient } from 'viem';
import { PreparedPayout, PreparedTx } from './types';
import { handleError, logError } from '../utils/errors';
import { 
  createPublicClient, 
  createWalletClientFromPrivateKey, 
  createWalletClientFromMnemonic 
} from './web3-client';

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
 * Enhanced options for executing with RPC configuration
 */
export interface ExecuteOptionsWithRpc extends Omit<ExecuteOptions, 'wallet' | 'publicClient'> {
  /** RPC endpoint URL (required if wallet/publicClient not provided) */
  rpcUrl?: string;
  /** Chain ID (required if using RPC configuration) */
  chainId?: number;
  /** Private key for signing (alternative to wallet) */
  privateKey?: string;
  /** Mnemonic phrase for signing (alternative to privateKey) */
  mnemonic?: string;
  /** Account index when using mnemonic (default: 0) */
  accountIndex?: number;
  /** Pre-configured wallet client (takes precedence over privateKey/mnemonic) */
  wallet?: WalletClient;
  /** Pre-configured public client (takes precedence over rpcUrl) */
  publicClient?: PublicClient;
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

  // Support both 'transactions' and 'txs' fields for flexibility
  const transactions = plan.txs || plan.transactions;

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
      const hash = await wallet.sendTransaction(viemTx as Parameters<typeof wallet.sendTransaction>[0]);
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

/**
 * Execute a prepared payout plan with RPC configuration
 * 
 * This is a convenience function that creates viem clients from RPC configuration
 * and then executes the payout using the standard executeTxPlan function.
 * 
 * @param plan - The prepared payout containing transactions to execute
 * @param opts - Enhanced execution options with RPC and signing configuration
 * @returns Array of transaction hashes for successful transactions
 */
export async function executeTxPlanWithRpc(
  plan: PreparedPayout,
  opts: ExecuteOptionsWithRpc
): Promise<`0x${string}`[]> {
  const { 
    rpcUrl, 
    chainId, 
    privateKey, 
    mnemonic, 
    accountIndex = 0,
    wallet: providedWallet,
    publicClient: providedPublicClient,
    ...executeOptions 
  } = opts;

  // Use provided clients or create from RPC configuration
  let wallet: WalletClient;
  let publicClient: PublicClient;

  if (providedWallet && providedPublicClient) {
    // Use provided clients
    wallet = providedWallet;
    publicClient = providedPublicClient;
  } else if (rpcUrl && chainId) {
    // Create clients from RPC configuration
    publicClient = createPublicClient(rpcUrl, chainId);
    
    if (providedWallet) {
      wallet = providedWallet;
    } else if (privateKey) {
      wallet = createWalletClientFromPrivateKey(rpcUrl, chainId, privateKey);
    } else if (mnemonic) {
      wallet = createWalletClientFromMnemonic(rpcUrl, chainId, mnemonic, accountIndex);
    } else {
      throw new Error('Either wallet, privateKey, or mnemonic must be provided for signing');
    }
  } else {
    throw new Error('Either provide wallet+publicClient or rpcUrl+chainId for execution');
  }

  // Execute using the standard function
  return executeTxPlan(plan, {
    wallet,
    publicClient,
    ...executeOptions
  });
}