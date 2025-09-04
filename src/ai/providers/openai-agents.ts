/**
 * OpenAI Agents SDK Provider - Isolated module with dynamic imports
 * This module provides OpenAI Agents SDK features when available and installed,
 * with graceful fallback handling when the module is missing.
 */

import type { AgentRunOptions, AiConfig } from '../types';
import type { AIConfig } from '../config';

/**
 * Extended options for OpenAI Agents SDK features
 */
export interface OpenAIAgentOptions extends AgentRunOptions {
  handoffs?: Array<{
    agent: string;
    instructions?: string;
    context?: Record<string, unknown>;
  }>;
  parallelTools?: boolean;
  maxTurns?: number;
  streaming?: boolean;
}

/**
 * Agent execution result with additional metadata
 */
export interface OpenAIAgentResult {
  outputText: string;
  metadata?: {
    tokensUsed?: number;
    cost?: number;
    turns?: number;
    toolCalls?: Array<{
      name: string;
      arguments: Record<string, unknown>;
      result?: unknown;
    }>;
  };
}

/**
 * Event types for streaming agent execution
 */
export interface AgentStreamEvent {
  type: 'text' | 'tool_call' | 'handoff' | 'completion' | 'error';
  data: unknown;
  timestamp: Date;
}

/**
 * Check if OpenAI Agents SDK is available
 */
async function isOpenAIAgentsAvailable(): Promise<boolean> {
  try {
    const { Agent } = await import('@openai/agents');
    return typeof Agent === 'function';
  } catch {
    return false;
  }
}

/**
 * Create a model instance compatible with OpenAI Agents SDK
 */
async function createAgentsModel(config: Partial<AiConfig>) {
  try {
    // Convert AiConfig to AIConfig format
    const aiConfig = {
      provider: (config.provider || 'openai') as AIConfig['provider'],
      model: config.model || 'gpt-4',
      apiKey: config.apiKey || process.env.AI_API_KEY || '',
      ...(config.baseUrl && { baseUrl: config.baseUrl }),
      ...(config.agents && { agents: config.agents }),
    };
    
    // Load the model using existing config system
    const { loadModel } = await import('../config');
    return await loadModel(aiConfig);
  } catch (error) {
    throw new Error(
      `Failed to create model for OpenAI Agents: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Map messages to OpenAI Agents SDK format
 */
function mapMessagesToAgentsFormat(
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): any[] {
  if (!messages || messages.length === 0) {
    return [];
  }

  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Map tools to OpenAI Agents SDK format
 */
function mapToolsToAgentsFormat(tools?: Record<string, unknown>): any[] {
  if (!tools || Object.keys(tools).length === 0) {
    return [];
  }

  return Object.entries(tools).map(([name, definition]) => {
    // Ensure definition is an object before spreading
    const toolDef = typeof definition === 'object' && definition !== null ? definition : {};
    return {
      name,
      ...toolDef,
    };
  });
}

/**
 * Run OpenAI Agent with full SDK features
 */
export async function runOpenAIAgent(
  options: OpenAIAgentOptions = {}
): Promise<OpenAIAgentResult> {
  // Check if OpenAI Agents SDK is available
  if (!(await isOpenAIAgentsAvailable())) {
    throw new Error(
      'OpenAI Agents SDK is not available. Please install @openai/agents to use this feature.'
    );
  }

  try {
    // Dynamic import of OpenAI Agents SDK
    const { Agent } = await import('@openai/agents');
    
    // Create model instance
    const model = await createAgentsModel(options.config || {});

    // Map inputs to Agents SDK format
    const messages = mapMessagesToAgentsFormat(options.messages);
    const tools = mapToolsToAgentsFormat(options.tools);

    // Create Agent instance with configuration
    const agent = new Agent({
      name: 'superdapp-agent',
      model,
      instructions: options.instructions || 'You are a helpful assistant.',
      tools,
      // Additional OpenAI Agents SDK specific options
      ...(options.maxTurns && { maxTurns: options.maxTurns }),
    });

    // Execute the agent
    const result = await (agent as any).run({
      messages,
      ...(options.parallelTools && { parallel: options.parallelTools }),
    });

    // Extract output and metadata
    const outputText = result?.content || result?.text || 'No output generated';
    const metadata = {
      tokensUsed: result?.usage?.total_tokens,
      cost: result?.usage?.cost,
      turns: result?.turns || 1,
      toolCalls: result?.tool_calls || [],
    };

    return {
      outputText,
      metadata,
    };
  } catch (error) {
    throw new Error(
      `OpenAI Agent execution failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Stream OpenAI Agent execution with real-time events
 */
export async function* streamOpenAIAgent(
  options: OpenAIAgentOptions = {}
): AsyncGenerator<AgentStreamEvent, void, unknown> {
  // Check if OpenAI Agents SDK is available
  if (!(await isOpenAIAgentsAvailable())) {
    yield {
      type: 'error',
      data: {
        error: 'OpenAI Agents SDK is not available. Please install @openai/agents to use this feature.',
      },
      timestamp: new Date(),
    };
    return;
  }

  try {
    // Dynamic import of OpenAI Agents SDK
    const { Agent } = await import('@openai/agents');

    // Create model instance
    const model = await createAgentsModel(options.config || {});

    // Map inputs to Agents SDK format
    const messages = mapMessagesToAgentsFormat(options.messages);
    const tools = mapToolsToAgentsFormat(options.tools);

    // Create Agent instance
    const agent = new Agent({
      name: 'superdapp-agent',
      model,
      instructions: options.instructions || 'You are a helpful assistant.',
      tools,
      ...(options.maxTurns && { maxTurns: options.maxTurns }),
    });

    // Stream agent execution
    const stream = (agent as any).stream({
      messages,
      ...(options.parallelTools && { parallel: options.parallelTools }),
    });

    for await (const event of stream) {
      // Map OpenAI Agents SDK events to our format
      if (event.type === 'text') {
        yield {
          type: 'text',
          data: event.data,
          timestamp: new Date(),
        };
      } else if (event.type === 'tool_call') {
        yield {
          type: 'tool_call',
          data: {
            name: event.name,
            arguments: event.arguments,
            result: event.result,
          },
          timestamp: new Date(),
        };
      } else if (event.type === 'completion') {
        yield {
          type: 'completion',
          data: {
            outputText: event.content || event.text,
            metadata: {
              tokensUsed: event.usage?.total_tokens,
              cost: event.usage?.cost,
              turns: event.turns || 1,
            },
          },
          timestamp: new Date(),
        };
      }
    }
  } catch (error) {
    yield {
      type: 'error',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date(),
    };
  }
}

/**
 * Check if OpenAI Agents features are supported in the current environment
 */
export async function isOpenAIAgentsSupported(): Promise<{
  available: boolean;
  reason?: string;
}> {
  try {
    const available = await isOpenAIAgentsAvailable();
    if (!available) {
      return {
        available: false,
        reason: 'OpenAI Agents SDK (@openai/agents) is not installed',
      };
    }

    // Additional checks could be added here (e.g., API key validation)
    return { available: true };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get OpenAI Agents SDK version if available
 */
export async function getOpenAIAgentsVersion(): Promise<string | null> {
  try {
    const { version } = await import('@openai/agents/package.json');
    return version || null;
  } catch {
    return null;
  }
}