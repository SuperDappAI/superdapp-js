import { z } from 'zod';
import { BotConfig } from '../types';

const envSchema = z.object({
  API_BASE_URL: z.string().url().optional(),
  API_TOKEN: z.string().min(1, 'API_TOKEN is required'),
});

export type EnvConfig = z.infer<typeof envSchema>;

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
 * Create bot configuration from environment
 */
export function createBotConfig(customBaseUrl?: string): BotConfig {
  const env = loadEnvConfig();

  return {
    apiToken: env.API_TOKEN,
    baseUrl: customBaseUrl || env.API_BASE_URL || 'https://api.superdapp.com',
  };
}
