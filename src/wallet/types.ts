/**
 * SuperDapp Wallet Bridge Types
 * 
 * Type definitions for wallet bridge communication
 */

import type { PreparedTx } from '../payouts/types';

/**
 * Transaction request sent to SuperDapp wallet for user approval
 */
export interface WalletTransactionRequest {
  /** Array of transactions to be signed */
  transactions: PreparedTx[];
  /** Metadata about the transaction request */
  metadata: {
    /** Human-readable title for the transaction batch */
    title: string;
    /** Detailed description of what the transactions do */
    description: string;
    /** Estimated total gas cost in native currency */
    estimatedGasCost: string;
    /** Number of recipients/transactions */
    recipientCount: number;
    /** Optional expiration timestamp */
    expiresAt?: string;
  };
  /** Chain ID for the transactions */
  chainId: number;
  /** Unique request identifier */
  requestId: string;
  /** Timestamp when request was created */
  createdAt: string;
}

/**
 * Response from SuperDapp wallet after user interaction
 */
export interface WalletTransactionResponse {
  /** Whether the user approved the transaction */
  approved: boolean;
  /** Request ID this response corresponds to */
  requestId: string;
  /** Array of transaction hashes (if approved and executed) */
  transactionHashes?: string[];
  /** Error message if transaction failed or was rejected */
  error?: string;
  /** Timestamp when response was generated */
  respondedAt: string;
  /** Additional metadata */
  metadata?: {
    /** Gas actually used (if transactions completed) */
    actualGasUsed?: string;
    /** Execution time in milliseconds */
    executionTime?: number;
  };
}

/**
 * Transaction status for monitoring
 */
export interface TransactionStatus {
  /** Transaction hash */
  hash: string;
  /** Current status */
  status: 'pending' | 'confirmed' | 'failed' | 'reverted';
  /** Block number (if confirmed) */
  blockNumber?: number;
  /** Block confirmations */
  confirmations?: number;
  /** Gas used */
  gasUsed?: string;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Configuration for wallet bridge
 */
export interface WalletBridgeConfig {
  /** API base URL for SuperDapp services */
  apiBaseUrl?: string;
  /** WebSocket URL for real-time communication */
  websocketUrl?: string;
  /** API token for authentication */
  apiToken: string;
  /** Polling interval for HTTP-based communication (milliseconds) */
  pollInterval?: number;
  /** Request timeout (milliseconds) */
  timeout?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
}

/**
 * Wallet bridge events
 */
export interface WalletBridgeEvents {
  /** Transaction request was submitted */
  requestSubmitted: (request: WalletTransactionRequest) => void;
  /** User approved/rejected the request */
  responseReceived: (response: WalletTransactionResponse) => void;
  /** Transaction status update */
  statusUpdate: (hash: string, status: TransactionStatus) => void;
  /** Connection status changed */
  connectionChanged: (connected: boolean) => void;
  /** Error occurred */
  error: (error: Error) => void;
}