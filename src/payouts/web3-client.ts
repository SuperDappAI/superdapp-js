/**
 * Web3 Client Configuration Utilities
 * 
 * Provides utilities for creating viem clients from RPC endpoints,
 * enabling dynamic blockchain connections for payout execution.
 */

import { 
  createPublicClient as viemCreatePublicClient,
  createWalletClient as viemCreateWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Transport,
  type Account
} from 'viem';
import { privateKeyToAccount, mnemonicToAccount } from 'viem/accounts';
import { getChainMetadata } from './chain-config';
import type { ChainId } from './types';

/**
 * Create a viem chain configuration from chain ID and RPC URL
 */
function createChainConfig(chainId: number, rpcUrl: string, name?: string): Chain {
  const metadata = getChainMetadata(chainId);
  
  return {
    id: chainId,
    name: name || metadata?.name || `Chain ${chainId}`,
    nativeCurrency: {
      name: metadata?.nativeToken || 'ETH',
      symbol: metadata?.nativeToken || 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [rpcUrl],
      },
      public: {
        http: [rpcUrl],
      },
    },
    blockExplorers: metadata?.blockExplorer ? {
      default: {
        name: 'Explorer',
        url: metadata.blockExplorer,
      },
    } : undefined,
  };
}

/**
 * Create a PublicClient for reading blockchain data
 * 
 * @param rpcUrl - The RPC endpoint URL
 * @param chainId - The chain ID
 * @returns PublicClient instance
 */
export function createPublicClient(rpcUrl: string, chainId: number): PublicClient {
  const chain = createChainConfig(chainId, rpcUrl);
  const transport = http(rpcUrl);
  
  return viemCreatePublicClient({
    chain,
    transport,
  });
}

/**
 * Create a WalletClient from a private key
 * 
 * @param rpcUrl - The RPC endpoint URL
 * @param chainId - The chain ID
 * @param privateKey - The private key (with or without 0x prefix)
 * @returns WalletClient instance
 */
export function createWalletClientFromPrivateKey(
  rpcUrl: string, 
  chainId: number, 
  privateKey: string
): WalletClient {
  const chain = createChainConfig(chainId, rpcUrl);
  const transport = http(rpcUrl);
  
  // Ensure private key has 0x prefix
  const formattedPrivateKey = privateKey.startsWith('0x') 
    ? privateKey as `0x${string}` 
    : `0x${privateKey}` as `0x${string}`;
  
  const account = privateKeyToAccount(formattedPrivateKey);
  
  return viemCreateWalletClient({
    account,
    chain,
    transport,
  });
}

/**
 * Create a WalletClient from a mnemonic phrase
 * 
 * @param rpcUrl - The RPC endpoint URL
 * @param chainId - The chain ID
 * @param mnemonic - The mnemonic phrase
 * @param accountIndex - The account index to derive (default: 0)
 * @returns WalletClient instance
 */
export function createWalletClientFromMnemonic(
  rpcUrl: string,
  chainId: number,
  mnemonic: string,
  accountIndex: number = 0
): WalletClient {
  const chain = createChainConfig(chainId, rpcUrl);
  const transport = http(rpcUrl);
  
  const account = mnemonicToAccount(mnemonic, { accountIndex });
  
  return viemCreateWalletClient({
    account,
    chain,
    transport,
  });
}

/**
 * RPC endpoint management for chains
 */
const customRpcUrls = new Map<number, string>();

/**
 * Get the RPC URL for a specific chain
 * 
 * @param chainId - The chain ID
 * @returns RPC URL if configured, undefined otherwise
 */
export function getRpcUrl(chainId: ChainId): string | undefined {
  const numericChainId = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
  return customRpcUrls.get(numericChainId);
}

/**
 * Set a custom RPC URL for a specific chain
 * 
 * @param chainId - The chain ID
 * @param rpcUrl - The RPC URL to set
 */
export function setCustomRpcUrl(chainId: ChainId, rpcUrl: string): void {
  const numericChainId = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
  if (rpcUrl) {
    customRpcUrls.set(numericChainId, rpcUrl);
  } else {
    customRpcUrls.delete(numericChainId);
  }
}

/**
 * Clear a custom RPC URL for a specific chain
 * 
 * @param chainId - The chain ID to clear
 */
export function clearCustomRpcUrl(chainId: ChainId): void {
  const numericChainId = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
  customRpcUrls.delete(numericChainId);
}

/**
 * Create clients using stored RPC URL for a chain
 * 
 * @param chainId - The chain ID
 * @returns Object with publicClient and optionally walletClient
 */
export function createClientsForChain(chainId: number): {
  publicClient: PublicClient;
  createWalletClient: (privateKey: string) => WalletClient;
  createWalletClientFromMnemonic: (mnemonic: string, accountIndex?: number) => WalletClient;
} {
  const rpcUrl = getRpcUrl(chainId);
  
  if (!rpcUrl) {
    throw new Error(`No RPC URL configured for chain ${chainId}. Use setCustomRpcUrl() first.`);
  }
  
  const publicClient = createPublicClient(rpcUrl, chainId);
  
  return {
    publicClient,
    createWalletClient: (privateKey: string) => 
      createWalletClientFromPrivateKey(rpcUrl, chainId, privateKey),
    createWalletClientFromMnemonic: (mnemonic: string, accountIndex?: number) =>
      createWalletClientFromMnemonic(rpcUrl, chainId, mnemonic, accountIndex),
  };
}

/**
 * Validate that an RPC URL is accessible
 * 
 * @param rpcUrl - The RPC URL to validate
 * @param chainId - Expected chain ID
 * @returns True if RPC is accessible and returns expected chain ID
 */
export async function validateRpcConnection(
  rpcUrl: string, 
  chainId: number
): Promise<{ isValid: boolean; error?: string; actualChainId?: number }> {
  try {
    const publicClient = createPublicClient(rpcUrl, chainId);
    const actualChainId = await publicClient.getChainId();
    
    if (actualChainId !== chainId) {
      return {
        isValid: false,
        error: `Chain ID mismatch: expected ${chainId}, got ${actualChainId}`,
        actualChainId,
      };
    }
    
    return { isValid: true, actualChainId };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown RPC error',
    };
  }
}