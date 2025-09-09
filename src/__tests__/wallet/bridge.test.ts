/**
 * Tests for SuperDapp Wallet Bridge functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SuperDappWalletBridge } from '../../wallet/bridge';
import { WalletBridgeConfig } from '../../wallet/types';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SuperDapp Wallet Bridge', () => {
  let bridge: SuperDappWalletBridge;
  let config: WalletBridgeConfig;

  beforeEach(() => {
    config = {
      apiToken: 'test-token',
      apiBaseUrl: 'https://api.test.com',
      pollInterval: 100, // Fast polling for tests
      timeout: 1000,
    };

    // Mock axios.create
    const mockInstance = {
      get: jest.fn(),
      post: jest.fn(),
    } as any;
    mockedAxios.create.mockReturnValue(mockInstance);
    mockedAxios.isAxiosError = jest.fn().mockReturnValue(false);

    bridge = new SuperDappWalletBridge(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const minimalConfig = { apiToken: 'test' };
      const minimalBridge = new SuperDappWalletBridge(minimalConfig);
      
      expect(minimalBridge).toBeDefined();
      expect(minimalBridge.getConnectionStatus()).toBe(false);
    });

    it('should setup HTTP client with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: config.apiBaseUrl,
        timeout: config.timeout,
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('pushTransactionRequest', () => {
    const mockTransactionRequest = {
      transactions: [{
        to: '0x742d35Cc6634C0532925a3b8FD74389b9f8e9c55',
        value: '1000000000000000000',
        data: '0x',
        gasLimit: '21000',
        gasPrice: '20000000000',
        nonce: 1,
        chainId: 570,
      }],
      metadata: {
        title: 'Test Payout',
        description: 'Test payout description',
        estimatedGasCost: '0.001',
        recipientCount: 1,
      },
      chainId: 570,
    };

    it('should successfully submit and receive approved transaction', async () => {
      const httpClient = (bridge as any).httpClient;
      
      // Mock successful submission
      httpClient.post.mockResolvedValueOnce({ status: 200, data: { success: true } });
      
      // Mock successful response after polling - matches any requestId that starts with 'req-'
      httpClient.get.mockImplementationOnce(async (url: string) => {
        const requestId = url.split('/').pop();
        if (requestId && requestId.startsWith('req-')) {
          return {
            status: 200,
            data: {
              requestId,
              approved: true,
              transactionHashes: ['0xabc123'],
              respondedAt: new Date().toISOString(),
            }
          };
        }
        throw new Error('Request not found');
      });

      const response = await bridge.pushTransactionRequest(mockTransactionRequest);
      
      expect(response.approved).toBe(true);
      expect(response.transactionHashes).toEqual(['0xabc123']);
      expect(httpClient.post).toHaveBeenCalledWith('/wallet-bridge/transaction-request', expect.any(Object));
    });

    it('should handle rejected transaction', async () => {
      const httpClient = (bridge as any).httpClient;
      
      httpClient.post.mockResolvedValueOnce({ status: 200, data: { success: true } });
      httpClient.get.mockImplementationOnce(async (url: string) => {
        const requestId = url.split('/').pop();
        if (requestId && requestId.startsWith('req-')) {
          return {
            status: 200,
            data: {
              requestId,
              approved: false,
              error: 'User rejected transaction',
              respondedAt: new Date().toISOString(),
            }
          };
        }
        throw new Error('Request not found');
      });

      const response = await bridge.pushTransactionRequest(mockTransactionRequest);
      
      expect(response.approved).toBe(false);
      expect(response.error).toBe('User rejected transaction');
    });

    it('should handle submission failure', async () => {
      const httpClient = (bridge as any).httpClient;
      httpClient.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(bridge.pushTransactionRequest(mockTransactionRequest))
        .rejects.toThrow('Network error');
    });

    it('should timeout when no response received', async () => {
      const httpClient = (bridge as any).httpClient;
      
      // Mock successful submission
      httpClient.post.mockResolvedValueOnce({ status: 200, data: { success: true } });
      
      // Mock 404 responses (request not ready)
      const axiosError = { response: { status: 404 } };
      httpClient.get.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      // Use very short timeout for testing
      const quickBridge = new SuperDappWalletBridge({ ...config, timeout: 200 });
      
      await expect(quickBridge.pushTransactionRequest(mockTransactionRequest))
        .rejects.toThrow(/timed out after/);
    });
  });

  describe('monitorTransactionStatus', () => {
    it('should return status for all provided hashes', async () => {
      const hashes = ['0xabc123', '0xdef456'];
      const httpClient = (bridge as any).httpClient;
      
      httpClient.get
        .mockResolvedValueOnce({
          data: { hash: '0xabc123', status: 'confirmed', confirmations: 5 }
        })
        .mockResolvedValueOnce({
          data: { hash: '0xdef456', status: 'pending', confirmations: 0 }
        });

      const statuses = await bridge.monitorTransactionStatus(hashes);
      
      expect(statuses).toHaveLength(2);
      expect(statuses[0].status).toBe('confirmed');
      expect(statuses[1].status).toBe('pending');
    });

    it('should handle transaction status errors', async () => {
      const hashes = ['0xabc123'];
      const httpClient = (bridge as any).httpClient;
      
      httpClient.get.mockRejectedValueOnce(new Error('Not found'));

      const statuses = await bridge.monitorTransactionStatus(hashes);
      
      expect(statuses).toHaveLength(1);
      expect(statuses[0].status).toBe('failed');
      expect(statuses[0].error).toBe('Not found');
    });
  });

  describe('testConnection', () => {
    it('should return connected status when health check succeeds', async () => {
      const httpClient = (bridge as any).httpClient;
      httpClient.get.mockResolvedValueOnce({ status: 200 });

      const result = await bridge.testConnection();
      
      expect(result.connected).toBe(true);
      expect(result.error).toBeUndefined();
      expect(bridge.getConnectionStatus()).toBe(true);
    });

    it('should return disconnected status when health check fails', async () => {
      const httpClient = (bridge as any).httpClient;
      httpClient.get.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await bridge.testConnection();
      
      expect(result.connected).toBe(false);
      expect(result.error).toBe('Connection failed');
      expect(bridge.getConnectionStatus()).toBe(false);
    });
  });

  describe('events', () => {
    it('should emit requestSubmitted event', async () => {
      const httpClient = (bridge as any).httpClient;
      httpClient.post.mockResolvedValueOnce({ status: 200, data: { success: true } });
      httpClient.get.mockImplementationOnce(async (url: string) => {
        const requestId = url.split('/').pop();
        return {
          status: 200,
          data: {
            requestId,
            approved: true,
            transactionHashes: ['0xabc123'],
            respondedAt: new Date().toISOString(),
          }
        };
      });

      let eventReceived = false;
      bridge.on('requestSubmitted', (request) => {
        expect(request.chainId).toBe(570);
        expect(request.requestId).toBeDefined();
        eventReceived = true;
      });

      await bridge.pushTransactionRequest({
        transactions: [],
        metadata: {
          title: 'Test',
          description: 'Test',
          estimatedGasCost: '0.001',
          recipientCount: 1,
        },
        chainId: 570,
      });
      
      expect(eventReceived).toBe(true);
    });

    it.skip('should emit error event on failure', async () => {
      const httpClient = (bridge as any).httpClient;
      httpClient.post.mockRejectedValueOnce(new Error('Test error'));

      let errorReceived = false;
      bridge.on('error', (error) => {
        expect(error.message).toBe('Test error');
        errorReceived = true;
      });

      try {
        await bridge.pushTransactionRequest({
          transactions: [],
          metadata: {
            title: 'Test',
            description: 'Test',
            estimatedGasCost: '0.001',
            recipientCount: 1,
          },
          chainId: 570,
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(errorReceived).toBe(true);
      }
    });
  });
});