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

// Export transaction preparer utilities
export * from './tx-preparer';

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

// Re-export tx-preparer functions for convenience
export type {
  PushPrepareOptions,
} from './tx-preparer';

export { preparePushTxs } from './tx-preparer';
