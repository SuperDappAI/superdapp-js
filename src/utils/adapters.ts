import { HttpsAgent } from '../types';

// Environment detection
export const isCloudflareWorkers =
  typeof globalThis !== 'undefined' && 'caches' in globalThis;
export const isNodeJS =
  typeof process !== 'undefined' && process.versions && process.versions.node;

// HTTPS Agent adapter
export function createHttpsAgent(): HttpsAgent | null {
  if (isNodeJS) {
    try {
      const https = require('node:https');
      return new https.Agent({
        rejectUnauthorized: false,
      });
    } catch (error) {
      console.warn('HTTPS module not available');
      return null;
    }
  }
  // In non-Node environments (e.g., Cloudflare Workers), do not supply an httpsAgent
  return null;
}

// Environment-specific console logging
export function log(
  message: string,
  level: 'log' | 'warn' | 'error' = 'log'
): void {
  if (isCloudflareWorkers) {
    // In Cloudflare Workers, console.log might not be available in all contexts
    try {
      console[level](message);
    } catch (error) {
      // Fallback for environments where console is not available
      // You might want to implement a different logging strategy here
    }
  } else {
    console[level](message);
  }
}
