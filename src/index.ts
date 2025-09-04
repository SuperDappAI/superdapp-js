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

// AI types only (no implementation to avoid loading AI dependencies)
export type { AiConfig, AiProvider, GenerateTextOptions, StreamTextOptions, AgentRunOptions } from './ai/types';

// Enhanced AI exports (lazy loaded)
export type { 
  EnhancedAgentRunOptions,
  AgentHandoff,
  GuardrailsConfig,
  HumanApprovalOptions,
  AgentEvent,
  TracingData
} from './ai/enhanced-client';

// OpenAI Agents provider types (lazy loaded)
export type {
  OpenAIAgentOptions,
  OpenAIAgentResult,
  OpenAIAgentEvent,
  OpenAIAgentsNotAvailableError
} from './ai/providers/openai-agents';

// Enhanced AI client factory (lazy loaded to avoid loading dependencies)
export { createEnhancedAIClient, EnhancedAIClient } from './ai/enhanced-client';
