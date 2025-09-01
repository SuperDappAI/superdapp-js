/**
 * Tests for Payouts Exporters Module
 *
 * Verifies toCSV and toJSON functions correctly handle:
 * - CSV format with correct headers and row data
 * - Deterministic JSON output with canonical key ordering
 * - Edge cases like empty winners list
 * - Manifest hash field inclusion in JSON output
 */

import { toCSV, toJSON } from '../../payouts/exporters';
import { buildManifest, BuildManifestOptions } from '../../payouts/builder';
import { PayoutManifest, WinnerRow, TokenInfo } from '../../payouts/types';

describe('Payouts Exporters', () => {
  const mockToken: TokenInfo = {
    address: '0xA0b86a33E6441E7344c2c3dd84A1ba8F3894E5D8',
    symbol: 'SUPR',
    name: 'SuperDapp Token',
    decimals: 18,
    chainId: 1,
  };

  // Create a test manifest using the builder for consistency
  const createTestManifest = (): PayoutManifest => {
    const rows: WinnerRow[] = [
      {
        address: '0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66',
        amount: '100.5',
        rank: 1,
        id: 'winner-1',
      },
      {
        address: '0x1234567890123456789012345678901234567890',
        amount: '50.25',
        rank: 2,
        id: 'winner-2',
      },
    ];

    const options: BuildManifestOptions = {
      token: mockToken,
      roundId: 'round-123',
      groupId: 'group-456',
    };

    // Mock randomUUID and Date for deterministic results using jest.spyOn
    const randomUUIDSpy = jest.spyOn(require('crypto'), 'randomUUID')
      .mockImplementationOnce(() => 'test-manifest-id')
      .mockImplementationOnce(() => 'test-winner-1')
      .mockImplementationOnce(() => 'test-winner-2');
    const toISOStringSpy = jest.spyOn(Date.prototype, 'toISOString')
      .mockImplementation(() => '2024-01-01T00:00:00.000Z');

    const result = buildManifest(rows, options);

    // Restore original functions
    randomUUIDSpy.mockRestore();
    toISOStringSpy.mockRestore();
    return result.manifest;
  };

  describe('toCSV', () => {
    test('should export manifest as CSV with correct header', () => {
      const manifest = createTestManifest();
      const csv = toCSV(manifest);
      
      const lines = csv.split('\n');
      expect(lines[0]).toBe('address,amountWei,symbol,roundId,groupId');
    });

    test('should export all winners with correct data', () => {
      const manifest = createTestManifest();
      const csv = toCSV(manifest);
      
      const lines = csv.split('\n');
      expect(lines).toHaveLength(3); // header + 2 winners
      
      // Check first winner row
      expect(lines[1]).toBe('0x742d35cc6584C0532E47A89c9Fdd3D3f8C6c1B66,100500000000000000000,SUPR,round-123,group-456');
      
      // Check second winner row
      expect(lines[2]).toBe('0x1234567890123456789012345678901234567890,50250000000000000000,SUPR,round-123,group-456');
    });

    test('should handle empty winners list', () => {
      const emptyManifest: PayoutManifest = {
        id: 'test-empty',
        winners: [],
        token: mockToken,
        totalAmount: '0',
        createdBy: '0x0000000000000000000000000000000000000000',
        createdAt: '2024-01-01T00:00:00.000Z',
        roundId: 'round-123',
        groupId: 'group-456',
        version: '1.0',
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const csv = toCSV(emptyManifest);
      expect(csv).toBe('address,amountWei,symbol,roundId,groupId');
    });

    test('should count rows correctly', () => {
      const manifest = createTestManifest();
      const csv = toCSV(manifest);
      
      const lines = csv.split('\n');
      const dataRows = lines.slice(1); // Exclude header
      
      expect(dataRows).toHaveLength(manifest.winners.length);
      expect(dataRows).toHaveLength(2);
    });
  });

  describe('toJSON', () => {
    test('should export manifest as canonical JSON', () => {
      const manifest = createTestManifest();
      const json = toJSON(manifest);
      
      // Should be valid JSON
      expect(() => JSON.parse(json)).not.toThrow();
      
      // Should include all required fields
      const parsed = JSON.parse(json);
      expect(parsed.id).toBeDefined();
      expect(parsed.winners).toBeDefined();
      expect(parsed.token).toBeDefined();
      expect(parsed.hash).toBeDefined();
    });

    test('should be deterministic across multiple runs', () => {
      const manifest1 = createTestManifest();
      const manifest2 = createTestManifest();
      
      const json1 = toJSON(manifest1);
      const json2 = toJSON(manifest2);
      
      // Same manifest should produce identical JSON strings
      expect(json1).toBe(json2);
    });

    test('should include manifest hash field', () => {
      const manifest = createTestManifest();
      const json = toJSON(manifest);
      
      const parsed = JSON.parse(json);
      expect(parsed.hash).toBeDefined();
      expect(parsed.hash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    test('should maintain canonical key ordering', () => {
      const manifest = createTestManifest();
      const json = toJSON(manifest);
      
      // Check that keys appear in alphabetical order
      const topLevelKeys = Object.keys(JSON.parse(json));
      const sortedKeys = [...topLevelKeys].sort();
      expect(topLevelKeys).toEqual(sortedKeys);
    });
  });

  describe('integration with buildManifest', () => {
    test('should work with manifest from builder', () => {
      const rows: WinnerRow[] = [
        {
          address: '0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66',
          amount: '100',
          rank: 1,
        },
      ];

      const options: BuildManifestOptions = {
        token: mockToken,
        roundId: 'test-round',
        groupId: 'test-group',
      };

      const result = buildManifest(rows, options);
      
      // Test CSV export
      const csv = toCSV(result.manifest);
      expect(csv).toContain('address,amountWei,symbol,roundId,groupId');
      expect(csv).toContain('test-round');
      expect(csv).toContain('test-group');
      
      // Test JSON export
      const json = toJSON(result.manifest);
      const parsed = JSON.parse(json);
      expect(parsed.roundId).toBe('test-round');
      expect(parsed.groupId).toBe('test-group');
      expect(parsed.hash).toBeDefined();
    });
  });
});