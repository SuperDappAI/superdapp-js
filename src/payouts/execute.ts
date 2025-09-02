/**
 * Payouts Execute Module
 * 
 * Provides utilities for executing prepared payout transactions
 */

import { PreparedPayout, PreparedTx } from './types';

/**
 * Transaction execution result
 */
export interface TxExecutionResult {
  /** Transaction hash */
  hash: string;
  /** Whether transaction was successful */
  success: boolean;
  /** Gas used */
  gasUsed?: string;
  /** Block number where transaction was mined */
  blockNumber?: number;
  /** Error message if transaction failed */
  error?: string;
}

/**
 * Execution plan with transaction results
 */
export interface TxExecutionPlan {
  /** Reference to the prepared payout */
  payoutId: string;
  /** Execution results for each transaction */
  results: TxExecutionResult[];
  /** Total execution time */
  executionTime: string;
  /** Whether all transactions succeeded */
  success: boolean;
  /** Summary of failed transactions */
  failedCount: number;
  /** Summary of successful transactions */
  successCount: number;
}

/**
 * Mock signer interface for testing
 */
export interface MockSigner {
  /** Sign and send a transaction */
  sendTransaction(tx: PreparedTx): Promise<TxExecutionResult>;
}

/**
 * Execute a prepared payout transaction plan
 * 
 * @param preparedPayout - The prepared payout to execute
 * @param signer - Signer interface for transaction execution
 * @returns Execution plan with results
 */
export async function executeTxPlan(
  preparedPayout: PreparedPayout,
  signer: MockSigner
): Promise<TxExecutionPlan> {
  const startTime = Date.now();
  const results: TxExecutionResult[] = [];

  let successCount = 0;
  let failedCount = 0;

  // Execute each transaction
  for (const tx of preparedPayout.transactions) {
    try {
      const result = await signer.sendTransaction(tx);
      results.push(result);
      
      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      const errorResult: TxExecutionResult = {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      results.push(errorResult);
      failedCount++;
    }
  }

  const endTime = Date.now();
  const executionTime = `${endTime - startTime}ms`;

  return {
    payoutId: preparedPayout.manifestId,
    results,
    executionTime,
    success: failedCount === 0,
    failedCount,
    successCount,
  };
}