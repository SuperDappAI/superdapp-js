/**
 * OpenAI Agents SDK Provider Module
 * 
 * This module encapsulates all @openai/agents imports and usage to prevent
 * circular dependencies and allow graceful fallback when the package is not available.
 * 
 * Features:
 * - Dynamic import only when used
 * - Graceful module-missing handling
 * - Type-safe interfaces for both success and fallback scenarios
 */

import type { AIConfig } from '../config';

/**
 * Options for running an OpenAI Agent
 */
export interface OpenAIAgentOptions {
  instructions?: string;
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  tools?: Record<string, unknown>;
  maxTurns?: number;
  streaming?: boolean;
  temperature?: number;
  maxTokens?: number;
  model?: unknown; // The AI model instance from config
}

/**
 * Result from running an OpenAI Agent
 */
export interface OpenAIAgentResult {
  outputText: string;
  usage?: {
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
  };
  finishReason?: string;
  toolCalls?: Array<{
    name: string;
    args: unknown;
    result?: unknown;
  }>;
}

/**
 * Options for streaming an OpenAI Agent
 */
export interface OpenAIAgentStreamOptions extends OpenAIAgentOptions {
  streaming: true;
}

/**
 * Event emitted during agent streaming
 */
export interface OpenAIAgentEvent {
  type: 'text' | 'tool_call' | 'error' | 'done';
  data: unknown;
  timestamp: Date;
}

/**
 * Error thrown when OpenAI Agents SDK is not available
 */
export class OpenAIAgentsNotAvailableError extends Error {
  constructor(message: string = 'OpenAI Agents SDK is not available') {
    super(message);
    this.name = 'OpenAIAgentsNotAvailableError';
  }
}

/**
 * Check if OpenAI Agents SDK is available
 */
export async function isOpenAIAgentsAvailable(): Promise<boolean> {
  try {
    await import('@openai/agents');
    return true;
  } catch {
    return false;
  }
}

/**
 * Map messages to OpenAI Agents SDK format
 */
