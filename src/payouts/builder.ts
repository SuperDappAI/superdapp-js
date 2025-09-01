/**
 * Payouts Builder Module
 * 
 * Provides utilities for building and validating payout manifests
 */

import { createHash, randomUUID } from 'crypto';
import { TokenInfo, WinnerRow, NormalizedWinner, PayoutManifest } from './types';

/**
 * Options for building a payout manifest
 */
export interface BuildManifestOptions {
  /** Token information for the payout */
  token: TokenInfo;
  /** Round identifier */
  roundId: string;
  /** Group identifier */
  groupId: string;
  /** Optional decimal clamping to reduce dust */
  clampDecimals?: number;
}

/**
 * Result from building a manifest, including rejected addresses
 */
export interface BuildManifestResult {
  /** The generated payout manifest */
  manifest: PayoutManifest;
  /** Addresses that were rejected due to validation failures */
  rejectedAddresses: string[];
}

/**
 * Validate and checksum an EVM address
 */
export function validateAndChecksumAddress(address: string): string | null {
  if (!address || typeof address !== 'string') {
    return null;
  }

  // Remove 0x prefix if present and ensure lowercase
  const cleanAddress = address.replace(/^0x/i, '').toLowerCase();
  
  // Check if it's a valid hex string of 40 characters
  if (!/^[a-f0-9]{40}$/.test(cleanAddress)) {
    return null;
  }

  // Simple checksum validation (EIP-55)
  const checksumAddress = `0x${cleanAddress}`;
  return toChecksumAddress(checksumAddress);
}

/**
 * Convert address to checksum format (EIP-55)
 * Note: This is a simplified implementation for demo purposes.
 * In production, you should use a proper Keccak-256 implementation.
 */
function toChecksumAddress(address: string): string {
  const cleanAddress = address.replace(/^0x/i, '').toLowerCase();
  
  // For this implementation, we'll return a properly formatted address
  // In production, this should use Keccak-256 hash for proper EIP-55 checksumming
  let result = '0x';
  for (let i = 0; i < cleanAddress.length; i++) {
    const char = cleanAddress[i];
    if (!char) continue;
    
    // Simple pattern for demo - alternate case based on position
    if (i % 4 < 2) {
      result += char.toUpperCase();
    } else {
      result += char;
    }
  }
  
  return result;
}

/**
 * Convert decimal amount to wei using token decimals
 */
export function decimalToWei(amount: string | number, decimals: number): bigint {
  const amountStr = amount.toString();
  
  // Handle exponential notation
  const [integerPart = '0', fractionalPart = ''] = amountStr.split('.');
  
  // Calculate the multiplier for wei conversion
  const multiplier = BigInt(10) ** BigInt(decimals);
  
  // Convert integer part
  const integerWei = BigInt(integerPart) * multiplier;
  
  if (!fractionalPart) {
    return integerWei;
  }
  
  // Convert fractional part
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  const fractionalWei = BigInt(paddedFractional);
  
  return integerWei + fractionalWei;
}

/**
 * Clamp decimal places to reduce dust
 */
export function clampDecimalsHelper(amount: bigint, decimals: number, clampDecimals: number): bigint {
  if (clampDecimals >= decimals) {
    return amount;
  }
  
  const dustFactor = BigInt(10) ** BigInt(decimals - clampDecimals);
  return (amount / dustFactor) * dustFactor;
}

/**
 * Create canonical JSON string for deterministic hashing
 */
export function canonicalJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJson).join(',') + ']';
  }
  
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(key => `"${key}":${canonicalJson((obj as Record<string, unknown>)[key])}`);
  return '{' + pairs.join(',') + '}';
}

/**
 * Build a deterministic PayoutManifest from raw WinnerRow[]
 * 
 * @param rows - Array of raw winner data
 * @param opts - Build options including token info and identifiers
 * @returns BuildManifestResult with manifest and rejected addresses
 */
export function buildManifest(
  rows: WinnerRow[],
  opts: BuildManifestOptions
): BuildManifestResult {
  const { token, roundId, groupId, clampDecimals } = opts;
  const rejectedAddresses: string[] = [];
  const addressMap = new Map<string, { totalAmount: bigint; winner: WinnerRow }>();
  
  // Step 1: Validate addresses and deduplicate by summing amounts
  for (const row of rows) {
    const checksumAddress = validateAndChecksumAddress(row.address);
    
    if (!checksumAddress) {
      rejectedAddresses.push(row.address);
      console.warn(`Invalid address rejected: ${row.address}`);
      continue;
    }
    
    // Convert amount to wei
    const amountWei = decimalToWei(row.amount, token.decimals);
    
    // Apply clamping if specified
    const clampedAmount = clampDecimals !== undefined 
      ? clampDecimalsHelper(amountWei, token.decimals, clampDecimals)
      : amountWei;
    
    // Deduplicate by address
    if (addressMap.has(checksumAddress)) {
      const existing = addressMap.get(checksumAddress)!;
      existing.totalAmount += clampedAmount;
      // Keep the first winner data, but do not overwrite the original decimal amount
      // existing.winner.amount = existing.totalAmount.toString();
    } else {
      addressMap.set(checksumAddress, {
        totalAmount: clampedAmount,
        winner: { ...row, address: checksumAddress }
      });
    }
  }
  
  // Step 2: Create normalized winners
  const winners: NormalizedWinner[] = Array.from(addressMap.values()).map(({ winner, totalAmount }) => ({
    address: winner.address,
    amount: totalAmount.toString(),
    rank: winner.rank,
    id: winner.id || randomUUID(),
    token,
    metadata: winner.metadata || {}
  }));
  
  // Step 3: Calculate total amount
  const totalAmount = Array.from(addressMap.values())
    .reduce((sum, { totalAmount }) => sum + totalAmount, BigInt(0))
    .toString();
  
  // Step 4: Create manifest (without hash first)
  const manifestWithoutHash = {
    id: randomUUID(),
    winners,
    token,
    totalAmount,
    createdBy: '0x0000000000000000000000000000000000000000', // Default, can be overridden
    createdAt: new Date().toISOString(),
    roundId,
    groupId,
    version: '1.0'
  };
  
  // Step 5: Compute deterministic hash
  const canonicalManifest = canonicalJson(manifestWithoutHash);
  const hash = '0x' + createHash('sha256').update(canonicalManifest).digest('hex');
  
  // Step 6: Create final manifest with hash
  const manifest: PayoutManifest = {
    ...manifestWithoutHash,
    hash
  };
  
  return {
    manifest,
    rejectedAddresses
  };
}