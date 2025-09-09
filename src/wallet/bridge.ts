/**
 * SuperDapp Wallet Transaction Bridge
 * 
 * Enables agents to push unsigned transactions to SuperDapp web client
 * for user approval and signing, similar to MetaMask integration patterns.
 */

import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import { 
  WalletTransactionRequest, 
  WalletTransactionResponse, 
  TransactionStatus, 
  WalletBridgeConfig,
  WalletBridgeEvents 
} from './types';
import type { PreparedTx } from '../payouts/types';
import { handleError } from '../utils/errors';

/**
 * Main SuperDapp Wallet Bridge class
 */
export class SuperDappWalletBridge extends EventEmitter {
  private config: Required<WalletBridgeConfig>;
  private httpClient: AxiosInstance;
  private isConnected: boolean = false;
  private pendingRequests: Map<string, WalletTransactionRequest> = new Map();

  constructor(config: WalletBridgeConfig) {
    super();
    
    // Set defaults
    this.config = {
      apiBaseUrl: config.apiBaseUrl || 'https://api.superdapp.ai',
      websocketUrl: config.websocketUrl || 'wss://api.superdapp.ai/wallet-bridge',
      apiToken: config.apiToken,
      pollInterval: config.pollInterval || 2000,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    };

    // Setup HTTP client
    this.httpClient = axios.create({
      baseURL: this.config.apiBaseUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Submit a transaction request to SuperDapp wallet for user approval
   * 
   * @param transactions - Array of prepared transactions
   * @param metadata - Transaction metadata for user display
   * @param chainId - Blockchain network ID
   * @returns Promise resolving to wallet response
   */
  async pushTransactionRequest(request: {
    transactions: PreparedTx[];
    metadata: {
      title: string;
      description: string;
      estimatedGasCost: string;
      recipientCount: number;
    };
    chainId: number;
  }): Promise<WalletTransactionResponse> {
    try {
      const requestId = this.generateRequestId();
      const walletRequest: WalletTransactionRequest = {
        ...request,
        requestId,
        createdAt: new Date().toISOString(),
      };

      // Store pending request
      this.pendingRequests.set(requestId, walletRequest);

      // Emit event
      this.emit('requestSubmitted', walletRequest);

      // Submit to SuperDapp API
      const submitResponse = await this.submitTransactionRequest(walletRequest);
      
      if (!submitResponse.success) {
        throw new Error(`Failed to submit transaction request: ${submitResponse.error}`);
      }

      // Wait for user response
      const response = await this.waitForUserResponse(requestId);
      
      // Clean up
      this.pendingRequests.delete(requestId);
      
      // Emit event
      this.emit('responseReceived', response);
      
      return response;

    } catch (error) {
      const handledError = handleError(error);
      this.emit('error', handledError);
      throw handledError;
    }
  }

  /**
   * Monitor transaction status for an array of transaction hashes
   * 
   * @param hashes - Array of transaction hashes to monitor
   * @returns Promise resolving to array of transaction statuses
   */
  async monitorTransactionStatus(hashes: string[]): Promise<TransactionStatus[]> {
    try {
      const statusPromises = hashes.map(hash => this.getTransactionStatus(hash));
      const statuses = await Promise.all(statusPromises);
      
      // Emit status updates
      statuses.forEach((status, index) => {
        const hash = hashes[index];
        if (hash) {
          this.emit('statusUpdate', hash, status);
        }
      });
      
      return statuses;
    } catch (error) {
      const handledError = handleError(error);
      this.emit('error', handledError);
      throw handledError;
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Test connection to SuperDapp wallet services
   */
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const response = await this.httpClient.get('/wallet-bridge/health');
      const connected = response.status === 200;
      
      if (this.isConnected !== connected) {
        this.isConnected = connected;
        this.emit('connectionChanged', connected);
      }
      
      return { connected };
    } catch (error) {
      const connected = false;
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      
      if (this.isConnected !== connected) {
        this.isConnected = connected;
        this.emit('connectionChanged', connected);
      }
      
      return { connected, error: errorMessage };
    }
  }

  // Private methods

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private async submitTransactionRequest(request: WalletTransactionRequest): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await this.httpClient.post('/wallet-bridge/transaction-request', request);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async waitForUserResponse(requestId: string): Promise<WalletTransactionResponse> {
    const maxAttempts = this.config.timeout / this.config.pollInterval;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await this.httpClient.get(`/wallet-bridge/transaction-response/${requestId}`);
        
        if (response.data && response.data.requestId === requestId) {
          return response.data as WalletTransactionResponse;
        }
      } catch (error) {
        // Continue polling if request not found (404) or other transient errors
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          // Request not ready yet, continue polling
        } else {
          throw error;
        }
      }

      await new Promise(resolve => setTimeout(resolve, this.config.pollInterval));
      attempts++;
    }

    // Timeout
    throw new Error(`Transaction request ${requestId} timed out after ${this.config.timeout}ms`);
  }

  private async getTransactionStatus(hash: string): Promise<TransactionStatus> {
    try {
      const response = await this.httpClient.get(`/wallet-bridge/transaction-status/${hash}`);
      return response.data as TransactionStatus;
    } catch (error) {
      return {
        hash,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Status check failed',
      };
    }
  }

  // Type-safe event emitter methods
  on<K extends keyof WalletBridgeEvents>(
    event: K, 
    listener: WalletBridgeEvents[K]
  ): this {
    return super.on(event, listener);
  }

  emit<K extends keyof WalletBridgeEvents>(
    event: K, 
    ...args: Parameters<WalletBridgeEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}

/**
 * Create a new SuperDapp Wallet Bridge instance
 * 
 * @param config - Bridge configuration
 * @returns SuperDappWalletBridge instance
 */
export function createWalletBridge(config: WalletBridgeConfig): SuperDappWalletBridge {
  return new SuperDappWalletBridge(config);
}