/**
 * Integration Tests for Payouts Module
 *
 * Tests the complete payout flow: buildManifest → toCSV → preparePushTxs → executeTxPlan → reconcilePush
 * Verifies that all functions can be imported from the package root.
 */

import {
  buildManifest,
  toCSV,
  preparePushTxs,
  executeTxPlan,
  reconcilePush,
  TokenInfo,
  WinnerRow,
  ExecuteOptions,
  ReconcileResult,
} from '../index';

// Mock viem types for testing
interface MockWalletClient {
  sendTransaction: (tx: any) => Promise<`0x${string}`>;
}

interface MockPublicClient {
  waitForTransactionReceipt: (options: { hash: `0x${string}`; confirmations: number }) => Promise<{ status: 'success' | 'reverted' }>;
  getTransactionReceipt: (options: { hash: `0x${string}` }) => Promise<{
    status: 'success' | 'reverted';
    logs: Array<{
      topics: string[];
      data: string;
    }>;
  }>;
}

describe('Payouts Integration', () => {
  const mockToken: TokenInfo = {
    address: '0xa0b86A33e6441e7344C2C3Dd84A1ba8F3894e5D8', // USDC on Ethereum (properly checksummed)
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 1,
    isNative: false,
  };

  const mockWinners: WinnerRow[] = [
    {
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth (properly checksummed)
      amount: '100',
      rank: 1,
      id: 'winner-1',
    },
    {
      address: 'invalid-address', // Invalid address for testing
      amount: '50', 
      rank: 2,
      id: 'winner-2',
    },
    {
      address: '0x742D35Cc6584c0532e47a89c9Fdd3d3F8c6c1B66', // Another valid address (properly checksummed)
      amount: '25',
      rank: 3,
      id: 'winner-3',
    },
  ];

  const createMockWalletClient = (): MockWalletClient => ({
    async sendTransaction(tx: any): Promise<`0x${string}`> {
      // Simulate successful transaction with proper 64-character hash
      const hash = '0x' + '1234567890abcdef'.repeat(4); // Creates exactly 64 hex chars
      return hash as `0x${string}`;
    },
  });

  const createMockPublicClient = (): MockPublicClient => ({
    async waitForTransactionReceipt(options) {
      return { status: 'success' as const };
    },
    async getTransactionReceipt(options) {
      return {
        status: 'success' as const,
        logs: [
          {
            topics: [
              '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event
              '0x000000000000000000000000742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66', // from
              '0x000000000000000000000000742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66', // to (winner address)
            ],
            data: '0x0000000000000000000000000000000000000000000000000000000000000064', // amount (100 in hex)
          },
        ],
      };
    },
  });

  test('should complete full payout flow with happy path', async () => {
    // Step 1: Build manifest
    const buildResult = buildManifest(mockWinners, {
      token: mockToken,
      roundId: 'round-123',
      groupId: 'group-456',
    });

    expect(buildResult.manifest).toBeDefined();
    expect(buildResult.manifest.winners.length).toBeGreaterThan(0);
    expect(buildResult.rejectedAddresses.length).toBeGreaterThan(0); // One invalid address

    // Step 2: Export to CSV
    const csvData = toCSV(buildResult.manifest);

    expect(csvData).toContain('address,amountWei,symbol');
    expect(csvData.toLowerCase()).toContain('0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66');
    expect(csvData).toContain('USDC');

    // Step 3: Prepare push transactions
    const preparedPayout = preparePushTxs(buildResult.manifest, {
      token: mockToken,
      maxPerBatch: 2,
      singleApproval: true,
      airdrop: '0x2aACce8B9522F81F14834883198645BB6894Bfc0', // Provide a valid airdrop address
    });

    expect(preparedPayout.manifestId).toBe(buildResult.manifest.id);
    expect(preparedPayout.validation.isValid).toBe(true);
    expect(preparedPayout.transactions.length).toBeGreaterThan(0);

    // Step 4: Execute transaction plan (mocked)
    const mockWallet = createMockWalletClient();
    const mockPublic = createMockPublicClient();
    const executeOptions: ExecuteOptions = {
      wallet: mockWallet as any,
      publicClient: mockPublic as any,
      stopOnFail: false,
    };
    
    const hashes = await executeTxPlan(preparedPayout, executeOptions);

    expect(hashes.length).toBeGreaterThan(0);
    expect(hashes[0]).toMatch(/^0x[a-fA-F0-9]{64}$/);

    // Step 5: Reconcile push (mocked)  
    const reconcileResult = await reconcilePush(
      mockPublic as any,
      mockToken.address as `0x${string}`,
      buildResult.manifest,
      hashes
    );

    expect(reconcileResult.success).toBeDefined();
    expect(reconcileResult.totalAmountFound).toBeDefined();
    expect(reconcileResult.expectedTotalAmount).toBe(buildResult.manifest.totalAmount);
    expect(reconcileResult.details.successfulTransfers).toBeDefined();
  });

  test('should handle failed transactions in execution', async () => {
    // Create a mock wallet that throws errors
    const failingWallet: MockWalletClient = {
      async sendTransaction() {
        throw new Error('Network error');
      },
    };

    const buildResult = buildManifest([mockWinners[0]!], {
      token: mockToken,
      roundId: 'round-123',
      groupId: 'group-456',
    });

    const preparedPayout = preparePushTxs(buildResult.manifest, {
      token: mockToken,
      airdrop: '0x2aACce8B9522F81F14834883198645BB6894Bfc0', // Provide a valid airdrop address
    });

    const mockPublic = createMockPublicClient();
    const executeOptions: ExecuteOptions = {
      wallet: failingWallet as any,
      publicClient: mockPublic as any,
      stopOnFail: false,
    };

    const hashes = await executeTxPlan(preparedPayout, executeOptions);

    // Should return empty array when all transactions fail
    expect(hashes.length).toBe(0);
  });

  test('should import all required functions from package root', () => {
    // This test verifies the main requirement from the issue
    // that all functions can be imported from the package root
    expect(typeof buildManifest).toBe('function');
    expect(typeof toCSV).toBe('function');
    expect(typeof preparePushTxs).toBe('function');
    expect(typeof executeTxPlan).toBe('function');
    expect(typeof reconcilePush).toBe('function');
  });

  test('should export CSV with correct format', () => {
    const buildResult = buildManifest([mockWinners[0]!], {
      token: mockToken,
      roundId: 'round-123',
      groupId: 'group-456',
    });

    const csvData = toCSV(buildResult.manifest);
    
    // Test canonical format: address,amountWei,symbol,roundId,groupId
    expect(csvData).toContain('address,amountWei,symbol,roundId,groupId');
    expect(csvData.toLowerCase()).toContain('0xd8da6bf26964af9d7eed9e03e53415d37aa96045');
    expect(csvData).toContain('USDC');
    expect(csvData).toContain('round-123');
    expect(csvData).toContain('group-456');
  });
});