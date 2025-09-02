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
  MockSigner,
  MockProvider,
  TxExecutionResult,
} from '../index';

describe('Payouts Integration', () => {
  const mockToken: TokenInfo = {
    address: '0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 1,
  };

  const mockWinners: WinnerRow[] = [
    {
      address: '0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66',
      amount: '100',
      rank: 1,
      id: 'winner-1',
    },
    {
      address: '0x8ba1f109551bD432803012645Hac136c9.PJM',
      amount: '50', 
      rank: 2,
      id: 'winner-2',
    },
    {
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      amount: '25',
      rank: 3,
      id: 'winner-3',
    },
  ];

  const createMockSigner = (): MockSigner => ({
    async sendTransaction(tx) {
      // Simulate successful transaction for valid addresses
      const isValidAddress = tx.to.match(/^0x[a-fA-F0-9]{40}$/);
      
      if (isValidAddress) {
        return {
          hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          success: true,
          gasUsed: '21000',
          blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
        };
      } else {
        return {
          hash: '',
          success: false,
          error: 'Invalid recipient address',
        };
      }
    },
  });

  const createMockProvider = (): MockProvider => ({
    async getTransactionReceipt(hash: string) {
      if (hash) {
        return {
          status: true,
          blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
          gasUsed: '21000',
        };
      }
      return null;
    },
    async getBlockNumber() {
      return 18500000;
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
    const csvData = toCSV(buildResult.manifest, {
      includeHeader: true,
      includeMetadata: true,
    });

    expect(csvData).toContain('address,amount,rank');
    expect(csvData.toLowerCase()).toContain('0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66');
    expect(csvData).toContain('USDC');

    // Step 3: Prepare push transactions
    const preparedPayout = preparePushTxs(buildResult.manifest, {
      gasStrategy: 'standard',
      startingNonce: 42,
    });

    expect(preparedPayout.manifestId).toBe(buildResult.manifest.id);
    expect(preparedPayout.transactions.length).toBeGreaterThan(0);
    expect(preparedPayout.validation.isValid).toBe(true);

    // Step 4: Execute transaction plan (mocked)
    const mockSigner = createMockSigner();
    const executionPlan = await executeTxPlan(preparedPayout, mockSigner);

    expect(executionPlan.payoutId).toBe(preparedPayout.manifestId);
    expect(executionPlan.results.length).toBe(preparedPayout.transactions.length);
    expect(executionPlan.successCount).toBeGreaterThan(0);

    // Step 5: Reconcile push (mocked)
    const mockProvider = createMockProvider();
    const reconciliationReport = await reconcilePush(
      buildResult.manifest,
      executionPlan,
      mockProvider
    );

    expect(reconciliationReport.manifestId).toBe(buildResult.manifest.id);
    expect(reconciliationReport.transactions.length).toBe(buildResult.manifest.winners.length);
    expect(reconciliationReport.summary.totalTransactions).toBe(buildResult.manifest.winners.length);
    expect(['completed', 'partial', 'failed']).toContain(reconciliationReport.status);
  });

  test('should handle failed transactions in execution', async () => {
    // Create a mock signer that always fails
    const failingSigner: MockSigner = {
      async sendTransaction() {
        return {
          hash: '',
          success: false,
          error: 'Network error',
        };
      },
    };

    const buildResult = buildManifest([mockWinners[0]!], {
      token: mockToken,
      roundId: 'round-123',
      groupId: 'group-456',
    });

    const preparedPayout = preparePushTxs(buildResult.manifest);
    const executionPlan = await executeTxPlan(preparedPayout, failingSigner);

    expect(executionPlan.success).toBe(false);
    expect(executionPlan.failedCount).toBe(1);
    expect(executionPlan.successCount).toBe(0);

    const mockProvider = createMockProvider();
    const reconciliationReport = await reconcilePush(
      buildResult.manifest,
      executionPlan,
      mockProvider
    );

    expect(reconciliationReport.status).toBe('failed');
    expect(reconciliationReport.summary.failedTransactions).toBe(1);
    expect(reconciliationReport.summary.confirmedTransactions).toBe(0);
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

  test('should export CSV with custom options', () => {
    const buildResult = buildManifest([mockWinners[0]!], {
      token: mockToken,
      roundId: 'round-123',
      groupId: 'group-456',
    });

    // Test with no header
    const csvNoHeader = toCSV(buildResult.manifest, { includeHeader: false });
    expect(csvNoHeader).not.toContain('address,amount,rank');

    // Test with custom delimiter
    const csvPipe = toCSV(buildResult.manifest, { delimiter: '|' });
    expect(csvPipe).toContain('address|amount|rank');

    // Test without metadata
    const csvNoMetadata = toCSV(buildResult.manifest, { includeMetadata: false });
    expect(csvNoMetadata).not.toContain('metadata');
  });
});