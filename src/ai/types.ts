export type AiProvider = 'openai' | 'anthropic' | 'google' | 'azure-openai' | 'other';

export interface AiConfig {
  provider?: AiProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface GenerateTextOptions {
  config?: AiConfig;
  // Additional model-specific options can be passed through here later
  [key: string]: unknown;
}

export interface StreamTextOptions extends GenerateTextOptions {
  // Placeholder for streaming options
}

export interface AgentRunOptions extends GenerateTextOptions {
  instructions?: string;
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  tools?: Record<string, unknown>;
}
