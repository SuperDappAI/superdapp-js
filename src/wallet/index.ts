/**
 * SuperDapp Wallet Bridge - Public API
 * 
 * Exports for wallet integration functionality
 */

export * from './bridge';
export * from './types';
export { SuperDappWalletBridge, createWalletBridge } from './bridge';
export type {
  WalletTransactionRequest,
  WalletTransactionResponse,
  TransactionStatus,
  WalletBridgeConfig,
  WalletBridgeEvents,
} from './types';