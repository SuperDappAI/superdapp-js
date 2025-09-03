/**
 * Payouts Reconciliation Module
 * 
 * Provides utilities for reconciling payout results by parsing transaction logs
 */

import type { PublicClient } from 'viem';
import type { PayoutManifest } from './types';
import { handleError, logError } from '../utils/errors';
import { extractAddressFromTopic } from '../utils/helpers';

/**
 * Result of reconciling a payout execution
 */
export interface ReconcileResult {
  /** Whether the reconciliation was successful */
  success: boolean;
  /** Total amount found in logs */
  totalAmountFound: string;
  /** Expected total amount from manifest */
  expectedTotalAmount: string;
  /** Number of recipients found in logs */
  recipientsFound: number;
  /** Expected number of recipients from manifest */
  expectedRecipients: number;
  /** Any discrepancies or errors found */
  errors: string[];
  /** Additional reconciliation details */
  details: {
    /** Successful transfers found in logs */
    successfulTransfers: Array<{
      recipient: string;
      amount: string;
      txHash: string;
      logIndex: number;
    }>;
    /** Failed or missing transfers */
    missingTransfers: Array<{
      recipient: string;
      expectedAmount: string;
    }>;
  };
}

/**
 * Standard ERC20 Transfer event signature
 */
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

/**
 * Reconcile payout execution by analyzing transaction logs
 * 
 * @param publicClient - Viem public client for reading blockchain data
 * @param airdrop - Contract address that executed the payout (or token address for direct transfers)
 * @param manifest - Original payout manifest with expected recipients and amounts
 * @param txHashes - Array of transaction hashes to analyze
 * @returns Promise resolving to reconciliation result
 */
export async function reconcilePush(
  publicClient: PublicClient,
  airdrop: `0x${string}`,
  manifest: PayoutManifest,
  txHashes: `0x${string}`[]
): Promise<ReconcileResult> {
  const result: ReconcileResult = {
    success: false,
    totalAmountFound: '0',
    expectedTotalAmount: manifest.totalAmount,
    recipientsFound: 0,
    expectedRecipients: manifest.winners.length,
    errors: [],
    details: {
      successfulTransfers: [],
      missingTransfers: []
    }
  };

  try {
    if (!txHashes || txHashes.length === 0) {
      result.errors.push('No transaction hashes provided for reconciliation');
      return result;
    }

    // Create a map of expected recipients and amounts for easy lookup
    const expectedTransfers = new Map<string, string>();
    for (const winner of manifest.winners) {
      expectedTransfers.set(winner.address.toLowerCase(), winner.amount);
    }

    let totalAmountFound = BigInt(0);

    // Analyze each transaction
    for (const txHash of txHashes) {
      try {
        // Get transaction receipt with logs
        const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

        if (receipt.status === 'reverted') {
          result.errors.push(`Transaction ${txHash} was reverted`);
          continue;
        }

        // Parse Transfer events from logs
        for (let logIndex = 0; logIndex < receipt.logs.length; logIndex++) {
          const log = receipt.logs[logIndex];
          if (!log) continue;

          // Check if this is a Transfer event
          if (log.topics[0] === TRANSFER_EVENT_SIGNATURE && log.topics.length >= 3) {
            try {
              // Extract transfer details using the utility function
              const toAddress = extractAddressFromTopic(log.topics[2] || '');
              const amount = log.data ? BigInt(log.data) : BigInt(0);

              // Check if this transfer is to one of our expected recipients
              const expectedAmount = expectedTransfers.get(toAddress.toLowerCase());
              if (expectedAmount) {
                // Verify the amount matches what we expected
                const expectedAmountBigInt = BigInt(expectedAmount);
                
                if (amount === expectedAmountBigInt) {
                  // Successful transfer found
                  result.details.successfulTransfers.push({
                    recipient: toAddress,
                    amount: amount.toString(),
                    txHash,
                    logIndex
                  });

                  totalAmountFound += amount;
                  
                  // Remove from expected transfers (to track what's missing)
                  expectedTransfers.delete(toAddress.toLowerCase());
                } else {
                  result.errors.push(
                    `Amount mismatch for ${toAddress}: expected ${expectedAmount}, found ${amount.toString()}`
                  );
                }
              }
            } catch (topicError) {
              const handledTopicError = handleError(topicError);
              result.errors.push(`Failed to extract address from topic in transaction ${txHash}: ${handledTopicError.message}`);
            }
          }
        }
      } catch (error) {
        const handledError = handleError(error);
        result.errors.push(`Failed to analyze transaction ${txHash}: ${handledError.message}`);
        logError(handledError, `Reconciling transaction ${txHash}`);
      }
    }

    // Check for missing transfers
    for (const [recipient, expectedAmount] of expectedTransfers.entries()) {
      result.details.missingTransfers.push({
        recipient,
        expectedAmount
      });
    }

    // Update result totals
    result.totalAmountFound = totalAmountFound.toString();
    result.recipientsFound = result.details.successfulTransfers.length;

    // Determine overall success
    const totalMatches = totalAmountFound.toString() === manifest.totalAmount;
    const recipientCountMatches = result.recipientsFound === manifest.winners.length;
    const noErrors = result.errors.length === 0;

    result.success = totalMatches && recipientCountMatches && noErrors;

    if (!result.success) {
      if (!totalMatches) {
        result.errors.push(
          `Total amount mismatch: expected ${manifest.totalAmount}, found ${result.totalAmountFound}`
        );
      }
      if (!recipientCountMatches) {
        result.errors.push(
          `Recipient count mismatch: expected ${manifest.winners.length}, found ${result.recipientsFound}`
        );
      }
    }

  } catch (error) {
    const handledError = handleError(error);
    result.errors.push(`Reconciliation failed: ${handledError.message}`);
    logError(handledError, 'Payout reconciliation');
  }

  return result;
}

/**
 * Quick reconciliation check that only verifies totals match
 * 
 * @param publicClient - Viem public client for reading blockchain data
 * @param manifest - Original payout manifest with expected totals
 * @param txHashes - Array of transaction hashes to analyze
 * @returns Promise resolving to boolean indicating if totals match
 */
export async function quickReconcileCheck(
  publicClient: PublicClient,
  manifest: PayoutManifest,
  txHashes: `0x${string}`[]
): Promise<boolean> {
  try {
    const result = await reconcilePush(publicClient, manifest.token.address as `0x${string}`, manifest, txHashes);
    return result.success;
  } catch (error) {
    logError(handleError(error), 'Quick reconcile check');
    return false;
  }
}