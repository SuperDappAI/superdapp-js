export type AiProvider = 'openai' | 'anthropic' | 'google' | 'azure-openai' | 'other';

export interface AiConfig {
  provider?: AiProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

// Input types for AI functions
export type GenerateTextInput = string | Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
export type StreamTextInput = Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;

export interface GenerateTextOptions {
  config?: AiConfig;
  // Additional Vercel AI SDK options can be passed through
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  seed?: number;
  stop?: string | string[];
  [key: string]: unknown;
}

export interface StreamTextOptions extends GenerateTextOptions {
  // Inherits all GenerateTextOptions
}

export interface AgentRunOptions extends GenerateTextOptions {
  instructions?: string;
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  tools?: Record<string, unknown>;
}
