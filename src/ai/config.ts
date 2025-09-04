import { z } from 'zod';
import { aisdk } from '@openai/agents-extensions';

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'anthropic' | 'google';

/**
 * Agents configuration schema
 */
const AgentsConfigSchema = z.object({
  enabled: z.boolean().optional(),
  streaming: z.boolean().optional(),
  maxTurns: z.number().int().min(1).max(50).optional(),
}).optional();

/**
 * AI configuration schema for validation
 */
const AIConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google']).default('openai'),
  model: z.string().min(1, 'AI_MODEL is required'),
  apiKey: z.string().min(1, 'AI_API_KEY is required'),
  baseUrl: z.string().url().optional().or(z.literal('')),
  agents: AgentsConfigSchema,
});

/**
 * AI configuration interface
 */
export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  agents?: {
    enabled?: boolean;
    streaming?: boolean;
    maxTurns?: number;
  };
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
  const agentsEnabled = process.env.SUPERDAPP_AI_AGENTS === '1' || process.env.SUPERDAPP_AI_AGENTS === 'true';
  
  const rawConfig = {
    provider: config?.provider ?? process.env.AI_PROVIDER ?? undefined,
    model: config?.model ?? process.env.AI_MODEL ?? undefined,
    apiKey: config?.apiKey ?? process.env.AI_API_KEY ?? undefined,
    baseUrl: config?.baseUrl ?? process.env.AI_BASE_URL ?? undefined,
    agents: config?.agents ?? {
      enabled: agentsEnabled,
      streaming: config?.agents?.streaming ?? (process.env.SUPERDAPP_AI_AGENTS_STREAMING === '1'),
      maxTurns: config?.agents?.maxTurns ?? (process.env.SUPERDAPP_AI_AGENTS_MAX_TURNS ? parseInt(process.env.SUPERDAPP_AI_AGENTS_MAX_TURNS, 10) : undefined),
    },
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
    
    if (parsed.agents && (parsed.agents.enabled !== undefined || parsed.agents.streaming !== undefined || parsed.agents.maxTurns !== undefined)) {
      const agentsConfig: { enabled?: boolean; streaming?: boolean; maxTurns?: number } = {};
      if (parsed.agents.enabled !== undefined) agentsConfig.enabled = parsed.agents.enabled;
      if (parsed.agents.streaming !== undefined) agentsConfig.streaming = parsed.agents.streaming;
      if (parsed.agents.maxTurns !== undefined) agentsConfig.maxTurns = parsed.agents.maxTurns;
      result.agents = agentsConfig;
    }
    
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Create more specific error messages based on the validation issue
      const issues = error.issues.map(issue => {
        if (issue.path.length > 0) {
          const fieldName = issue.path[0] as string;
          if (fieldName === 'model' && (issue.code === 'too_small' || issue.code === 'invalid_type')) {
            return 'AI_MODEL is required';
          }
          if (fieldName === 'apiKey' && (issue.code === 'too_small' || issue.code === 'invalid_type')) {
            return 'AI_API_KEY is required';
          }
          if (fieldName === 'provider' && issue.code === 'invalid_enum_value') {
            return 'AI_PROVIDER must be one of: openai, anthropic, google';
          }
        }
        // Return original message for other validation issues
        return issue.message;
      });
      
      throw new AIConfigError(
        `Invalid AI configuration: ${issues.join(', ')}`,
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