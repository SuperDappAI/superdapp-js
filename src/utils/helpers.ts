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
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
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
