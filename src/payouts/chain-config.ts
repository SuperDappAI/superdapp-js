/**
 * Multi-chain configuration for SuperDappAirdrop contracts
 */

import { ChainId } from './types';

/**
 * SuperDappAirdrop contract addresses by chain ID
 */
export const SUPERDAPP_AIRDROP_ADDRESSES: Record<number, `0x${string}`> = {
  // Ethereum Mainnet
  1: '0x0000000000000000000000000000000000000000', // TODO: Update with actual address when available
  
  // Rollux Mainnet
  570: '0x2aACce8B9522F81F14834883198645BB6894Bfc0',
  
  // Polygon Mainnet
  137: '0x0000000000000000000000000000000000000000', // TODO: Update with actual address when available
  
  // Arbitrum One
  42161: '0x0000000000000000000000000000000000000000', // TODO: Update with actual address when available
  
  // Optimism
  10: '0x0000000000000000000000000000000000000000', // TODO: Update with actual address when available
  
  // Base
  8453: '0x0000000000000000000000000000000000000000', // TODO: Update with actual address when available
} as const;

/**
 * Chain metadata for supported networks
 */
export interface ChainMetadata {
  /** Human-readable chain name */
  name: string;
  /** Native token symbol */
  nativeToken: string;
  /** Whether this chain is a testnet */
  isTestnet: boolean;
  /** Block explorer base URL */
  blockExplorer?: string;
}

/**
 * Metadata for supported chains
 */
export const CHAIN_METADATA: Record<number, ChainMetadata> = {
  1: {
    name: 'Ethereum Mainnet',
    nativeToken: 'ETH',
    isTestnet: false,
    blockExplorer: 'https://etherscan.io'
  },
  570: {
    name: 'Rollux Mainnet',
    nativeToken: 'SYS',
    isTestnet: false,
    blockExplorer: 'https://explorer.rollux.com'
  },
  137: {
    name: 'Polygon Mainnet',
    nativeToken: 'MATIC',
    isTestnet: false,
    blockExplorer: 'https://polygonscan.com'
  },
  42161: {
    name: 'Arbitrum One',
    nativeToken: 'ETH',
    isTestnet: false,
    blockExplorer: 'https://arbiscan.io'
  },
  10: {
    name: 'Optimism',
    nativeToken: 'ETH',
    isTestnet: false,
    blockExplorer: 'https://optimistic.etherscan.io'
  },
  8453: {
    name: 'Base',
    nativeToken: 'ETH',
    isTestnet: false,
    blockExplorer: 'https://basescan.org'
  }
} as const;

/**
 * Get SuperDappAirdrop contract address for a specific chain
 * @param chainId - The chain ID to get the address for
 * @returns The contract address if supported, undefined otherwise
 */
export function getAirdropAddress(chainId: ChainId): `0x${string}` | undefined {
  const numericChainId = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
  return SUPERDAPP_AIRDROP_ADDRESSES[numericChainId];
}

/**
 * Get chain metadata for a specific chain
 * @param chainId - The chain ID to get metadata for
 * @returns Chain metadata if supported, undefined otherwise
 */
export function getChainMetadata(chainId: ChainId): ChainMetadata | undefined {
  const numericChainId = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
  return CHAIN_METADATA[numericChainId];
}

/**
 * Check if a chain is supported by SuperDappAirdrop
 * @param chainId - The chain ID to check
 * @returns True if the chain is supported, false otherwise
 */
export function isSupportedChain(chainId: ChainId): boolean {
  const numericChainId = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
  return numericChainId in SUPERDAPP_AIRDROP_ADDRESSES && 
         SUPERDAPP_AIRDROP_ADDRESSES[numericChainId] !== '0x0000000000000000000000000000000000000000';
}

/**
 * Get list of all supported chain IDs
 * @returns Array of supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.entries(SUPERDAPP_AIRDROP_ADDRESSES)
    .filter(([, address]) => address !== '0x0000000000000000000000000000000000000000')
    .map(([chainId]) => parseInt(chainId, 10));
}

/**
 * Get list of all configured chain IDs (including placeholder addresses)
 * @returns Array of all configured chain IDs
 */
export function getAllConfiguredChainIds(): number[] {
  return Object.keys(SUPERDAPP_AIRDROP_ADDRESSES).map(id => parseInt(id, 10));
}