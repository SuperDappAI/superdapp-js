/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (attempts <= 1) {
      throw error;
    }

    console.warn(
      `Retrying operation in ${delay}ms... (${attempts - 1} attempts left)`
    );
    await sleep(delay);
    return retry(fn, attempts - 1, delay * 2);
  }
}

/**
 * Format a timestamp to a readable string
 */
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Extract command from message text
 */
export function extractCommand(text: string): string | null {
  const match = text.match(/^\/(\w+)/);
  return match ? `/${match[1]}` : null;
}

/**
 * Parse command arguments from message text
 */
export function parseCommandArgs(text: string, command: string): string[] {
  const withoutCommand = text.replace(command, '').trim();
  return withoutCommand ? withoutCommand.split(/\s+/) : [];
}

/**
 * Sanitize text for safe output
 */
export function sanitizeText(text: string): string {
  return text.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      case "'":
        return '&#x27;';
      default:
        return char;
    }
  });
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(
        (result[key] as Record<string, unknown>) ||
          ({} as T[Extract<keyof T, string>]),
        source[key] as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
    } else {
      result[key] = source[key] as T[Extract<keyof T, string>];
    }
  }

  return result;
}

/**
 * Extract an Ethereum address from a bytes32 topic (e.g., from event logs)
 * 
 * @param topic - The bytes32 topic string (66 chars: 0x + 64 hex chars)
 * @returns The extracted Ethereum address (0x + 40 hex chars)
 */
export function extractAddressFromTopic(topic: string): `0x${string}` {
  if (!topic || typeof topic !== 'string') {
    throw new Error('Topic must be a non-empty string');
  }

  if (!topic.startsWith('0x')) {
    throw new Error('Topic must start with 0x prefix');
  }

  if (topic.length !== 66) {
    throw new Error(`Topic must be 66 characters long (0x + 64 hex chars), got ${topic.length}`);
  }

  // Extract the last 40 hex characters (20 bytes) for the address
  const address = `0x${topic.slice(-40)}`;

  // Validate the extracted address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Extracted address is not valid hex format: ${address}`);
  }

  return address as `0x${string}`;
}
