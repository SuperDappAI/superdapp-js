// AI Module - Model-agnostic AI integration
// All AI functionality is loaded dynamically to avoid requiring AI dependencies when not used

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
  AIConfig,
  AIProvider as AdvancedAIProvider,
} from './config';

export * from './types';
export * from './client';

// Enhanced AI features
export * from './enhanced-client';

// Edge-compatible AI client (for Cloudflare Workers, Vercel Edge, etc.)
export * from './edge-client';
