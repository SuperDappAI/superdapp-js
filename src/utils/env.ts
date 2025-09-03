import { z } from 'zod';
import { BotConfig } from '../types';
import fs from 'fs/promises';

const envSchema = z.object({
  API_BASE_URL: z.string().url().optional(),
  API_TOKEN: z.string().min(1, 'API_TOKEN is required'),
  NODE_ENV: z.enum(['development', 'production']).optional(),
  // AI Provider Configuration (optional)
  AI_PROVIDER: z.enum(['openai', 'anthropic', 'google']).optional(),
  AI_MODEL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().optional().or(z.literal('')),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Load environment variables from different file formats
 */
export async function loadEnvFromFile(
  filePath: string,
  format: 'dotenv' | 'json' | 'devvars'
): Promise<Record<string, string>> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');

    switch (format) {
      case 'dotenv':
        return parseDotenv(content);

      case 'json':
        return parseJsonEnv(content);

      case 'devvars':
        return parseDevVars(content);

      default:
        throw new Error(`Unsupported environment format: ${format}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to load environment file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse .env file content
 */
function parseDotenv(content: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmedLine.substring(0, equalIndex).trim();
      const value = trimmedLine.substring(equalIndex + 1).trim();

      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');
      env[key] = cleanValue;
    }
  }

  return env;
}

/**
 * Parse env.json file content (AWS Lambda format)
 */
function parseJsonEnv(content: string): Record<string, string> {
  const parsed = JSON.parse(content);
  const env: Record<string, string> = {};

  // AWS Lambda env.json typically has function names as keys
  // We'll extract environment variables from the first function
  const functionName = Object.keys(parsed)[0];
  if (functionName && parsed[functionName]) {
    Object.assign(env, parsed[functionName]);
  }

  return env;
}

/**
 * Parse .dev.vars file content (Cloudflare Workers format)
 */
function parseDevVars(content: string): Record<string, string> {
  // .dev.vars format is similar to .env but without comments
  return parseDotenv(content);
}

/**
 * Validate and parse environment variables
 */
export function validateEnv(
  env: Record<string, string | undefined>
): EnvConfig {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    result.error.errors.forEach((error) => {
      console.error(`  - ${error.path.join('.')}: ${error.message}`);
    });
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

/**
 * Load environment configuration from process.env
 */
export function loadEnvConfig(): EnvConfig {
  return validateEnv(process.env);
}

/**
 * Load environment configuration from file and merge with process.env
 */
export async function loadEnvConfigFromFile(
  filePath: string,
  format: 'dotenv' | 'json' | 'devvars'
): Promise<EnvConfig> {
  const fileEnv = await loadEnvFromFile(filePath, format);
  const mergedEnv = {
    ...process.env,
    ...fileEnv,
  } as Record<string, string | undefined>;
  return validateEnv(mergedEnv);
}

/**
 * Create bot configuration from environment
 */
export function createBotConfig(customBaseUrl?: string): BotConfig {
  const env = loadEnvConfig();

  const config: BotConfig = {
    apiToken: env.API_TOKEN,
    baseUrl: customBaseUrl || env.API_BASE_URL || 'https://api.superdapp.ai',
  };

  // Add AI configuration if present
  if (env.AI_PROVIDER && env.AI_MODEL && env.AI_API_KEY) {
    config.ai = {
      provider: env.AI_PROVIDER,
      model: env.AI_MODEL,
      apiKey: env.AI_API_KEY,
      baseUrl: env.AI_BASE_URL,
    };
  }

  return config;
}

/**
 * Create bot configuration from environment file
 */
export async function createBotConfigFromFile(
  filePath: string,
  format: 'dotenv' | 'json' | 'devvars',
  customBaseUrl?: string
): Promise<BotConfig> {
  const env = await loadEnvConfigFromFile(filePath, format);

  const config: BotConfig = {
    apiToken: env.API_TOKEN,
    baseUrl: customBaseUrl || env.API_BASE_URL || 'https://api.superdapp.ai',
  };

  // Add AI configuration if present
  if (env.AI_PROVIDER && env.AI_MODEL && env.AI_API_KEY) {
    config.ai = {
      provider: env.AI_PROVIDER,
      model: env.AI_MODEL,
      apiKey: env.AI_API_KEY,
      baseUrl: env.AI_BASE_URL,
    };
  }

  return config;
}

/**
 * Check if SSL verification should be disabled
 * Only disabled in development environment for easier local development
 */
export function shouldDisableSSLVerification(): boolean {
  try {
    const env = loadEnvConfig();
    return env.NODE_ENV === 'development';
  } catch (error) {
    // If environment validation fails (e.g., during CLI init), default to secure behavior
    return process.env.NODE_ENV === 'development';
  }
}
