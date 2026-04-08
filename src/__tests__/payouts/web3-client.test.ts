/**
 * Tests for Web3 Client Configuration utilities
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  createPublicClient,
  createWalletClientFromPrivateKey,
  createWalletClientFromMnemonic,
  getRpcUrl,
  setCustomRpcUrl,
  clearCustomRpcUrl,
  createClientsForChain,
  validateRpcConnection,
} from '../../payouts/web3-client';
import { RolluxChains } from '../../payouts/chain-config';

// Mock viem to avoid actual network calls
jest.mock('viem', () => ({
  createPublicClient: jest.fn(() => ({
    getChainId: jest.fn().mockResolvedValue(570),
  })),
  createWalletClient: jest.fn(() => ({
    account: { address: '0x742d35Cc6634C0532925a3b8FD74389b9f8e9c55' },
  })),
  http: jest.fn(),
}));

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(() => ({ 
    address: '0x742d35Cc6634C0532925a3b8FD74389b9f8e9c55' 
  })),
  mnemonicToAccount: jest.fn(() => ({ 
    address: '0x8ba1f109551bD432803012645Hac136c0532925' 
  })),
}));

describe('Web3 Client Configuration', () => {
  const testRpcUrl = 'https://api.superdapp.ai/rpc/rollux/mainnet';
  const testChainId = RolluxChains.MAINNET;
  const testPrivateKey = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
  const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  afterEach(() => {
    // Clear custom RPC URLs after each test
    clearCustomRpcUrl(testChainId);
  });

  describe('createPublicClient', () => {
    it('should create a public client with correct configuration', () => {
      const client = createPublicClient(testRpcUrl, testChainId);
      
      expect(client).toBeDefined();
      // Mock returns the mocked object, so we just verify it was called
      expect(require('viem').createPublicClient).toHaveBeenCalled();
    });
  });

  describe('createWalletClientFromPrivateKey', () => {
    it('should create wallet client from private key', () => {
      const client = createWalletClientFromPrivateKey(testRpcUrl, testChainId, testPrivateKey);
      
      expect(client).toBeDefined();
      expect(require('viem').createWalletClient).toHaveBeenCalled();
      expect(require('viem/accounts').privateKeyToAccount).toHaveBeenCalledWith(
        `0x${testPrivateKey}`
      );
    });

    it('should handle private key with 0x prefix', () => {
      const privateKeyWithPrefix = `0x${testPrivateKey}`;
      const client = createWalletClientFromPrivateKey(testRpcUrl, testChainId, privateKeyWithPrefix);
      
      expect(client).toBeDefined();
      expect(require('viem/accounts').privateKeyToAccount).toHaveBeenCalledWith(
        privateKeyWithPrefix
      );
    });
  });

  describe('createWalletClientFromMnemonic', () => {
    it('should create wallet client from mnemonic with default account index', () => {
      const client = createWalletClientFromMnemonic(testRpcUrl, testChainId, testMnemonic);
      
      expect(client).toBeDefined();
      expect(require('viem/accounts').mnemonicToAccount).toHaveBeenCalledWith(
        testMnemonic, 
        { accountIndex: 0 }
      );
    });

    it('should create wallet client from mnemonic with custom account index', () => {
      const accountIndex = 2;
      const client = createWalletClientFromMnemonic(testRpcUrl, testChainId, testMnemonic, accountIndex);
      
      expect(client).toBeDefined();
      expect(require('viem/accounts').mnemonicToAccount).toHaveBeenCalledWith(
        testMnemonic, 
        { accountIndex }
      );
    });
  });

  describe('RPC URL management', () => {
    it('should store and retrieve custom RPC URLs', () => {
      expect(getRpcUrl(testChainId)).toBeUndefined();
      
      setCustomRpcUrl(testChainId, testRpcUrl);
      expect(getRpcUrl(testChainId)).toBe(testRpcUrl);
    });

    it('should handle string chain IDs', () => {
      const stringChainId = testChainId.toString();
      setCustomRpcUrl(stringChainId, testRpcUrl);
      expect(getRpcUrl(stringChainId)).toBe(testRpcUrl);
    });
  });

  describe('createClientsForChain', () => {
    beforeEach(() => {
      setCustomRpcUrl(testChainId, testRpcUrl);
    });

    it('should create clients for configured chain', () => {
      const clients = createClientsForChain(testChainId);
      
      expect(clients.publicClient).toBeDefined();
      expect(clients.createWalletClient).toBeInstanceOf(Function);
      expect(clients.createWalletClientFromMnemonic).toBeInstanceOf(Function);
    });

    it('should throw error for unconfigured chain', () => {
      const unconfiguredChainId = 999;
      
      expect(() => createClientsForChain(unconfiguredChainId)).toThrow(
        `No RPC URL configured for chain ${unconfiguredChainId}`
      );
    });

    it('should create wallet client from private key', () => {
      const clients = createClientsForChain(testChainId);
      const walletClient = clients.createWalletClient(testPrivateKey);
      
      expect(walletClient).toBeDefined();
    });

    it('should create wallet client from mnemonic', () => {
      const clients = createClientsForChain(testChainId);
      const walletClient = clients.createWalletClientFromMnemonic(testMnemonic, 1);
      
      expect(walletClient).toBeDefined();
    });
  });

  describe('validateRpcConnection', () => {
    it('should validate successful RPC connection', async () => {
      const result = await validateRpcConnection(testRpcUrl, testChainId);
      
      expect(result.isValid).toBe(true);
      expect(result.actualChainId).toBe(testChainId);
      expect(result.error).toBeUndefined();
    });

    it('should detect chain ID mismatch', async () => {
      // Mock different chain ID response
      require('viem').createPublicClient.mockReturnValueOnce({
        getChainId: jest.fn().mockResolvedValue(1), // Ethereum instead of Rollux
      });

      const result = await validateRpcConnection(testRpcUrl, testChainId);
      
      expect(result.isValid).toBe(false);
      expect(result.actualChainId).toBe(1);
      expect(result.error).toContain('Chain ID mismatch');
    });

    it('should handle RPC connection errors', async () => {
      // Mock RPC error
      require('viem').createPublicClient.mockReturnValueOnce({
        getChainId: jest.fn().mockRejectedValue(new Error('Network unreachable')),
      });

      const result = await validateRpcConnection(testRpcUrl, testChainId);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Network unreachable');
    });
  });
});