/**
 * Tests for Payouts Builder Module
 *
 * Verifies buildManifest function correctly handles:
 * - Address validation and checksumming
 * - Decimal to wei conversion
 * - Deduplication by address
 * - Hash generation and stability
 * - Invalid address handling
 */

import {
  buildManifest,
  validateAndChecksumAddress,
  decimalToWei,
  canonicalJson,
  BuildManifestOptions
} from '../../payouts/builder';
import { WinnerRow, TokenInfo } from '../../payouts/types';

describe('Payouts Builder', () => {
  const mockToken: TokenInfo = {
    address: '0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8',
    symbol: 'SUPR',
    name: 'SuperDapp Token',
    decimals: 18,
    chainId: 1,
  };

  const mockUSDCToken: TokenInfo = {
    address: '0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 1,
  };

  describe('validateAndChecksumAddress', () => {
    test('should validate and checksum valid addresses', () => {
      const validAddress = '0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66';
      const result = validateAndChecksumAddress(validAddress);
      
      expect(result).toBeTruthy();
      expect(result).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    test('should reject invalid addresses', () => {
      const invalidAddresses = [
        'invalid',
        '0xinvalid',
        '0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b6',  // too short
        '0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b666', // too long
        '',
        null,
        undefined
      ];

      invalidAddresses.forEach(addr => {
        expect(validateAndChecksumAddress(addr as string)).toBeNull();
      });
    });

    test('should handle addresses with and without 0x prefix', () => {
      const addressWithoutPrefix = '742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66';
      const addressWithPrefix = '0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66';
      
      const result1 = validateAndChecksumAddress(addressWithoutPrefix);
      const result2 = validateAndChecksumAddress(addressWithPrefix);
      
      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
      expect(result1).toBe(result2);
    });
  });

  describe('decimalToWei', () => {
    test('should convert 1.5 SUPR to wei correctly', () => {
      const result = decimalToWei('1.5', 18);
      expect(result).toBe(BigInt('1500000000000000000'));
    });

    test('should convert whole numbers correctly', () => {
      const result = decimalToWei('100', 18);
      expect(result).toBe(BigInt('100000000000000000000'));
    });

    test('should handle USDC decimals (6)', () => {
      const result = decimalToWei('1000.5', 6);
      expect(result).toBe(BigInt('1000500000'));
    });

    test('should handle zero amounts', () => {
      const result = decimalToWei('0', 18);
      expect(result).toBe(BigInt('0'));
    });

    test('should handle very small amounts', () => {
      const result = decimalToWei('0.000000000000000001', 18);
      expect(result).toBe(BigInt('1'));
    });

    test('should handle number inputs', () => {
      const result = decimalToWei(1.5, 18);
      expect(result).toBe(BigInt('1500000000000000000'));
    });
  });

  describe('canonicalJson', () => {
    test('should produce stable ordering for objects', () => {
      const obj1 = { b: 2, a: 1, c: 3 };
      const obj2 = { a: 1, c: 3, b: 2 };
      
      expect(canonicalJson(obj1)).toBe(canonicalJson(obj2));
      expect(canonicalJson(obj1)).toBe('{"a":1,"b":2,"c":3}');
    });

    test('should handle nested objects', () => {
      const obj = {
        z: { b: 2, a: 1 },
        a: { d: 4, c: 3 }
      };
      
      const result = canonicalJson(obj);
      expect(result).toBe('{"a":{"c":3,"d":4},"z":{"a":1,"b":2}}');
    });

    test('should handle arrays', () => {
      const obj = { items: [3, 1, 2], name: 'test' };
      const result = canonicalJson(obj);
      expect(result).toBe('{"items":[3,1,2],"name":"test"}');
    });
  });

  describe('buildManifest', () => {
    test('should build manifest with single winner', () => {
      const rows: WinnerRow[] = [
        {
          address: '0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66',
          amount: '100.5',
          rank: 1,
          id: 'winner-1',
        },
      ];

      const options: BuildManifestOptions = {
        token: mockToken,
        roundId: 'round-123',
        groupId: 'group-456',
      };

      const result = buildManifest(rows, options);

      expect(result.manifest.winners).toHaveLength(1);
      expect(result.manifest.totalAmount).toBe('100500000000000000000');
      expect(result.manifest.roundId).toBe('round-123');
      expect(result.manifest.groupId).toBe('group-456');
      expect(result.manifest.version).toBe('1.0');
      expect(result.manifest.hash).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.rejectedAddresses).toHaveLength(0);
    });

    test('should deduplicate by address and sum amounts', () => {
      const rows: WinnerRow[] = [
        {
          address: '0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66',
          amount: '100',
          rank: 1,
        },
        {
          address: '0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66', // Same address, different case
          amount: '50',
          rank: 2,
        },
      ];

      const options: BuildManifestOptions = {
        token: mockToken,
        roundId: 'round-123',
        groupId: 'group-456',
      };

      const result = buildManifest(rows, options);

      expect(result.manifest.winners).toHaveLength(1);
      expect(result.manifest.totalAmount).toBe('150000000000000000000');
      expect(result.rejectedAddresses).toHaveLength(0);
    });

    test('should reject invalid addresses and continue with valid ones', () => {
      const rows: WinnerRow[] = [
        {
          address: 'invalid-address',
          amount: '100',
          rank: 1,
        },
        {
          address: '0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66',
          amount: '50',
          rank: 2,
        },
        {
          address: 'another-invalid',
          amount: '25',
          rank: 3,
        },
      ];

      const options: BuildManifestOptions = {
        token: mockToken,
        roundId: 'round-123',
        groupId: 'group-456',
      };

      const result = buildManifest(rows, options);

      expect(result.manifest.winners).toHaveLength(1);
      expect(result.manifest.totalAmount).toBe('50000000000000000000');
      expect(result.rejectedAddresses).toEqual(['invalid-address', 'another-invalid']);
    });

    test('should generate stable hash for same input', () => {
      const rows: WinnerRow[] = [
        {
          address: '0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66',
          amount: '100',
          rank: 1,
        },
      ];

      const options: BuildManifestOptions = {
        token: mockToken,
        roundId: 'round-123',
        groupId: 'group-456',
      };

      // Override random elements for deterministic testing
      const originalRandomUUID = require('crypto').randomUUID;
      const originalDateNow = Date.now;
      
      try {
        let uuidCounter = 0;
        require('crypto').randomUUID = jest.fn(() => `test-uuid-${uuidCounter++}`);
        Date.now = jest.fn(() => 1640995200000); // Fixed timestamp
        const originalToISOString = Date.prototype.toISOString;
        Date.prototype.toISOString = jest.fn(() => '2022-01-01T00:00:00.000Z');

        const result1 = buildManifest(rows, options);
        
        // Reset counter for second call
        uuidCounter = 0;
        const result2 = buildManifest(rows, options);

        expect(result1.manifest.hash).toBe(result2.manifest.hash);
        
        // Restore original functions
        Date.prototype.toISOString = originalToISOString;
      } finally {
        require('crypto').randomUUID = originalRandomUUID;
        Date.now = originalDateNow;
      }
    });

    test('should apply clampDecimals when specified', () => {
      const rows: WinnerRow[] = [
        {
          address: '0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66',
          amount: '1.123456789123456789', // 18 decimal places
          rank: 1,
        },
      ];

      const options: BuildManifestOptions = {
        token: mockToken,
        roundId: 'round-123',
        groupId: 'group-456',
        clampDecimals: 8, // Clamp to 8 decimal places
      };

      const result = buildManifest(rows, options);
      
      // Should be clamped to 8 decimal places (truncated)
      expect(result.manifest.totalAmount).toBe('1123456780000000000');
    });

    test('should handle empty winner list', () => {
      const rows: WinnerRow[] = [];

      const options: BuildManifestOptions = {
        token: mockToken,
        roundId: 'round-123',
        groupId: 'group-456',
      };

      const result = buildManifest(rows, options);

      expect(result.manifest.winners).toHaveLength(0);
      expect(result.manifest.totalAmount).toBe('0');
      expect(result.rejectedAddresses).toHaveLength(0);
    });

    test('should generate winners with proper structure', () => {
      const rows: WinnerRow[] = [
        {
          address: '0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66',
          amount: '100',
          rank: 1,
          metadata: { game: 'poker', table: 'high-stakes' },
        },
      ];

      const options: BuildManifestOptions = {
        token: mockToken,
        roundId: 'round-123',
        groupId: 'group-456',
      };

      const result = buildManifest(rows, options);
      const winner = result.manifest.winners[0];
      
      expect(winner).toBeDefined();
      expect(winner!.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(winner!.amount).toBe('100000000000000000000');
      expect(winner!.rank).toBe(1);
      expect(winner!.id).toBeDefined();
      expect(winner!.token).toEqual(mockToken);
      expect(winner!.metadata).toEqual({ game: 'poker', table: 'high-stakes' });
    });
  });
});