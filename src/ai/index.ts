// AI Module - Model-agnostic AI integration
// All AI functionality is loaded dynamically to avoid requiring AI dependencies when not used

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
export type AIProvider = (typeof AI_PROVIDERS)[number];

// Default export for convenience
export default {
  AI_PROVIDERS,
};

// Export AI configuration and model loading functionality
export {
  loadModel,
  loadAIConfig,
  isSupportedProvider,
  getSupportedProviders,
  AIConfigError,
} from './config';
export type {
  AIConfig as AdvancedAIConfig,
  AIProvider as AdvancedAIProvider,
} from './config';

export * from './types';
export * from './client';

// Enhanced AI features
export * from './enhanced-client';
