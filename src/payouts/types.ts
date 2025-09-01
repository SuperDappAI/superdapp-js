/**
 * Core types for the SuperDapp Payouts Module
 */

/**
 * Blockchain network identifier
 */
export type ChainId = number | string;

/**
 * Token information for payouts
 */
export interface TokenInfo {
  /** Token contract address */
  address: string;
  /** Token symbol (e.g., USDC, ETH) */
  symbol: string;
  /** Token name */
  name: string;
  /** Number of decimal places */
  decimals: number;
  /** Chain ID where token exists */
  chainId: ChainId;
  /** Whether this is a native token (ETH, MATIC, etc.) */
  isNative?: boolean;
}

/**
 * Raw winner data from contest/game results
 */
export interface WinnerRow {
  /** Winner's wallet address */
  address: string;
  /** Prize amount (raw string/number) */
  amount: string | number;
  /** Winner's rank/position */
  rank: number;
  /** Optional winner identifier */
  id?: string;
  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Processed and validated winner data
 */
export interface NormalizedWinner {
  /** Winner's wallet address (validated) */
  address: string;
  /** Prize amount in token's smallest unit (wei, etc.) */
  amount: string;
  /** Winner's rank/position */
  rank: number;
  /** Winner identifier */
  id: string;
  /** Token information for the payout */
  token: TokenInfo;
  /** Additional validated metadata */
  metadata: Record<string, unknown>;
}

/**
 * Complete payout configuration and instructions
 */
export interface PayoutManifest {
  /** Unique identifier for this payout */
  id: string;
  /** List of normalized winners */
  winners: NormalizedWinner[];
  /** Token being distributed */
  token: TokenInfo;
  /** Total amount to be distributed */
  totalAmount: string;
  /** Payout creator/admin address */
  createdBy: string;
  /** Creation timestamp */
  createdAt: string;
  /** Round identifier */
  roundId: string;
  /** Group identifier */
  groupId: string;
  /** Manifest version */
  version: string;
  /** Deterministic hash of the manifest */
  hash: string;
  /** Optional payout description */
  description?: string;
  /** Payout totals breakdown */
  totals: {
    /** Total amount in wei */
    amountWei: string;
  };
  /** Additional configuration options */
  options?: {
    /** Whether to batch transactions */
    batchTransactions?: boolean;
    /** Gas price strategy */
    gasStrategy?: 'fast' | 'standard' | 'slow' | 'custom';
    /** Custom gas price (if using custom strategy) */
    customGasPrice?: string;
  };
}

/**
 * Prepared transaction ready for signing/execution
 */
export interface PreparedTx {
  /** Transaction recipient address */
  to: string;
  /** Transaction value in wei */
  value: string;
  /** Transaction data (for contract calls) */
  data: string;
  /** Gas limit */
  gasLimit: string;
  /** Gas price */
  gasPrice: string;
  /** Transaction nonce */
  nonce: number;
  /** Chain ID for the transaction */
  chainId: ChainId;
  /** Transaction type (legacy, EIP-1559, etc.) */
  type?: number;
  /** Maximum fee per gas (EIP-1559) */
  maxFeePerGas?: string;
  /** Maximum priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: string;
}

/**
 * Complete prepared payout with all transactions and metadata
 */
export interface PreparedPayout {
  /** Reference to the original manifest */
  manifestId: string;
  /** List of prepared transactions */
  transactions: PreparedTx[];
  /** Total gas cost estimation */
  estimatedGasCost: string;
  /** Preparation timestamp */
  preparedAt: string;
  /** Transaction summary */
  summary: {
    /** Total number of recipients */
    recipientCount: number;
    /** Total amount being distributed */
    totalAmount: string;
    /** Token being distributed */
    token: TokenInfo;
    /** Estimated completion time */
    estimatedDuration: string;
  };
  /** Validation status */
  validation: {
    /** Whether all transactions are valid */
    isValid: boolean;
    /** Any validation errors */
    errors: string[];
    /** Any validation warnings */
    warnings: string[];
  };
}
