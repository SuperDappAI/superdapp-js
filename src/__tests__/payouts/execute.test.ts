/**
 * Tests for payouts execution module
 */

import { executeTxPlan, ExecuteOptions } from '../../payouts/execute';
import { PreparedPayout, PreparedTx, TokenInfo } from '../../payouts/types';

// Mock viem types
interface MockWalletClient {
  sendTransaction: jest.Mock;
}

interface MockPublicClient {
  waitForTransactionReceipt: jest.Mock;
}

describe('Payouts Execute Module', () => {
  let mockWallet: MockWalletClient;
  let mockPublicClient: MockPublicClient;
  let mockTokenInfo: TokenInfo;
  let mockPreparedTx: PreparedTx;
  let mockPreparedPayout: PreparedPayout;

  beforeEach(() => {
    // Reset mocks
    mockWallet = {
      sendTransaction: jest.fn(),
    };

    mockPublicClient = {
      waitForTransactionReceipt: jest.fn(),
    };

    mockTokenInfo = {
      address: '0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 1,
    };

    mockPreparedTx = {
      to: '0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66',
      value: '1000000',
      data: '0x',
      gasLimit: '21000',
      gasPrice: '20000000000',
      nonce: 1,
      chainId: 1,
      type: 2,
      maxFeePerGas: '25000000000',
      maxPriorityFeePerGas: '2000000000',
    };

    mockPreparedPayout = {
      manifestId: 'test-manifest-123',
      transactions: [mockPreparedTx],
      estimatedGasCost: '420000000000000',
      preparedAt: '2024-01-01T00:00:00Z',
      summary: {
        recipientCount: 1,
        totalAmount: '1000000',
        token: mockTokenInfo,
        estimatedDuration: '2 minutes',
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    };
  });

  describe('executeTxPlan', () => {
    test('should execute transactions successfully', async () => {
      const mockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockReceipt = { status: 'success' };

      mockWallet.sendTransaction.mockResolvedValue(mockHash);
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue(mockReceipt);

      const options: ExecuteOptions = {
        wallet: mockWallet as any,
        publicClient: mockPublicClient as any,
      };

      const result = await executeTxPlan(mockPreparedPayout, options);

      expect(result).toEqual([mockHash]);
      expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(1);
      expect(mockPublicClient.waitForTransactionReceipt).toHaveBeenCalledWith({
        hash: mockHash,
        confirmations: 1,
      });
    });

    test('should support txs field as alias for transactions', async () => {
      const mockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockReceipt = { status: 'success' };

      mockWallet.sendTransaction.mockResolvedValue(mockHash);
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue(mockReceipt);

      const payoutWithTxs = {
        ...mockPreparedPayout,
        txs: [mockPreparedTx],
        transactions: [], // Empty transactions array to test txs fallback
      };

      const options: ExecuteOptions = {
        wallet: mockWallet as any,
        publicClient: mockPublicClient as any,
      };

      const result = await executeTxPlan(payoutWithTxs, options);

      expect(result).toEqual([mockHash]);
      expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(1);
    });

    test('should call progress and receipt callbacks', async () => {
      const mockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockReceipt = { status: 'success' };
      const onProgress = jest.fn();
      const onReceipt = jest.fn();

      mockWallet.sendTransaction.mockResolvedValue(mockHash);
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue(mockReceipt);

      const options: ExecuteOptions = {
        wallet: mockWallet as any,
        publicClient: mockPublicClient as any,
        onProgress,
        onReceipt,
      };

      await executeTxPlan(mockPreparedPayout, options);

      expect(onProgress).toHaveBeenCalledTimes(2); // Before and after tx
      expect(onProgress).toHaveBeenNthCalledWith(1, 0, mockPreparedTx);
      expect(onProgress).toHaveBeenNthCalledWith(2, 0, mockPreparedTx, mockHash);
      expect(onReceipt).toHaveBeenCalledWith(0, mockHash);
    });

    test('should handle transaction reverts when not stopping on fail', async () => {
      const mockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockReceipt = { status: 'reverted' };

      mockWallet.sendTransaction.mockResolvedValue(mockHash);
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue(mockReceipt);

      const options: ExecuteOptions = {
        wallet: mockWallet as any,
        publicClient: mockPublicClient as any,
        stopOnFail: false,
      };

      const result = await executeTxPlan(mockPreparedPayout, options);

      expect(result).toEqual([mockHash]); // Hash is still returned even if reverted
      expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(1);
    });

    test('should stop execution on first failure when stopOnFail is true', async () => {
      const mockError = new Error('Transaction failed');
      mockWallet.sendTransaction.mockRejectedValue(mockError);

      const multiTxPayout = {
        ...mockPreparedPayout,
        transactions: [mockPreparedTx, { ...mockPreparedTx, nonce: 2 }],
      };

      const options: ExecuteOptions = {
        wallet: mockWallet as any,
        publicClient: mockPublicClient as any,
        stopOnFail: true,
      };

      await expect(executeTxPlan(multiTxPayout, options)).rejects.toThrow('Transaction failed');
      expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(1); // Should stop after first failure
    });

    test('should continue execution after failure when stopOnFail is false', async () => {
      const mockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockReceipt = { status: 'success' };

      // First transaction fails, second succeeds
      mockWallet.sendTransaction
        .mockRejectedValueOnce(new Error('First tx failed'))
        .mockResolvedValueOnce(mockHash);
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue(mockReceipt);

      const multiTxPayout = {
        ...mockPreparedPayout,
        transactions: [mockPreparedTx, { ...mockPreparedTx, nonce: 2 }],
      };

      const options: ExecuteOptions = {
        wallet: mockWallet as any,
        publicClient: mockPublicClient as any,
        stopOnFail: false,
      };

      const result = await executeTxPlan(multiTxPayout, options);

      expect(result).toEqual([mockHash]); // Only second transaction hash
      expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(2);
    });

    test('should throw error for empty transaction list', async () => {
      const emptyPayout = {
        ...mockPreparedPayout,
        transactions: [],
      };

      const options: ExecuteOptions = {
        wallet: mockWallet as any,
        publicClient: mockPublicClient as any,
      };

      await expect(executeTxPlan(emptyPayout, options)).rejects.toThrow(
        'No transactions to execute in the payout plan'
      );
    });

    test('should handle different transaction types correctly', async () => {
      const mockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockReceipt = { status: 'success' };

      // Test with legacy transaction (no type field)
      const legacyTx = { ...mockPreparedTx };
      delete legacyTx.type;
      delete legacyTx.maxFeePerGas;
      delete legacyTx.maxPriorityFeePerGas;

      const legacyPayout = {
        ...mockPreparedPayout,
        transactions: [legacyTx],
      };

      mockWallet.sendTransaction.mockResolvedValue(mockHash);
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue(mockReceipt);

      const options: ExecuteOptions = {
        wallet: mockWallet as any,
        publicClient: mockPublicClient as any,
      };

      const result = await executeTxPlan(legacyPayout, options);

      expect(result).toEqual([mockHash]);
      expect(mockWallet.sendTransaction).toHaveBeenCalledWith({
        to: legacyTx.to,
        value: BigInt(legacyTx.value),
        data: legacyTx.data,
        gas: BigInt(legacyTx.gasLimit),
        gasPrice: BigInt(legacyTx.gasPrice),
        nonce: legacyTx.nonce,
        type: "legacy",
      });
    });
  });
});