/**
 * Payouts Exporters Module
 * 
 * Provides utilities for exporting PayoutManifest data as CSV and canonical JSON
 */

import { PayoutManifest } from './types';
import { canonicalJson } from './builder';

/**
 * Export a PayoutManifest as CSV format
 * 
 * @param manifest - The payout manifest to export
 * @returns CSV string with header: address,amountWei,symbol,roundId,groupId
 */
export function toCSV(manifest: PayoutManifest): string {
  const header = 'address,amountWei,symbol,roundId,groupId';
  
  if (manifest.winners.length === 0) {
    return header;
  }
  
  const rows = manifest.winners.map(winner => {
    return [
      winner.address,
      winner.amount,
      manifest.token.symbol,
      manifest.roundId,
      manifest.groupId
    ].join(',');
  });
  
  return [header, ...rows].join('\n');
}

/**
 * Export a PayoutManifest as canonical JSON format
 * 
 * @param manifest - The payout manifest to export
 * @returns Canonical JSON string with deterministic key order
 */
export function toJSON(manifest: PayoutManifest): string {
  return canonicalJson(manifest);
}