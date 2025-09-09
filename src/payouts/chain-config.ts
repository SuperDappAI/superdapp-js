/**
 * Multi-chain configuration for SuperDappAirdrop contracts and Rollux network support
 */

import { ChainId, TokenInfo } from './types';

/**
 * SuperDappAirdrop contract addresses by chain ID
 */
export const SUPERDAPP_AIRDROP_ADDRESSES: Record<number, `0x${string}`> = {
  // Ethereum Mainnet
  1: '0x0000000000000000000000000000000000000000', // TODO: Update with actual address when available
  
  // Rollux Mainnet
  570: '0x2aACce8B9522F81F14834883198645BB6894Bfc0',
  
  // Rollux Testnet
  57000: '0x0000000000000000000000000000000000000000', // TODO: Update with actual testnet address
  
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
  /** RPC endpoint configuration */
  rpcUrls?: {
    /** Default RPC endpoint */
    default: string;
    /** Public RPC endpoints */
    public: string[];
  };
  /** Contract addresses for this chain */
  contracts?: {
    /** Airdrop contract address */
    airdrop: `0x${string}`;
    /** SUPR token address (if available) */
    suprToken?: `0x${string}`;
  };
}

/**
 * Metadata for supported chains with complete Rollux configuration
 */
export const CHAIN_METADATA: Record<number, ChainMetadata> = {
  1: {
    name: 'Ethereum Mainnet',
    nativeToken: 'ETH',
    isTestnet: false,
    blockExplorer: 'https://etherscan.io',
    contracts: {
      airdrop: '0x0000000000000000000000000000000000000000', // TODO: Update
    },
  },
  570: {
    name: 'Rollux Mainnet',
    nativeToken: 'SYS',
    isTestnet: false,
    blockExplorer: 'https://explorer.rollux.com',
    rpcUrls: {
      default: 'https://api.superdapp.ai/rpc/rollux/mainnet',
      public: [
        'https://api.superdapp.ai/rpc/rollux/mainnet',
        'https://rpc.rollux.com',
        'https://rollux.rpc.syscoin.org'
      ],
    },
    contracts: {
      airdrop: '0x2aACce8B9522F81F14834883198645BB6894Bfc0',
      suprToken: '0x3390108E913824B8eaD638444cc52B9aBdF63798',
    },
  },
  57000: {
    name: 'Rollux Testnet',
    nativeToken: 'tSYS',
    isTestnet: true,
    blockExplorer: 'https://rollux-tanenbaum.blockscout.com',
    rpcUrls: {
      default: 'https://api.superdapp.ai/rpc/rollux/testnet',
      public: [
        'https://api.superdapp.ai/rpc/rollux/testnet',
        'https://rpc-tanenbaum.rollux.com'
      ],
    },
    contracts: {
      airdrop: '0x0000000000000000000000000000000000000000', // TODO: Update with testnet address
      suprToken: '0x0000000000000000000000000000000000000000', // TODO: Update with testnet address
    },
  },
  137: {
    name: 'Polygon Mainnet',
    nativeToken: 'MATIC',
    isTestnet: false,
    blockExplorer: 'https://polygonscan.com',
    contracts: {
      airdrop: '0x0000000000000000000000000000000000000000', // TODO: Update
    },
  },
  42161: {
    name: 'Arbitrum One',
    nativeToken: 'ETH',
    isTestnet: false,
    blockExplorer: 'https://arbiscan.io',
    contracts: {
      airdrop: '0x0000000000000000000000000000000000000000', // TODO: Update
    },
  },
  10: {
    name: 'Optimism',
    nativeToken: 'ETH',
    isTestnet: false,
    blockExplorer: 'https://optimistic.etherscan.io',
    contracts: {
      airdrop: '0x0000000000000000000000000000000000000000', // TODO: Update
    },
  },
  8453: {
    name: 'Base',
    nativeToken: 'ETH',
    isTestnet: false,
    blockExplorer: 'https://basescan.org',
    contracts: {
      airdrop: '0x0000000000000000000000000000000000000000', // TODO: Update
    },
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

/**
 * SUPR Token Configuration
 */
export const SUPR_TOKEN_CONFIG = {
  mainnet: {
    address: '0x3390108E913824B8eaD638444cc52B9aBdF63798' as const,
    symbol: 'SUPR',
    name: 'SuperDapp Token',
    decimals: 18,
    chainId: 570,
    isNative: false,
  },
  testnet: {
    address: '0x0000000000000000000000000000000000000000' as const, // TODO: Update with testnet address
    symbol: 'tSUPR', 
    name: 'SuperDapp Token (Testnet)',
    decimals: 18,
    chainId: 57000,
    isNative: false,
  },
} as const;

/**
 * Rollux Chain Constants
 */
export const RolluxChains = {
  MAINNET: 570,
  TESTNET: 57000,
} as const;

/**
 * Get SUPR token configuration for a specific chain
 * 
 * @param chainId - The chain ID (570 or 57000)
 * @returns SUPR token configuration
 */
export function getSuprTokenConfig(chainId: 570 | 57000): TokenInfo {
  if (chainId === 570) {
    return SUPR_TOKEN_CONFIG.mainnet;
  } else if (chainId === 57000) {
    return SUPR_TOKEN_CONFIG.testnet;
  } else {
    throw new Error(`SUPR token not available on chain ${chainId}`);
  }
}

/**
 * Check if a chain ID is a Rollux network
 * 
 * @param chainId - The chain ID to check
 * @returns True if the chain is Rollux mainnet or testnet
 */
export function isRolluxChain(chainId: number): boolean {
  return chainId === RolluxChains.MAINNET || chainId === RolluxChains.TESTNET;
}

/**
 * Get the RPC URL for a Rollux chain
 * 
 * @param chainId - The Rollux chain ID (570 or 57000)
 * @returns RPC URL for the chain
 */
export function getRolluxRpcUrl(chainId: 570 | 57000): string {
  const metadata = getChainMetadata(chainId);
  if (!metadata?.rpcUrls?.default) {
    throw new Error(`No RPC URL configured for Rollux chain ${chainId}`);
  }
  return metadata.rpcUrls.default;
}

/**
 * Get the block explorer URL for a transaction or address on Rollux
 * 
 * @param chainId - The Rollux chain ID (570 or 57000)
 * @param hash - Transaction hash or address
 * @returns Explorer URL
 */
export function getRolluxExplorerUrl(chainId: 570 | 57000, hash: string): string {
  const metadata = getChainMetadata(chainId);
  if (!metadata?.blockExplorer) {
    throw new Error(`No block explorer configured for Rollux chain ${chainId}`);
  }
  
  const isTransaction = hash.length === 66 && hash.startsWith('0x');
  const path = isTransaction ? 'tx' : 'address';
  
  return `${metadata.blockExplorer}/${path}/${hash}`;
}

/**
 * Get native token info for a Rollux chain
 * 
 * @param chainId - The Rollux chain ID (570 or 57000) 
 * @returns Native token configuration (SYS or tSYS)
 */
export function getRolluxNativeTokenConfig(chainId: 570 | 57000): TokenInfo {
  const metadata = getChainMetadata(chainId);
  if (!metadata) {
    throw new Error(`Chain ${chainId} is not a supported Rollux chain`);
  }
  
  return {
    address: '0x0000000000000000000000000000000000000000', // Native token address
    symbol: metadata.nativeToken,
    name: chainId === 570 ? 'Syscoin' : 'Syscoin Testnet',
    decimals: 18,
    chainId,
    isNative: true,
  };
}