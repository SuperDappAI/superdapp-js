/**
 * SuperDapp Payouts Module
 *
 * This module provides types and utilities for handling cryptocurrency payouts
 * to multiple recipients on various blockchain networks.
 */

// Export all types & utilities from submodules
export * from './types';
export * from './builder';
export * from './execute';
export * from './reconcile';
export * from './tx-preparer';
export * from './chain-config';
export * from './exporters';

// Re-export specific TYPES for convenience (types only to avoid duplicate value exports)
export type {
  ChainId,
  TokenInfo,
  WinnerRow,
  NormalizedWinner,
  PayoutManifest,
  PreparedTx,
  PreparedPayout,
} from './types';

export type {
  BuildManifestOptions,
  BuildManifestResult,
} from './builder';

export type { ExecuteOptions } from './execute';

export type { ReconcileResult } from './reconcile';

export type { PushPrepareOptions } from './tx-preparer';