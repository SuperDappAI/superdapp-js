import { AiConfig } from './ai-service';

// Core exports
export { SuperDappClient } from './core/client';
export { SuperDappAgent } from './core/agent';

// Type exports
export * from './types';

// Utility exports
export * from './utils';
export { formatBody } from './utils/messageFormatter';

// Error handling exports
export * from './utils/errors';

// Validation exports
export * from './utils/validation';

// Re-export commonly used external libraries
export { z } from 'zod';
export * as schedule from 'node-schedule';

// Webhook exports
export * from './webhook/agent';
export * from './webhook/server';
export * from './webhook/registry';

// Payouts exports
export * from './payouts';

// Wallet exports
export * from './wallet';

export type {
  AiConfig,
  AiProvider,
  GenerateTextOptions,
  StreamTextOptions,
  AgentRunOptions,
} from './ai-service/types';

// AI client functions (uses Vercel AI SDK under the hood)
// These handle all model-specific quirks automatically
export { generateText, streamText, runAgent } from './ai-service/client';

// AI configuration and model loading
export {
  loadModel,
  loadAIConfig,
  isSupportedProvider,
  getSupportedProviders,
} from './ai-service/config';

// Enhanced AI exports (lazy loaded)
export type {
  EnhancedAgentRunOptions,
  AgentHandoff,
  GuardrailsConfig,
  HumanApprovalOptions,
  AgentEvent,
  TracingData,
} from './ai-service/enhanced-client';

// OpenAI Agents provider types (lazy loaded)
export type {
  OpenAIAgentOptions,
  OpenAIAgentResult,
  OpenAIAgentEvent,
  OpenAIAgentsNotAvailableError,
} from './ai-service/providers/openai-agents';

// Enhanced AI client factory (lazy loaded to avoid loading dependencies)
export { createEnhancedAIClient, EnhancedAIClient } from './ai-service/enhanced-client';

// Edge-compatible AI client (for Cloudflare Workers, Vercel Edge, etc.)
export {
  EdgeAIClient,
  createEdgeAIClient,
  type EdgeAIProvider,
  type EdgeAIConfig,
  type EdgeGenerateOptions,
  type EdgeImageGenerationOptions,
  type EdgeChatMessage,
} from './ai-service/edge-client';
