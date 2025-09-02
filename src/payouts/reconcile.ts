/**
 * Payouts Reconcile Module
 * 
 * Provides utilities for reconciling payout execution results
 */

import { TxExecutionPlan, TxExecutionResult } from './execute';
import { PayoutManifest, PreparedPayout } from './types';

/**
 * Reconciliation status for a single transaction
 */
export interface TxReconciliation {
  /** Transaction hash */
  hash: string;
  /** Recipient address */
  recipient: string;
  /** Amount sent */
  amount: string;
  /** Whether transaction was confirmed on-chain */
  confirmed: boolean;
  /** Block number of confirmation */
  blockNumber?: number;
  /** Number of confirmations */
  confirmations?: number;
  /** Error message if reconciliation failed */
  error?: string;
}

/**
 * Complete reconciliation report
 */
export interface ReconciliationReport {
  /** Reference to the original manifest */
  manifestId: string;
  /** Reconciliation timestamp */
  reconciledAt: string;
  /** Individual transaction reconciliations */
  transactions: TxReconciliation[];
  /** Overall reconciliation status */
  status: 'completed' | 'partial' | 'failed';
  /** Summary statistics */
  summary: {
    /** Total transactions processed */
    totalTransactions: number;
    /** Successfully confirmed transactions */
    confirmedTransactions: number;
    /** Failed or pending transactions */
    failedTransactions: number;
    /** Total amount successfully distributed */
    totalDistributed: string;
    /** Total amount that failed to distribute */
    totalFailed: string;
  };
}

/**
 * Mock blockchain provider interface for testing
 */
export interface MockProvider {
  /** Get transaction receipt */
  getTransactionReceipt(hash: string): Promise<{
    status: boolean;
    blockNumber: number;
    gasUsed: string;
  } | null>;
  /** Get current block number */
  getBlockNumber(): Promise<number>;
}

/**
 * Reconcile a payout execution against the blockchain
 * 
 * @param manifest - Original payout manifest
 * @param executionPlan - Execution results to reconcile
 * @param provider - Blockchain provider for verification
 * @returns Reconciliation report
 */
export async function reconcilePush(
  manifest: PayoutManifest,
  executionPlan: TxExecutionPlan,
  provider: MockProvider
): Promise<ReconciliationReport> {
  const transactions: TxReconciliation[] = [];
  let confirmedTransactions = 0;
  let failedTransactions = 0;
  let totalDistributed = BigInt(0);
  let totalFailed = BigInt(0);

  const currentBlock = await provider.getBlockNumber();

  // Reconcile each transaction
  for (let i = 0; i < executionPlan.results.length; i++) {
    const result = executionPlan.results[i];
    const winner = manifest.winners[i];
    
    if (!result || !winner) {
      continue;
    }

    let confirmed = false;
    let blockNumber: number | undefined;
    let confirmations: number | undefined;
    let error: string | undefined;

    if (result.success && result.hash) {
      try {
        const receipt = await provider.getTransactionReceipt(result.hash);
        if (receipt && receipt.status) {
          confirmed = true;
          blockNumber = receipt.blockNumber;
          confirmations = currentBlock - receipt.blockNumber + 1;
          totalDistributed += BigInt(winner.amount);
          confirmedTransactions++;
        } else {
          error = 'Transaction failed or not found on-chain';
          totalFailed += BigInt(winner.amount);
          failedTransactions++;
        }
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to verify transaction';
        totalFailed += BigInt(winner.amount);
        failedTransactions++;
      }
    } else {
      error = result.error || 'Transaction execution failed';
      totalFailed += BigInt(winner.amount);
      failedTransactions++;
    }

    transactions.push({
      hash: result.hash || '',
      recipient: winner.address,
      amount: winner.amount,
      confirmed,
      ...(blockNumber !== undefined && { blockNumber }),
      ...(confirmations !== undefined && { confirmations }),
      ...(error !== undefined && { error }),
    });
  }

  // Determine overall status
  let status: 'completed' | 'partial' | 'failed';
  if (confirmedTransactions === manifest.winners.length) {
    status = 'completed';
  } else if (confirmedTransactions > 0) {
    status = 'partial';
  } else {
    status = 'failed';
  }

  return {
    manifestId: manifest.id,
    reconciledAt: new Date().toISOString(),
    transactions,
    status,
    summary: {
      totalTransactions: manifest.winners.length,
      confirmedTransactions,
      failedTransactions,
      totalDistributed: totalDistributed.toString(),
      totalFailed: totalFailed.toString(),
    },
  };
}