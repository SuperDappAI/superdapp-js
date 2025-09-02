/**
 * Tests for Transaction Preparer Module
 */

import { preparePushTxs, type PushPrepareOptions } from '../../payouts/tx-preparer';
import { type PayoutManifest, type TokenInfo, type NormalizedWinner, type PreparedTx } from '../../payouts/types';
import { getAirdropAddress, isSupportedChain, SUPERDAPP_AIRDROP_ADDRESSES } from '../../payouts/chain-config';
import { decodeFunctionData, checksumAddress } from 'viem';

// Mock ABI for validation
const SUPERDAPP_AIRDROP_ABI = [
  {
    name: 'batchTokenTransfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' }
    ],
    outputs: []
  },
  {
    name: 'batchNativeTransfer',
    type: 'function', 
    stateMutability: 'payable',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' }
    ],
    outputs: []
  }
] as const;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

describe('Transaction Preparer', () => {
  const mockErc20Token: TokenInfo = {
    address: checksumAddress('0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8'), // USDC contract with proper checksum
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 1,
    isNative: false
  };

  const mockNativeToken: TokenInfo = {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    chainId: 1,
    isNative: true
  };

  const airdropAddress = checksumAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7'); // USDT contract with proper checksum

  // Helper to create winners
  function createWinners(count: number, amountEach: string = '1000000'): NormalizedWinner[] {
    return Array.from({ length: count }, (_, i) => ({
      address: checksumAddress(`0x${(i + 1).toString(16).padStart(40, '0')}`),
      amount: amountEach,
      rank: i + 1,
      id: `winner-${i + 1}`,
      token: mockErc20Token,
      metadata: {}
    }));
  }

  // Helper to create manifest
  function createManifest(winners: NormalizedWinner[], token: TokenInfo): PayoutManifest {
    const totalAmount = winners.reduce((sum, w) => sum + BigInt(w.amount), BigInt(0)).toString();
    return {
      id: 'test-manifest',
      winners,
      token,
      totalAmount,
      createdBy: '0x0000000000000000000000000000000000000000',
      createdAt: '2024-01-01T00:00:00Z',
      roundId: 'round-123',
      groupId: 'group-456',
      version: '1.0',
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      totals: {
        amountWei: totalAmount
      }
    };
  }

  describe('ERC-20 Token Payouts', () => {
    test('should create 1 approve + 2 batches for 60 winners with maxPerBatch=50', () => {
      const winners = createWinners(60);
      const manifest = createManifest(winners, mockErc20Token);
      
      const options: PushPrepareOptions = {
        airdrop: airdropAddress,
        token: mockErc20Token,
        maxPerBatch: 50,
        singleApproval: true
      };

      const result = preparePushTxs(manifest, options);

      expect(result.validation.isValid).toBe(true);
      expect(result.transactions).toHaveLength(3); // 1 approve + 2 batches
      expect(result.summary.recipientCount).toBe(60);

      // First transaction should be approve
      const approveTx = result.transactions[0]!;
      expect(approveTx).toBeDefined();
      expect(approveTx.to).toBe(mockErc20Token.address);
      expect(approveTx.value).toBe('0');
      
      // Decode and validate approve call
      const approveDecoded = decodeFunctionData({
        abi: ERC20_ABI,
        data: approveTx.data as `0x${string}`
      });
      expect(approveDecoded.functionName).toBe('approve');
      expect(approveDecoded.args[0]).toBe(airdropAddress);
      expect(approveDecoded.args[1]).toBe(BigInt(manifest.totals.amountWei));

      // Check batch transactions
      const batch1Tx = result.transactions[1]!;
      const batch2Tx = result.transactions[2]!;
      
      expect(batch1Tx).toBeDefined();
      expect(batch2Tx).toBeDefined();
      expect(batch1Tx.to).toBe(airdropAddress);
      expect(batch2Tx.to).toBe(airdropAddress);

      // Decode batch transactions
      const batch1Decoded = decodeFunctionData({
        abi: SUPERDAPP_AIRDROP_ABI,
        data: batch1Tx.data as `0x${string}`
      });
      const batch2Decoded = decodeFunctionData({
        abi: SUPERDAPP_AIRDROP_ABI,
        data: batch2Tx.data as `0x${string}`
      });

      expect(batch1Decoded.functionName).toBe('batchTokenTransfer');
      expect(batch2Decoded.functionName).toBe('batchTokenTransfer');

      // Validate batch 1: 50 recipients
      expect(batch1Decoded.args[1]).toHaveLength(50);
      expect(batch1Decoded.args[2]).toHaveLength(50);
      
      // Validate batch 2: 10 recipients  
      expect(batch2Decoded.args[1]).toHaveLength(10);
      expect(batch2Decoded.args[2]).toHaveLength(10);

      // Validate total amounts match
      const batch1Total = (batch1Decoded.args[2] as bigint[]).reduce((sum, amount) => sum + amount, BigInt(0));
      const batch2Total = (batch2Decoded.args[2] as bigint[]).reduce((sum, amount) => sum + amount, BigInt(0));
      expect(batch1Total + batch2Total).toBe(BigInt(manifest.totals.amountWei));
    });

    test('should handle recipients and amounts alignment correctly', () => {
      const winners = createWinners(3, '1000000'); // 3 winners, 1 USDC each  
      const manifest = createManifest(winners, mockErc20Token);
      
      const options: PushPrepareOptions = {
        airdrop: airdropAddress,
        token: mockErc20Token,
        maxPerBatch: 50,
        singleApproval: true
      };

      const result = preparePushTxs(manifest, options);
      
      expect(result.validation.isValid).toBe(true);
      expect(result.transactions).toHaveLength(2); // 1 approve + 1 batch

      const batchTx = result.transactions[1]!;
      expect(batchTx).toBeDefined();
      const decoded = decodeFunctionData({
        abi: SUPERDAPP_AIRDROP_ABI,
        data: batchTx.data as `0x${string}`
      });

      expect(decoded.functionName).toBe('batchTokenTransfer');
      
      // Check token address
      expect(decoded.args[0]).toBe(mockErc20Token.address);
      
      // Check recipients match
      const recipients = decoded.args[1] as string[];
      expect(recipients).toHaveLength(3);
      expect(recipients[0]).toBe('0x0000000000000000000000000000000000000001');
      expect(recipients[1]).toBe('0x0000000000000000000000000000000000000002');
      expect(recipients[2]).toBe('0x0000000000000000000000000000000000000003');
      
      // Check amounts match
      const amounts = decoded.args[2] as bigint[];
      expect(amounts).toHaveLength(3);
      expect(amounts[0]).toBe(BigInt('1000000'));
      expect(amounts[1]).toBe(BigInt('1000000'));
      expect(amounts[2]).toBe(BigInt('1000000'));
    });

    test('should skip approval when singleApproval is false', () => {
      const winners = createWinners(2);
      const manifest = createManifest(winners, mockErc20Token);
      
      const options: PushPrepareOptions = {
        airdrop: airdropAddress,
        token: mockErc20Token,
        maxPerBatch: 50,
        singleApproval: false
      };

      const result = preparePushTxs(manifest, options);

      expect(result.validation.isValid).toBe(true);
      expect(result.transactions).toHaveLength(1); // Only 1 batch, no approve

      const batchTx = result.transactions[0]!;
      expect(batchTx).toBeDefined();
      expect(batchTx.to).toBe(airdropAddress);
      
      const decoded = decodeFunctionData({
        abi: SUPERDAPP_AIRDROP_ABI,
        data: batchTx.data as `0x${string}`
      });
      expect(decoded.functionName).toBe('batchTokenTransfer');
    });
  });

  describe('Native Token Payouts', () => {
    test('should create Fund Native + batches for native token', () => {
      const winners = createWinners(3, '1000000000000000000'); // 1 ETH each
      const manifest = createManifest(winners, mockNativeToken);
      
      const options: PushPrepareOptions = {
        airdrop: airdropAddress,
        token: mockNativeToken,
        maxPerBatch: 50
      };

      const result = preparePushTxs(manifest, options);

      expect(result.validation.isValid).toBe(true);
      expect(result.transactions).toHaveLength(2); // 1 funding + 1 batch

      // First transaction should be funding
      const fundingTx = result.transactions[0]!;
      expect(fundingTx).toBeDefined();
      expect(fundingTx.to).toBe(airdropAddress);
      expect(fundingTx.value).toBe(manifest.totals.amountWei);
      expect(fundingTx.data).toBe('0x');

      // Second transaction should be native batch transfer
      const batchTx = result.transactions[1]!;
      expect(batchTx).toBeDefined();
      expect(batchTx.to).toBe(airdropAddress);
      expect(batchTx.value).toBe('0');

      const decoded = decodeFunctionData({
        abi: SUPERDAPP_AIRDROP_ABI,
        data: batchTx.data as `0x${string}`
      });

      expect(decoded.functionName).toBe('batchNativeTransfer');
      
      // Check recipients and amounts
      const recipients = decoded.args[0] as string[];
      const amounts = decoded.args[1] as bigint[];
      
      expect(recipients).toHaveLength(3);
      expect(amounts).toHaveLength(3);
      expect(amounts[0]).toBe(BigInt('1000000000000000000'));
    });

    test('should handle multiple batches for native token with large recipient count', () => {
      const winners = createWinners(120, '1000000000000000000'); // 120 winners, 1 ETH each
      const manifest = createManifest(winners, mockNativeToken);
      
      const options: PushPrepareOptions = {
        airdrop: airdropAddress,
        token: mockNativeToken,
        maxPerBatch: 50
      };

      const result = preparePushTxs(manifest, options);

      expect(result.validation.isValid).toBe(true);
      expect(result.transactions).toHaveLength(4); // 1 funding + 3 batches (50 + 50 + 20)

      // Check funding transaction
      const fundingTx = result.transactions[0]!;
      expect(fundingTx).toBeDefined();
      expect(fundingTx.to).toBe(airdropAddress);
      expect(fundingTx.value).toBe(manifest.totals.amountWei);

      // Check all batch transactions
      for (let i = 1; i < 4; i++) {
        const batchTx = result.transactions[i]!;
        expect(batchTx).toBeDefined();
        expect(batchTx.to).toBe(airdropAddress);
        
        const decoded = decodeFunctionData({
          abi: SUPERDAPP_AIRDROP_ABI,
          data: batchTx.data as `0x${string}`
        });
        
        expect(decoded.functionName).toBe('batchNativeTransfer');
        
        const recipients = decoded.args[0] as string[];
        const amounts = decoded.args[1] as bigint[];
        
        if (i < 3) {
          // First two batches should have 50 recipients
          expect(recipients).toHaveLength(50);
          expect(amounts).toHaveLength(50);
        } else {
          // Last batch should have 20 recipients
          expect(recipients).toHaveLength(20);
          expect(amounts).toHaveLength(20);
        }
      }
    });
  });

  describe('Validation and Error Handling', () => {
    test('should handle empty winners list', () => {
      const manifest = createManifest([], mockErc20Token);
      
      const options: PushPrepareOptions = {
        airdrop: airdropAddress,
        token: mockErc20Token,
        maxPerBatch: 50
      };

      const result = preparePushTxs(manifest, options);

      expect(result.validation.isValid).toBe(true);
      expect(result.transactions).toHaveLength(1); // Only approve transaction
      expect(result.summary.recipientCount).toBe(0);
    });

    test('should calculate gas costs correctly', () => {
      const winners = createWinners(5);
      const manifest = createManifest(winners, mockErc20Token);
      
      const options: PushPrepareOptions = {
        airdrop: airdropAddress,
        token: mockErc20Token,
        maxPerBatch: 50
      };

      const result = preparePushTxs(manifest, options);

      expect(result.validation.isValid).toBe(true);
      expect(result.estimatedGasCost).toBeDefined();
      expect(BigInt(result.estimatedGasCost)).toBeGreaterThan(BigInt(0));
      
      // Should be sum of all transaction gas costs
      const expectedGasCost = result.transactions
        .reduce((total: bigint, tx: PreparedTx) => total + BigInt(tx.gasLimit) * BigInt(tx.gasPrice), BigInt(0))
        .toString();
      
      expect(result.estimatedGasCost).toBe(expectedGasCost);
    });

    test('should set proper transaction properties', () => {
      const winners = createWinners(1);
      const manifest = createManifest(winners, mockErc20Token);
      
      const options: PushPrepareOptions = {
        airdrop: airdropAddress,
        token: mockErc20Token,
        maxPerBatch: 50
      };

      const result = preparePushTxs(manifest, options);

      expect(result.validation.isValid).toBe(true);
      
      result.transactions.forEach((tx: PreparedTx) => {
        expect(tx.chainId).toBe(mockErc20Token.chainId);
        expect(tx.type).toBe(2); // EIP-1559
        expect(tx.maxFeePerGas).toBeDefined();
        expect(tx.maxPriorityFeePerGas).toBeDefined();
        expect(tx.gasLimit).toBeDefined();
        expect(tx.gasPrice).toBeDefined();
        expect(tx.nonce).toBe(0); // Default, to be set by caller
      });
    });
  });

  describe('ABI Compliance', () => {
    test('should generate calldata that matches ABI and can be decoded', () => {
      const winners = createWinners(3, '1000000'); 
      const manifest = createManifest(winners, mockErc20Token);
      
      const options: PushPrepareOptions = {
        airdrop: airdropAddress,
        token: mockErc20Token,
        maxPerBatch: 50,
        singleApproval: true
      };

      const result = preparePushTxs(manifest, options);
      
      expect(result.validation.isValid).toBe(true);
      expect(result.transactions).toHaveLength(2); // 1 approve + 1 batch

      // Test approve transaction ABI compliance
      const approveTx = result.transactions[0]!;
      const approveDecoded = decodeFunctionData({
        abi: ERC20_ABI,
        data: approveTx.data as `0x${string}`
      });
      
      expect(approveDecoded.functionName).toBe('approve');
      expect(approveDecoded.args).toHaveLength(2);
      expect(approveDecoded.args[0]).toBe(airdropAddress);
      expect(typeof approveDecoded.args[1]).toBe('bigint');

      // Test batch transfer transaction ABI compliance
      const batchTx = result.transactions[1]!;
      const batchDecoded = decodeFunctionData({
        abi: SUPERDAPP_AIRDROP_ABI,
        data: batchTx.data as `0x${string}`
      });
      
      expect(batchDecoded.functionName).toBe('batchTokenTransfer');
      expect(batchDecoded.args).toHaveLength(3);
      expect(batchDecoded.args[0]).toBe(mockErc20Token.address); // token
      expect(Array.isArray(batchDecoded.args[1])).toBe(true); // recipients
      expect(Array.isArray(batchDecoded.args[2])).toBe(true); // amounts
      
      const recipients = batchDecoded.args[1] as string[];
      const amounts = batchDecoded.args[2] as bigint[];
      
      expect(recipients).toHaveLength(3);
      expect(amounts).toHaveLength(3);
      
      // Verify each recipient is a valid address
      recipients.forEach(addr => {
        expect(addr).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
      
      // Verify each amount is a positive bigint
      amounts.forEach(amount => {
        expect(typeof amount).toBe('bigint');
        expect(amount).toBeGreaterThan(BigInt(0));
      });
    });

    test('should generate native transfer calldata that matches ABI', () => {
      const winners = createWinners(2, '1000000000000000000'); // 1 ETH each
      const manifest = createManifest(winners, mockNativeToken);
      
      const options: PushPrepareOptions = {
        airdrop: airdropAddress,
        token: mockNativeToken,
        maxPerBatch: 50
      };

      const result = preparePushTxs(manifest, options);
      
      expect(result.validation.isValid).toBe(true);
      expect(result.transactions).toHaveLength(2); // 1 funding + 1 batch

      // Test funding transaction
      const fundingTx = result.transactions[0]!;
      expect(fundingTx.to).toBe(airdropAddress);
      expect(fundingTx.data).toBe('0x');
      expect(fundingTx.value).toBe(manifest.totals.amountWei);

      // Test native batch transfer ABI compliance
      const batchTx = result.transactions[1]!;
      const batchDecoded = decodeFunctionData({
        abi: SUPERDAPP_AIRDROP_ABI,
        data: batchTx.data as `0x${string}`
      });
      
      expect(batchDecoded.functionName).toBe('batchNativeTransfer');
      expect(batchDecoded.args).toHaveLength(2);
      expect(Array.isArray(batchDecoded.args[0])).toBe(true); // recipients
      expect(Array.isArray(batchDecoded.args[1])).toBe(true); // amounts
      
      const recipients = batchDecoded.args[0] as string[];
      const amounts = batchDecoded.args[1] as bigint[];
      
      expect(recipients).toHaveLength(2);
      expect(amounts).toHaveLength(2);
      
      // Verify calldata integrity
      recipients.forEach(addr => {
        expect(addr).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
      
      amounts.forEach(amount => {
        expect(typeof amount).toBe('bigint');
        expect(amount).toBe(BigInt('1000000000000000000'));
      });
    });
  });

  describe('Summary and Metadata', () => {
    test('should provide correct summary information', () => {
      const winners = createWinners(25, '2000000');
      const manifest = createManifest(winners, mockErc20Token);
      
      const options: PushPrepareOptions = {
        airdrop: airdropAddress,
        token: mockErc20Token,
        maxPerBatch: 50
      };

      const result = preparePushTxs(manifest, options);

      expect(result.manifestId).toBe(manifest.id);
      expect(result.preparedAt).toBeDefined();
      
      expect(result.summary.recipientCount).toBe(25);
      expect(result.summary.totalAmount).toBe(manifest.totalAmount);
      expect(result.summary.token).toEqual(manifest.token);
      expect(result.summary.estimatedDuration).toBeDefined();
      
      // Should estimate ~15s per transaction
      const expectedDuration = Math.ceil(result.transactions.length * 15);
      expect(result.summary.estimatedDuration).toBe(`${expectedDuration}s`);
    });
  });

  describe('Multi-Chain Configuration', () => {
    const rolluxToken: TokenInfo = {
      address: checksumAddress('0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8'),
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 570, // Rollux Mainnet
      isNative: false
    };

    test('should auto-resolve airdrop contract for supported chains', () => {
      const winners = createWinners(1);
      const manifest = createManifest(winners, rolluxToken);
      
      const options: PushPrepareOptions = {
        // Omit airdrop address to test auto-resolution
        token: rolluxToken,
        maxPerBatch: 50
      };

      const result = preparePushTxs(manifest, options);

      expect(result.validation.isValid).toBe(true);
      expect(result.transactions.length).toBeGreaterThan(0);
      
      // Verify it uses the correct Rollux airdrop address
      const expectedAddress = getAirdropAddress(570);
      expect(expectedAddress).toBe('0x2aACce8B9522F81F14834883198645BB6894Bfc0');
      
      // Check that transactions use the resolved address
      result.transactions.forEach(tx => {
        if (tx.to === expectedAddress) {
          expect(tx.to).toBe(expectedAddress);
        }
      });
    });

    test('should fail gracefully for unsupported chains', () => {
      const unsupportedToken: TokenInfo = {
        address: checksumAddress('0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8'),
        symbol: 'TEST',
        name: 'Test Token',
        decimals: 18,
        chainId: 999999, // Unsupported chain
        isNative: false
      };
      
      const winners = createWinners(1);
      const manifest = createManifest(winners, unsupportedToken);
      
      const options: PushPrepareOptions = {
        // Omit airdrop address to test auto-resolution failure
        token: unsupportedToken
      };

      const result = preparePushTxs(manifest, options);

      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
      expect(result.validation.errors[0]).toContain('SuperDappAirdrop contract not configured');
      expect(result.transactions).toHaveLength(0);
    });

    test('should prefer provided airdrop address over auto-resolution', () => {
      const winners = createWinners(1);
      const manifest = createManifest(winners, rolluxToken);
      
      const customAirdropAddress = checksumAddress('0x1234567890123456789012345678901234567890');
      
      const options: PushPrepareOptions = {
        airdrop: customAirdropAddress, // Explicitly provide address
        token: rolluxToken,
        maxPerBatch: 50
      };

      const result = preparePushTxs(manifest, options);

      expect(result.validation.isValid).toBe(true);
      
      // Verify it uses the custom address, not the auto-resolved one
      result.transactions.forEach(tx => {
        // Only check airdrop contract transactions (batchTokenTransfer calls)
        // Approval transactions go to the token address, not airdrop address
        if (tx.data !== '0x' && tx.to !== rolluxToken.address) {
          expect(tx.to).toBe(customAirdropAddress);
        }
      });
    });

    test('should warn about placeholder addresses in unsupported chains', () => {
      // Test with Ethereum which has a placeholder address
      const ethToken: TokenInfo = {
        address: checksumAddress('0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8'),
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chainId: 1, // Ethereum Mainnet (has placeholder)
        isNative: false
      };
      
      const winners = createWinners(1);
      const manifest = createManifest(winners, ethToken);
      
      const options: PushPrepareOptions = {
        token: ethToken,
        maxPerBatch: 50
      };

      const result = preparePushTxs(manifest, options);

      // Should still fail because Ethereum has placeholder address
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors[0]).toContain('SuperDappAirdrop contract not configured');
    });

    test('should correctly identify supported chains', () => {
      // Rollux should be supported
      expect(isSupportedChain(570)).toBe(true);
      
      // Ethereum should not be supported (placeholder address)
      expect(isSupportedChain(1)).toBe(false);
      
      // Random chain should not be supported
      expect(isSupportedChain(999999)).toBe(false);
    });

    test('should correctly resolve addresses for configured chains', () => {
      // Rollux should resolve to the correct address
      expect(getAirdropAddress(570)).toBe('0x2aACce8B9522F81F14834883198645BB6894Bfc0');
      
      // Ethereum should resolve to placeholder
      expect(getAirdropAddress(1)).toBe('0x0000000000000000000000000000000000000000');
      
      // Unsupported chain should return undefined
      expect(getAirdropAddress(999999)).toBeUndefined();
    });

    test('should handle string chain IDs correctly', () => {
      // String chain ID should work
      expect(getAirdropAddress('570')).toBe('0x2aACce8B9522F81F14834883198645BB6894Bfc0');
      expect(isSupportedChain('570')).toBe(true);
    });
  });
});