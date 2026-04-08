export type AiProvider = 'openai' | 'anthropic' | 'google';

export interface AgentsConfig {
  enabled?: boolean;
  streaming?: boolean;
  maxTurns?: number;
}

export interface AiConfig {
  provider?: AiProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  agents?: AgentsConfig;
}

// Input types for AI functions
export type GenerateTextInput =
  | string
  | Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
export type StreamTextInput = Array<{
  role: 'system' | 'user' | 'assistant';
  content: string;
}>;

export interface GenerateTextOptions {
  config?: AiConfig;
  // System prompt (instructions for the AI)
  system?: string;
  // Additional Vercel AI SDK options can be passed through
  temperature?: number;
  maxTokens?: number;
  maxOutputTokens?: number;
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
