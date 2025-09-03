/**
 * Tests for Payouts Module Types
 *
 * Verifies that all payouts types are properly exported and importable
 * from the package root.
 */

import {
  ChainId,
  TokenInfo,
  WinnerRow,
  NormalizedWinner,
  PayoutManifest,
  PreparedTx,
  PreparedPayout,
} from '../index';

describe('Payouts Module Types', () => {
  test('should export ChainId type', () => {
    // Test that ChainId can be used as a type
    const chainId1: ChainId = 1;
    const chainId2: ChainId = 'ethereum';

    expect(typeof chainId1).toBe('number');
    expect(typeof chainId2).toBe('string');
  });

  test('should export TokenInfo interface', () => {
    const tokenInfo: TokenInfo = {
      address: '0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 1,
    };

    expect(tokenInfo.address).toBe(
      '0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8'
    );
    expect(tokenInfo.symbol).toBe('USDC');
    expect(tokenInfo.decimals).toBe(6);
  });

  test('should export WinnerRow interface', () => {
    const winnerRow: WinnerRow = {
      address: '0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66',
      amount: 1000,
      rank: 1,
      id: 'winner-1',
      metadata: { game: 'poker' },
    };

    expect(winnerRow.address).toBe(
      '0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66'
    );
    expect(winnerRow.rank).toBe(1);
    expect(winnerRow.metadata?.game).toBe('poker');
  });

  test('should export NormalizedWinner interface', () => {
    const tokenInfo: TokenInfo = {
      address: '0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 1,
    };

    const normalizedWinner: NormalizedWinner = {
      address: '0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66',
      amount: '1000000000', // 1000 USDC in wei
      rank: 1,
      id: 'winner-1',
      token: tokenInfo,
      metadata: { game: 'poker' },
    };

    expect(normalizedWinner.address).toBe(
      '0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66'
    );
    expect(normalizedWinner.amount).toBe('1000000000');
    expect(normalizedWinner.token.symbol).toBe('USDC');
  });

  test('should export PayoutManifest interface', () => {
    const tokenInfo: TokenInfo = {
      address: '0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 1,
    };

    const normalizedWinner: NormalizedWinner = {
      address: '0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66',
      amount: '1000000000',
      rank: 1,
      id: 'winner-1',
      token: tokenInfo,
      metadata: {},
    };

    const payoutManifest: PayoutManifest = {
      id: 'payout-123',
      winners: [normalizedWinner],
      token: tokenInfo,
      totalAmount: '1000000000',
      createdBy: '0x0000000000000000000000000000000000000000',
      createdAt: '2024-01-01T00:00:00Z',
      roundId: 'round-123',
      groupId: 'group-456',
      version: '1.0',
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      description: 'Test payout',
      totals: {
        amountWei: '1000000000'
      },
      options: {
        batchTransactions: true,
        gasStrategy: 'standard',
      },
    };

    expect(payoutManifest.id).toBe('payout-123');
    expect(payoutManifest.winners).toHaveLength(1);
    expect(payoutManifest.options?.gasStrategy).toBe('standard');
  });

  test('should export PreparedTx interface', () => {
    const preparedTx: PreparedTx = {
      to: '0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66',
      value: '1000000000',
      data: '0x',
      gasLimit: '21000',
      gasPrice: '20000000000',
      nonce: 42,
      chainId: 1,
      type: 2,
      maxFeePerGas: '25000000000',
      maxPriorityFeePerGas: '2000000000',
    };

    expect(preparedTx.to).toBe('0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66');
    expect(preparedTx.nonce).toBe(42);
    expect(preparedTx.type).toBe(2);
  });

  test('should export PreparedPayout interface', () => {
    const tokenInfo: TokenInfo = {
      address: '0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 1,
    };

    const preparedTx: PreparedTx = {
      to: '0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66',
      value: '1000000000',
      data: '0x',
      gasLimit: '21000',
      gasPrice: '20000000000',
      nonce: 42,
      chainId: 1,
    };

    const preparedPayout: PreparedPayout = {
      manifestId: 'payout-123',
      transactions: [preparedTx],
      estimatedGasCost: '420000000000000',
      preparedAt: '2024-01-01T00:00:00Z',
      summary: {
        recipientCount: 1,
        totalAmount: '1000000000',
        token: tokenInfo,
        estimatedDuration: '5 minutes',
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: ['Gas price is high'],
      },
    };

    expect(preparedPayout.manifestId).toBe('payout-123');
    expect(preparedPayout.transactions).toHaveLength(1);
    expect(preparedPayout.validation.isValid).toBe(true);
    expect(preparedPayout.validation.warnings).toContain('Gas price is high');
  });

  test('should allow importing PayoutManifest specifically', () => {
    // This test verifies the main requirement from the issue
    // that PayoutManifest can be imported as shown in the example
    const manifest: PayoutManifest = {
      id: 'test-manifest',
      winners: [],
      token: {
        address: '0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chainId: 1,
      },
      totalAmount: '0',
      createdBy: '0x0000000000000000000000000000000000000000',
      createdAt: '2024-01-01T00:00:00Z',
      roundId: 'round-123',
      groupId: 'group-456',
      version: '1.0',
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      totals: {
        amountWei: '0'
      }
    };

    expect(manifest).toBeDefined();
    expect(manifest.id).toBe('test-manifest');
  });
});
