/**
 * Tests for utility helper functions
 */

import { extractAddressFromTopic } from '../../utils/helpers';

describe('Utility Helpers', () => {
  describe('extractAddressFromTopic', () => {
    test('should extract address from properly formatted topic', () => {
      // Example topic with address 0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66
      const topic = '0x000000000000000000000000742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66';
      const result = extractAddressFromTopic(topic);
      
      expect(result).toBe('0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66');
    });

    test('should extract address from lowercase topic', () => {
      // Example topic with lowercase address
      const topic = '0x000000000000000000000000742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66';
      const result = extractAddressFromTopic(topic);
      
      expect(result).toBe('0x742d35cc6584c0532e47a89c9fdd3d3f8c6c1b66');
    });

    test('should extract zero address', () => {
      const topic = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const result = extractAddressFromTopic(topic);
      
      expect(result).toBe('0x0000000000000000000000000000000000000000');
    });

    test('should throw error for non-string input', () => {
      expect(() => extractAddressFromTopic(null as any)).toThrow('Topic must be a non-empty string');
      expect(() => extractAddressFromTopic(undefined as any)).toThrow('Topic must be a non-empty string');
      expect(() => extractAddressFromTopic(123 as any)).toThrow('Topic must be a non-empty string');
    });

    test('should throw error for empty string', () => {
      expect(() => extractAddressFromTopic('')).toThrow('Topic must be a non-empty string');
    });

    test('should throw error for topic without 0x prefix', () => {
      const topic = '000000000000000000000000742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66';
      expect(() => extractAddressFromTopic(topic)).toThrow('Topic must start with 0x prefix');
    });

    test('should throw error for topic with wrong length', () => {
      // Too short
      expect(() => extractAddressFromTopic('0x742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66')).toThrow(
        'Topic must be 66 characters long (0x + 64 hex chars), got 42'
      );
      
      // Too long
      expect(() => extractAddressFromTopic('0x000000000000000000000000742d35Cc6584C0532E47A89C9FDD3d3F8c6c1b66ff')).toThrow(
        'Topic must be 66 characters long (0x + 64 hex chars), got 68'
      );
    });

    test('should throw error for invalid hex characters', () => {
      const topic = '0x00000000000000000000000074zd35Cc6584C0532E47A89C9FDD3d3F8c6c1b66';
      expect(() => extractAddressFromTopic(topic)).toThrow('Extracted address is not valid hex format');
    });

    test('should handle topics with all uppercase', () => {
      const topic = '0x000000000000000000000000742D35CC6584C0532E47A89C9FDD3D3F8C6C1B66';
      const result = extractAddressFromTopic(topic);
      
      expect(result).toBe('0x742D35CC6584C0532E47A89C9FDD3D3F8C6C1B66');
    });

    test('should handle topics with mixed case', () => {
      const topic = '0x000000000000000000000000742d35CC6584c0532E47a89c9FDD3d3F8c6c1B66';
      const result = extractAddressFromTopic(topic);
      
      expect(result).toBe('0x742d35CC6584c0532E47a89c9FDD3d3F8c6c1B66');
    });
  });
});