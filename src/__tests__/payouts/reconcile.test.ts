/**
 * Tests for payouts reconciliation module
 */

import { reconcilePush, quickReconcileCheck, ReconcileResult } from '../../payouts/reconcile';
import { PayoutManifest, TokenInfo, NormalizedWinner } from '../../payouts/types';

// Mock viem types
interface MockPublicClient {
  getTransactionReceipt: jest.Mock;
}

describe('Payouts Reconcile Module', () => {
  let mockPublicClient: MockPublicClient;
  let mockTokenInfo: TokenInfo;
  let mockWinner: NormalizedWinner;
  let mockManifest: PayoutManifest;

  beforeEach(() => {
    mockPublicClient = {
      getTransactionReceipt: jest.fn(),
    };

    mockTokenInfo = {
      address: '0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 1,
    };

    mockWinner = {
      address: '0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66',
      amount: '1000000',
      rank: 1,
      id: 'winner-1',
      token: mockTokenInfo,
      metadata: {},
    };

    mockManifest = {
      id: 'manifest-123',
      winners: [mockWinner],
      token: mockTokenInfo,
      totalAmount: '1000000',
      createdBy: '0x0000000000000000000000000000000000000000',
      createdAt: '2024-01-01T00:00:00Z',
      roundId: 'round-123',
      groupId: 'group-456',
      version: '1.0',
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    };
  });

  describe('reconcilePush', () => {
    test('should successfully reconcile when all transfers match', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockReceipt = {
        status: 'success',
        logs: [
          {
            topics: [
              '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event signature
              '0x000000000000000000000000' + '0000000000000000000000000000000000000000'.slice(-40), // from
              '0x000000000000000000000000' + mockWinner.address.slice(2).toLowerCase(), // to
            ],
            data: '0x' + BigInt(mockWinner.amount).toString(16).padStart(64, '0'), // amount
          },
        ],
      };

      mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await reconcilePush(
        mockPublicClient as any,
        mockTokenInfo.address as `0x${string}`,
        mockManifest,
        [txHash as `0x${string}`]
      );

      expect(result.success).toBe(true);
      expect(result.totalAmountFound).toBe(mockWinner.amount);
      expect(result.expectedTotalAmount).toBe(mockManifest.totalAmount);
      expect(result.recipientsFound).toBe(1);
      expect(result.expectedRecipients).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(result.details.successfulTransfers).toHaveLength(1);
      expect(result.details.missingTransfers).toHaveLength(0);
    });

    test('should detect missing transfers', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockReceipt = {
        status: 'success',
        logs: [], // No transfer logs
      };

      mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await reconcilePush(
        mockPublicClient as any,
        mockTokenInfo.address as `0x${string}`,
        mockManifest,
        [txHash as `0x${string}`]
      );

      expect(result.success).toBe(false);
      expect(result.totalAmountFound).toBe('0');
      expect(result.recipientsFound).toBe(0);
      expect(result.details.successfulTransfers).toHaveLength(0);
      expect(result.details.missingTransfers).toHaveLength(1);
      expect(result.details.missingTransfers[0]?.recipient).toBe(mockWinner.address.toLowerCase());
      expect(result.details.missingTransfers[0]?.expectedAmount).toBe(mockWinner.amount);
    });

    test('should detect amount mismatches', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const wrongAmount = '500000'; // Different from expected amount
      const mockReceipt = {
        status: 'success',
        logs: [
          {
            topics: [
              '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
              '0x000000000000000000000000' + '0000000000000000000000000000000000000000'.slice(-40),
              '0x000000000000000000000000' + mockWinner.address.slice(2).toLowerCase(),
            ],
            data: '0x' + BigInt(wrongAmount).toString(16).padStart(64, '0'),
          },
        ],
      };

      mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await reconcilePush(
        mockPublicClient as any,
        mockTokenInfo.address as `0x${string}`,
        mockManifest,
        [txHash as `0x${string}`]
      );

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Amount mismatch');
    });

    test('should handle reverted transactions', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockReceipt = {
        status: 'reverted',
        logs: [],
      };

      mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await reconcilePush(
        mockPublicClient as any,
        mockTokenInfo.address as `0x${string}`,
        mockManifest,
        [txHash as `0x${string}`]
      );

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('was reverted');
    });

    test('should handle multiple transactions', async () => {
      const mockWinner2 = {
        ...mockWinner,
        address: '0x853d35Cc6584C0532E47A89C9FDD3d3F8c6c1b77',
        amount: '500000',
        id: 'winner-2',
      };

      const manifestWithMultiple = {
        ...mockManifest,
        winners: [mockWinner, mockWinner2],
        totalAmount: '1500000',
      };

      const txHash1 = '0x1111111111111111111111111111111111111111111111111111111111111111';
      const txHash2 = '0x2222222222222222222222222222222222222222222222222222222222222222';

      const mockReceipt1 = {
        status: 'success',
        logs: [
          {
            topics: [
              '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
              '0x000000000000000000000000' + '0000000000000000000000000000000000000000'.slice(-40),
              '0x000000000000000000000000' + mockWinner.address.slice(2).toLowerCase(),
            ],
            data: '0x' + BigInt(mockWinner.amount).toString(16).padStart(64, '0'),
          },
        ],
      };

      const mockReceipt2 = {
        status: 'success',
        logs: [
          {
            topics: [
              '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
              '0x000000000000000000000000' + '0000000000000000000000000000000000000000'.slice(-40),
              '0x000000000000000000000000' + mockWinner2.address.slice(2).toLowerCase(),
            ],
            data: '0x' + BigInt(mockWinner2.amount).toString(16).padStart(64, '0'),
          },
        ],
      };

      mockPublicClient.getTransactionReceipt
        .mockResolvedValueOnce(mockReceipt1)
        .mockResolvedValueOnce(mockReceipt2);

      const result = await reconcilePush(
        mockPublicClient as any,
        mockTokenInfo.address as `0x${string}`,
        manifestWithMultiple,
        [txHash1 as `0x${string}`, txHash2 as `0x${string}`]
      );

      expect(result.success).toBe(true);
      expect(result.totalAmountFound).toBe('1500000');
      expect(result.recipientsFound).toBe(2);
      expect(result.details.successfulTransfers).toHaveLength(2);
      expect(result.details.missingTransfers).toHaveLength(0);
    });

    test('should handle empty transaction hash array', async () => {
      const result = await reconcilePush(
        mockPublicClient as any,
        mockTokenInfo.address as `0x${string}`,
        mockManifest,
        []
      );

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('No transaction hashes provided');
    });

    test('should handle transaction receipt fetch errors', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      mockPublicClient.getTransactionReceipt.mockRejectedValue(new Error('Network error'));

      const result = await reconcilePush(
        mockPublicClient as any,
        mockTokenInfo.address as `0x${string}`,
        mockManifest,
        [txHash as `0x${string}`]
      );

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to analyze transaction');
    });

    test('should ignore non-transfer events', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockReceipt = {
        status: 'success',
        logs: [
          {
            topics: [
              '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925', // Approval event (different signature)
              '0x000000000000000000000000' + '0000000000000000000000000000000000000000'.slice(-40),
              '0x000000000000000000000000' + mockWinner.address.slice(2).toLowerCase(),
            ],
            data: '0x' + BigInt(mockWinner.amount).toString(16).padStart(64, '0'),
          },
        ],
      };

      mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await reconcilePush(
        mockPublicClient as any,
        mockTokenInfo.address as `0x${string}`,
        mockManifest,
        [txHash as `0x${string}`]
      );

      expect(result.success).toBe(false);
      expect(result.totalAmountFound).toBe('0');
      expect(result.details.successfulTransfers).toHaveLength(0);
      expect(result.details.missingTransfers).toHaveLength(1);
    });
  });

  describe('quickReconcileCheck', () => {
    test('should return true for successful reconciliation', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockReceipt = {
        status: 'success',
        logs: [
          {
            topics: [
              '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
              '0x000000000000000000000000' + '0000000000000000000000000000000000000000'.slice(-40),
              '0x000000000000000000000000' + mockWinner.address.slice(2).toLowerCase(),
            ],
            data: '0x' + BigInt(mockWinner.amount).toString(16).padStart(64, '0'),
          },
        ],
      };

      mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await quickReconcileCheck(
        mockPublicClient as any,
        mockManifest,
        [txHash as `0x${string}`]
      );

      expect(result).toBe(true);
    });

    test('should return false for failed reconciliation', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockReceipt = {
        status: 'success',
        logs: [], // No transfers
      };

      mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await quickReconcileCheck(
        mockPublicClient as any,
        mockManifest,
        [txHash as `0x${string}`]
      );

      expect(result).toBe(false);
    });

    test('should return false on errors', async () => {
      mockPublicClient.getTransactionReceipt.mockRejectedValue(new Error('Network error'));

      const result = await quickReconcileCheck(
        mockPublicClient as any,
        mockManifest,
        ['0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`]
      );

      expect(result).toBe(false);
    });
  });
});