// AI Module - Model-agnostic AI integration
// Basic exports to enable AI functionality

// Re-export core AI SDK
export * from 'ai';

// Re-export OpenAI Agents
export * from '@openai/agents';

// Re-export AI provider with specific exports to avoid conflicts
export { openai } from '@ai-sdk/openai';
export type { OpenAIProvider as OpenAISDKProvider } from '@ai-sdk/openai';

// AI utility types for SuperDapp integration
export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'google';
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Basic AI utilities
export const AI_PROVIDERS = ['openai', 'anthropic', 'google'] as const;
export type AIProvider = typeof AI_PROVIDERS[number];

// Default export for convenience
export default {
  AI_PROVIDERS,
};

export * from './types';
export * from './client';
