/**
 * SuperDapp Payouts Module
 *
 * This module provides types and utilities for handling cryptocurrency payouts
 * to multiple recipients on various blockchain networks.
 */

// Export all types
export * from './types';

// Export builder utilities
export * from './builder';

// Export execution utilities
export * from './execute';

// Export reconciliation utilities
export * from './reconcile';

// Re-export specific types for convenience
export type {
  ChainId,
  TokenInfo,
  WinnerRow,
  NormalizedWinner,
  PayoutManifest,
  PreparedTx,
  PreparedPayout,
} from './types';

// Re-export builder functions for convenience
export type {
  BuildManifestOptions,
  BuildManifestResult,
} from './builder';

export { buildManifest } from './builder';

// Re-export execution functions for convenience
export type { ExecuteOptions } from './execute';
export { executeTxPlan } from './execute';

// Re-export reconciliation functions for convenience
export type { ReconcileResult } from './reconcile';
export { reconcilePush, quickReconcileCheck } from './reconcile';
