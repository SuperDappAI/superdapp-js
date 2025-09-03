import { z } from 'zod';
import { aisdk } from '@openai/agents-extensions';

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'anthropic' | 'google';

/**
 * AI configuration schema for validation
 */
const AIConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google']),
  model: z.string().min(1, 'AI_MODEL is required'),
  apiKey: z.string().min(1, 'AI_API_KEY is required'),
  baseUrl: z.string().url().optional().or(z.literal('')),
});

/**
 * AI configuration interface
 */
export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

/**
 * Error class for AI configuration errors
 */
export class AIConfigError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'AIConfigError';
  }
}

/**
 * Load AI configuration from environment variables or BotConfig
 */
export function loadAIConfig(config?: Partial<AIConfig>): AIConfig {
  const rawConfig = {
    provider: config?.provider || process.env.AI_PROVIDER || 'openai',
    model: config?.model || process.env.AI_MODEL || '',
    apiKey: config?.apiKey || process.env.AI_API_KEY || '',
    baseUrl: config?.baseUrl || process.env.AI_BASE_URL || undefined,
  };

  try {
    const parsed = AIConfigSchema.parse(rawConfig);
    // Build the return object properly for strict optional properties
    const result: AIConfig = {
      provider: parsed.provider,
      model: parsed.model,
      apiKey: parsed.apiKey,
    };
    
    if (parsed.baseUrl) {
      result.baseUrl = parsed.baseUrl;
    }
    
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => issue.message).join(', ');
      throw new AIConfigError(
        `Invalid AI configuration: ${issues}`,
        'INVALID_CONFIG'
      );
    }
    throw error;
  }
}

/**
 * Create a model instance based on the provider
 */
async function createModel(config: AIConfig) {
  const { provider, model, apiKey, baseUrl } = config;

  switch (provider) {
    case 'openai': {
      try {
        const { createOpenAI } = await import('@ai-sdk/openai');
        const openai = createOpenAI({
          apiKey,
          ...(baseUrl && { baseURL: baseUrl }),
        });
        return openai(model);
      } catch (error) {
        throw new AIConfigError(
          `Failed to load OpenAI provider: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'PROVIDER_LOAD_ERROR'
        );
      }
    }

    case 'anthropic': {
      try {
        const { createAnthropic } = await import('@ai-sdk/anthropic');
        const anthropic = createAnthropic({
          apiKey,
          ...(baseUrl && { baseURL: baseUrl }),
        });
        return anthropic(model);
      } catch (error) {
        throw new AIConfigError(
          `Failed to load Anthropic provider. Make sure @ai-sdk/anthropic is installed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'PROVIDER_LOAD_ERROR'
        );
      }
    }

    case 'google': {
      try {
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const google = createGoogleGenerativeAI({
          apiKey,
          ...(baseUrl && { baseURL: baseUrl }),
        });
        return google(model);
      } catch (error) {
        throw new AIConfigError(
          `Failed to load Google provider. Make sure @ai-sdk/google is installed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'PROVIDER_LOAD_ERROR'
        );
      }
    }

    default:
      throw new AIConfigError(
        `Unsupported AI provider: ${provider}. Supported providers are: openai, anthropic, google`,
        'UNSUPPORTED_PROVIDER'
      );
  }
}

/**
 * Load and wrap a model instance with the Agents SDK adapter
 * 
 * @param config Optional AI configuration. If not provided, will load from environment variables
 * @returns A usable model instance wrapped with aisdk()
 * 
 * @example
 * ```typescript
 * // Load from environment variables
 * const model = await loadModel();
 * 
 * // Load with explicit configuration
 * const model = await loadModel({
 *   provider: 'openai',
 *   model: 'gpt-4',
 *   apiKey: 'sk-...'
 * });
 * ```
 */
export async function loadModel(config?: Partial<AIConfig>) {
  try {
    const aiConfig = loadAIConfig(config);
    const model = await createModel(aiConfig);
    return aisdk(model);
  } catch (error) {
    if (error instanceof AIConfigError) {
      throw error;
    }
    throw new AIConfigError(
      `Failed to load AI model: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'MODEL_LOAD_ERROR'
    );
  }
}

/**
 * Validate if a provider is supported
 */
export function isSupportedProvider(provider: string): provider is AIProvider {
  return ['openai', 'anthropic', 'google'].includes(provider);
}

/**
 * Get list of supported providers
 */
export function getSupportedProviders(): AIProvider[] {
  return ['openai', 'anthropic', 'google'];
}