function mapMessagesToAgentsFormat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Array<{ role: string; content: string }> {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Map tools to OpenAI Agents SDK format
 */
function mapToolsToAgentsFormat(tools: Record<string, unknown>): unknown[] {
  // Convert tools to Agents SDK format - this is a simplified mapping
  // In practice, this would need more sophisticated conversion logic
  return Object.entries(tools).map(([name, config]) => ({
    type: 'function',
    function: {
      name,
      description: `Tool: ${name}`,
      parameters: config || {},
    },
  }));
}

/**
 * Run an OpenAI Agent with the provided options
 * 
 * @param options - Agent execution options
 * @returns Promise resolving to agent result
 * @throws OpenAIAgentsNotAvailableError if the SDK is not available
 */
export async function runOpenAIAgent(options: OpenAIAgentOptions): Promise<OpenAIAgentResult> {
  try {
    // Dynamic import of the OpenAI Agents SDK
    const { Agent } = await import('@openai/agents');
    
    if (!options.model) {
      throw new Error('Model is required for OpenAI Agents');
    }

    // Create agent instance
    const agent = new Agent({
      name: 'superdapp-agent',
      model: options.model,
      instructions: options.instructions || 'You are a helpful assistant.',
      tools: options.tools ? mapToolsToAgentsFormat(options.tools) : [],
    } as any);

    // Prepare messages
    const messages = options.messages ? mapMessagesToAgentsFormat(options.messages) : [];
    
    // Run the agent
    const result = await (agent as any).run({
      messages,
      maxTurns: options.maxTurns || 10,
      // Pass through additional options
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.maxTokens !== undefined && { maxTokens: options.maxTokens }),
    });

    // Extract and return result in our standard format
    const resultObj: OpenAIAgentResult = {
      outputText: result?.content || result?.message?.content || 'No output generated',
      finishReason: result?.finishReason || 'stop',
    };

    if (result?.usage) {
      resultObj.usage = {
        totalTokens: result.usage.totalTokens,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
      };
    }

    if (result?.toolCalls) {
      resultObj.toolCalls = result.toolCalls.map((call: any) => ({
        name: call.function?.name || call.name,
        args: call.function?.arguments || call.args,
        result: call.result,
      }));
    }

    return resultObj;
  } catch (error) {
    // Check if this is a module not found error
    if (error instanceof Error && error.message.includes('Cannot resolve module')) {
      throw new OpenAIAgentsNotAvailableError('OpenAI Agents SDK is not installed. Install it with: npm install @openai/agents');
    }
    
    // Re-throw other errors
    throw new Error(`OpenAI Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Stream an OpenAI Agent with real-time events
 * 
 * @param options - Agent streaming options
 * @returns AsyncGenerator yielding agent events
 * @throws OpenAIAgentsNotAvailableError if the SDK is not available
 */
export async function* streamOpenAIAgent(
  options: OpenAIAgentStreamOptions
): AsyncGenerator<OpenAIAgentEvent, void, unknown> {
  try {
    // Dynamic import of the OpenAI Agents SDK
    const { Agent } = await import('@openai/agents');
    
    if (!options.model) {
      throw new Error('Model is required for OpenAI Agents');
    }

    // Create agent instance
    const agent = new Agent({
      name: 'superdapp-agent',
      model: options.model,
      instructions: options.instructions || 'You are a helpful assistant.',
      tools: options.tools ? mapToolsToAgentsFormat(options.tools) : [],
    } as any);

    // Prepare messages
    const messages = options.messages ? mapMessagesToAgentsFormat(options.messages) : [];
    
    // Start streaming
    yield {
      type: 'text',
      data: { message: 'Starting OpenAI Agent execution...' },
      timestamp: new Date(),
    };

    try {
      // Check if streaming is supported by the agent
      const agentAny = agent as any;
      if (agentAny.stream) {
        // Use native streaming if available
        for await (const event of agentAny.stream({
          messages,
          maxTurns: options.maxTurns || 10,
        })) {
          yield {
            type: event.type || 'text',
            data: event.data || event,
            timestamp: new Date(),
          };
        }
      } else {
        // Fallback to running normally and yielding the result
        const result = await (agent as any).run({
          messages,
          maxTurns: options.maxTurns || 10,
        });

        yield {
          type: 'text',
          data: { content: result?.content || 'No output generated' },
          timestamp: new Date(),
        };
      }

      yield {
        type: 'done',
        data: { completed: true },
        timestamp: new Date(),
      };
    } catch (streamError) {
      yield {
        type: 'error',
        data: { error: streamError instanceof Error ? streamError.message : String(streamError) },
        timestamp: new Date(),
      };
    }
  } catch (error) {
    // Check if this is a module not found error
    const moduleNotFoundMessages = [
      'Cannot resolve module',
      'Cannot find module',
      'Module not found',
      'Error loading module',
    ];
    if (
      error instanceof Error &&
      (
        (typeof (error as any).code === 'string' && (error as any).code === 'MODULE_NOT_FOUND') ||
        moduleNotFoundMessages.some(msg => error.message.includes(msg))
      )
    ) {
      throw new OpenAIAgentsNotAvailableError('OpenAI Agents SDK is not installed. Install it with: npm install @openai/agents');
    }
    
    // Yield error event for other errors
    yield {
      type: 'error',
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date(),
    };
  }
}

/**
 * Helper to create OpenAI Agent options from standard AI config and parameters
 */
export function createOpenAIAgentOptions(
  config: AIConfig,
  model: unknown,
  options: {
    instructions?: string;
    messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    tools?: Record<string, unknown>;
    maxTurns?: number;
    streaming?: boolean;
    temperature?: number;
    maxTokens?: number;
  } = {}
): OpenAIAgentOptions {
  const agentOptions: OpenAIAgentOptions = {
    model,
  };

  if (options.instructions !== undefined) agentOptions.instructions = options.instructions;
  if (options.messages !== undefined) agentOptions.messages = options.messages;
  if (options.tools !== undefined) agentOptions.tools = options.tools;
  if (options.maxTurns !== undefined) agentOptions.maxTurns = options.maxTurns;
  if (options.streaming !== undefined) agentOptions.streaming = options.streaming;
  if (options.temperature !== undefined) agentOptions.temperature = options.temperature;
  if (options.maxTokens !== undefined) agentOptions.maxTokens = options.maxTokens;

  return agentOptions;
}