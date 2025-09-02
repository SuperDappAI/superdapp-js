/**
 * Payouts Exporters Module
 * 
 * Provides utilities for exporting payout data to various formats
 */

import { PayoutManifest, NormalizedWinner } from './types';

/**
 * Export options for CSV format
 */
export interface CSVExportOptions {
  /** Include header row */
  includeHeader?: boolean;
  /** Custom delimiter (default: comma) */
  delimiter?: string;
  /** Include metadata columns */
  includeMetadata?: boolean;
}

/**
 * Convert a PayoutManifest to CSV format
 * 
 * @param manifest - The payout manifest to export
 * @param options - Export formatting options
 * @returns CSV string representation
 */
export function toCSV(manifest: PayoutManifest, options: CSVExportOptions = {}): string {
  const {
    includeHeader = true,
    delimiter = ',',
    includeMetadata = false
  } = options;

  const lines: string[] = [];

  // Add header if requested
  if (includeHeader) {
    const headers = [
      'address',
      'amount',
      'rank',
      'id',
      'token_symbol',
      'token_address'
    ];
    
    if (includeMetadata) {
      headers.push('metadata');
    }
    
    lines.push(headers.join(delimiter));
  }

  // Add winner data
  for (const winner of manifest.winners) {
    const row = [
      winner.address,
      winner.amount,
      winner.rank.toString(),
      winner.id,
      winner.token.symbol,
      winner.token.address
    ];

    if (includeMetadata) {
      row.push(JSON.stringify(winner.metadata));
    }

    lines.push(row.join(delimiter));
  }

  return lines.join('\n');
}

/**
 * Export manifest to JSON format
 * 
 * @param manifest - The payout manifest to export
 * @param pretty - Whether to pretty-print the JSON
 * @returns JSON string representation
 */
export function toJSON(manifest: PayoutManifest, pretty: boolean = false): string {
  return pretty 
    ? JSON.stringify(manifest, null, 2)
    : JSON.stringify(manifest);
}