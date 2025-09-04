/**
 * Enhanced AI Client with expanded OpenAI Agents SDK support
 * This module provides additional features like handoffs, guardrails, and streaming events
 */

import type { AgentRunOptions, AiConfig } from './types';
import type { OpenAIAgentOptions } from './providers/openai-agents';

/**
 * Extended types for enhanced AI features
 */
export interface AgentHandoff {
  agent: string;
  instructions?: string;
  context?: Record<string, unknown>;
}

export interface GuardrailsConfig {
  inputValidation?: {
    maxLength?: number;
    bannedWords?: string[];
    allowedPatterns?: RegExp[];
  };
  outputValidation?: {
    maxLength?: number;
    bannedWords?: string[];
    requireApproval?: boolean;
  };
}

export interface HumanApprovalOptions {
  required: boolean;
  timeout?: number; // milliseconds
  fallbackResponse?: string;
  approverCallback?: (request: string) => Promise<boolean>;
}

export interface EnhancedAgentRunOptions extends AgentRunOptions {
  handoffs?: AgentHandoff[];
  guardrails?: GuardrailsConfig;
  humanApproval?: HumanApprovalOptions;
  enableTracing?: boolean;
  parallelTools?: boolean;
  maxTurns?: number;
  streaming?: boolean;
}

export interface AgentEvent {
  type: 'text' | 'tool_call' | 'handoff' | 'approval_request' | 'error';
  data: unknown;
  timestamp: Date;
}

export interface TracingData {
  sessionId: string;
  events: AgentEvent[];
  duration: number;
  tokensUsed?: number;
  cost?: number;
}

/**
 * Enhanced AI Client class with full OpenAI Agents SDK integration
 */
export class EnhancedAIClient {
  private aiConfig: AiConfig;
  private tracingEnabled: boolean = false;
  private currentSession: string | null = null;
  private events: AgentEvent[] = [];

  constructor(aiConfig: AiConfig) {
    this.aiConfig = aiConfig;
  }

  /**
   * Enable or disable tracing for debugging and monitoring
   */
  setTracing(enabled: boolean): void {
    this.tracingEnabled = enabled;
    if (enabled && !this.currentSession) {
      this.currentSession = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.events = [];
    }
  }

  /**
   * Get current tracing data
   */
  getTracingData(): TracingData | null {
    if (!this.tracingEnabled || !this.currentSession) {
      return null;
    }

    return {
      sessionId: this.currentSession,
      events: [...this.events],
      duration:
        this.events.length > 0 &&
        this.events[0] &&
        this.events[this.events.length - 1]
          ? this.events[this.events.length - 1]!.timestamp.getTime() -
            this.events[0]!.timestamp.getTime()
          : 0,
    };
  }

  private addEvent(type: AgentEvent['type'], data: unknown): void {
    if (this.tracingEnabled) {
      this.events.push({
        type,
        data,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Validate input against guardrails
   */
  private validateInput(
    input: string,
    guardrails?: GuardrailsConfig['inputValidation']
  ): boolean {
    if (!guardrails) return true;

    if (guardrails.maxLength && input.length > guardrails.maxLength) {
      this.addEvent('error', {
        type: 'input_too_long',
        length: input.length,
        max: guardrails.maxLength,
      });
      return false;
    }

    if (guardrails.bannedWords) {
      const lowercaseInput = input.toLowerCase();
      for (const bannedWord of guardrails.bannedWords) {
        if (lowercaseInput.includes(bannedWord.toLowerCase())) {
          this.addEvent('error', {
            type: 'banned_word_detected',
            word: bannedWord,
          });
          return false;
        }
      }
    }

    if (guardrails.allowedPatterns) {
      const matchesPattern = guardrails.allowedPatterns.some((pattern) =>
        pattern.test(input)
      );
      if (!matchesPattern) {
        this.addEvent('error', { type: 'pattern_not_matched' });
        return false;
      }
    }

    return true;
  }

  /**
   * Validate output against guardrails
   */
  private validateOutput(
    output: string,
    guardrails?: GuardrailsConfig['outputValidation']
  ): boolean {
    if (!guardrails) return true;

    if (guardrails.maxLength && output.length > guardrails.maxLength) {
      this.addEvent('error', {
        type: 'output_too_long',
        length: output.length,
        max: guardrails.maxLength,
      });
      return false;
    }

    if (guardrails.bannedWords) {
      const lowercaseOutput = output.toLowerCase();
      for (const bannedWord of guardrails.bannedWords) {
        if (lowercaseOutput.includes(bannedWord.toLowerCase())) {
          this.addEvent('error', {
            type: 'banned_word_in_output',
            word: bannedWord,
          });
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Request human approval if configured
   */
  private async requestHumanApproval(
    request: string,
    options?: HumanApprovalOptions
  ): Promise<boolean> {
    if (!options?.required) return true;

    this.addEvent('approval_request', { request });

    if (options.approverCallback) {
      try {
        const approved = await Promise.race([
          options.approverCallback(request),
          new Promise<boolean>((_, reject) =>
            setTimeout(
              () => reject(new Error('Approval timeout')),
              options.timeout || 30000
            )
          ),
        ]);

        this.addEvent('approval_request', { approved, request });
        return approved;
      } catch (error) {
        this.addEvent('error', {
          type: 'approval_timeout',
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    }

    // Default: assume approval for now (in real implementation, this would integrate with UI)
    return true;
  }

  /**
   * Check if OpenAI Agents SDK should be used based on configuration
   */
  private shouldUseOpenAIAgents(options: EnhancedAgentRunOptions): boolean {
    // Check if the feature is enabled in config
    const agentsEnabled = this.aiConfig.agents?.enabled;
    
    // Only use OpenAI Agents SDK for OpenAI provider
    const isOpenAIProvider = this.aiConfig.provider === 'openai';
    
    // Feature must be enabled and provider must be OpenAI
    return Boolean(agentsEnabled && isOpenAIProvider);
  }

  /**
   * Run agent using OpenAI Agents SDK when available and enabled
   */
  private async runWithOpenAIAgents(
    options: EnhancedAgentRunOptions
  ): Promise<{ outputText: string; tracing?: TracingData }> {
    try {
      // Dynamic import of the OpenAI Agents provider
      const { runOpenAIAgent, isOpenAIAgentsSupported } = await import('./providers/openai-agents');
      
      // Check if OpenAI Agents is supported in current environment
      const supportCheck = await isOpenAIAgentsSupported();
      if (!supportCheck.available) {
        throw new Error(`OpenAI Agents SDK not available: ${supportCheck.reason}`);
      }

      this.addEvent('text', {
        type: 'agent_start_openai_agents',
        options: {
          instructions: options.instructions,
          toolCount: options.tools ? Object.keys(options.tools).length : 0,
        },
      });

      // Map options to OpenAI Agents format
      const agentOptions: Partial<OpenAIAgentOptions> = {
        config: this.aiConfig,
        ...(options.instructions && { instructions: options.instructions }),
        ...(options.messages && { messages: options.messages }),
        ...(options.tools && { tools: options.tools }),
        ...(options.handoffs && { handoffs: options.handoffs }),
        ...(options.parallelTools && { parallelTools: options.parallelTools }),
        ...(options.maxTurns && { maxTurns: options.maxTurns }),
        ...(options.streaming && { streaming: options.streaming }),
        ...(this.aiConfig.agents?.maxTurns && !options.maxTurns && { maxTurns: this.aiConfig.agents.maxTurns }),
        ...(this.aiConfig.agents?.streaming && !options.streaming && { streaming: this.aiConfig.agents.streaming }),
      };

      // Execute using OpenAI Agents SDK
      const result = await runOpenAIAgent(agentOptions);

      this.addEvent('text', {
        type: 'agent_complete_openai_agents',
        outputLength: result.outputText.length,
        metadata: result.metadata,
      });

      return {
        outputText: result.outputText,
        ...(this.getTracingData() && { tracing: this.getTracingData()! }),
      };
    } catch (error) {
      this.addEvent('error', {
        type: 'openai_agents_error',
        error: error instanceof Error ? error.message : String(error),
      });
      
      // If OpenAI Agents fails, throw error so we can fallback
      throw error;
    }
  }

  /**
   * Run agent using the basic generateText fallback
   */
  private async runWithGenerateText(
    options: EnhancedAgentRunOptions
  ): Promise<{ outputText: string; tracing?: TracingData }> {
    // Load the basic AI functionality
    const { generateText } = await import('./client');

    // Use the basic generateText function as fallback
    const messages = options.messages || [
      { role: 'user' as const, content: options.instructions || 'Hello' },
    ];

    this.addEvent('text', {
      type: 'agent_fallback_generatetext',
      model: options.config?.model || this.aiConfig.model || 'default',
    });

    // Use generateText as fallback
    const outputText = await generateText(
      messages.map((m) => m.content).join('\n'),
      options.config ? { config: options.config } : { config: this.aiConfig }
    );

    this.addEvent('text', {
      type: 'agent_complete_generatetext',
      outputLength: outputText.length,
    });

    return {
      outputText,
      ...(this.getTracingData() && { tracing: this.getTracingData()! }),
    };
  }

  /**
   * Enhanced agent runner with full OpenAI Agents SDK feature support
   */
  async runEnhancedAgent(
    options: EnhancedAgentRunOptions = {}
  ): Promise<{ outputText: string; tracing?: TracingData }> {
    try {
      this.addEvent('text', {
        type: 'agent_start',
        options: {
          instructions: options.instructions,
          toolCount: options.tools ? Object.keys(options.tools).length : 0,
        },
      });

      // Input validation
      const inputText = Array.isArray(options.messages)
        ? options.messages.map((m) => m.content).join(' ')
        : options.instructions || '';

      if (!this.validateInput(inputText, options.guardrails?.inputValidation)) {
        throw new Error('Input validation failed');
      }

      // Human approval for sensitive requests
      if (options.humanApproval?.required) {
        const approved = await this.requestHumanApproval(
          inputText,
          options.humanApproval
        );
        if (!approved) {
          return {
            outputText:
              options.humanApproval.fallbackResponse ||
              'Request was not approved.',
            ...(this.getTracingData() && { tracing: this.getTracingData()! }),
          };
        }
      }

      // Try to use OpenAI Agents SDK if enabled and available
      let result: { outputText: string; tracing?: TracingData };
      
      if (this.shouldUseOpenAIAgents(options)) {
        try {
          result = await this.runWithOpenAIAgents(options);
        } catch (error) {
          // If OpenAI Agents fails, fall back to generateText
          this.addEvent('text', {
            type: 'fallback_to_generatetext',
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
          result = await this.runWithGenerateText(options);
        }
      } else {
        // Use generateText fallback
        result = await this.runWithGenerateText(options);
      }

      // Output validation
      if (
        !this.validateOutput(result.outputText, options.guardrails?.outputValidation)
      ) {
        throw new Error('Output validation failed');
      }

      // Human approval for output if required
      if (options.guardrails?.outputValidation?.requireApproval) {
        const approved = await this.requestHumanApproval(
          `Agent wants to respond: "${result.outputText}"`,
          { required: true, timeout: 30000 }
        );
        if (!approved) {
          return {
            outputText: 'Response was not approved for delivery.',
            ...(this.getTracingData() && { tracing: this.getTracingData()! }),
          };
        }
      }

      return result;
    } catch (error) {
      this.addEvent('error', {
        type: 'agent_error',
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Enhanced agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Stream agent events in real-time
   */
  async *streamAgentEvents(
    options: EnhancedAgentRunOptions = {}
  ): AsyncGenerator<AgentEvent, void, unknown> {
    try {
      this.setTracing(true);

      yield {
        type: 'text',
        data: 'Starting agent execution...',
        timestamp: new Date(),
      };

      // Try to use OpenAI Agents SDK streaming if enabled and available
      if (this.shouldUseOpenAIAgents(options)) {
        try {
          const { streamOpenAIAgent, isOpenAIAgentsSupported } = await import('./providers/openai-agents');
          
          // Check if OpenAI Agents is supported
          const supportCheck = await isOpenAIAgentsSupported();
          if (supportCheck.available) {
            // Map options to OpenAI Agents format
            const agentOptions: Partial<OpenAIAgentOptions> = {
              config: this.aiConfig,
              ...(options.instructions && { instructions: options.instructions }),
              ...(options.messages && { messages: options.messages }),
              ...(options.tools && { tools: options.tools }),
              ...(options.handoffs && { handoffs: options.handoffs }),
              ...(options.parallelTools && { parallelTools: options.parallelTools }),
              ...(options.maxTurns && { maxTurns: options.maxTurns }),
              ...(options.streaming && { streaming: options.streaming }),
              ...(this.aiConfig.agents?.maxTurns && !options.maxTurns && { maxTurns: this.aiConfig.agents.maxTurns }),
              ...(this.aiConfig.agents?.streaming && !options.streaming && { streaming: this.aiConfig.agents.streaming }),
            };

            // Stream using OpenAI Agents SDK
            for await (const event of streamOpenAIAgent(agentOptions)) {
              yield {
                type: event.type as AgentEvent['type'],
                data: event.data,
                timestamp: event.timestamp,
              };
            }
            return;
          }
        } catch (error) {
          yield {
            type: 'text',
            data: `OpenAI Agents streaming failed, falling back to basic mode: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
          };
        }
      }

      // Fallback to basic streaming (using runEnhancedAgent)
      const result = await this.runEnhancedAgent(options);

      yield { type: 'text', data: result.outputText, timestamp: new Date() };

      if (result.tracing) {
        for (const event of result.tracing.events) {
          yield event;
        }
      }
    } catch (error) {
      yield {
        type: 'error',
        data: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute multiple agents in parallel and return the best result
   */
  async runParallelAgents(agentConfigs: EnhancedAgentRunOptions[]): Promise<{
    results: Array<{ outputText: string; score?: number }>;
    best: { outputText: string; index: number };
  }> {
    try {
      const promises = agentConfigs.map((config, index) =>
        this.runEnhancedAgent(config).catch((error) => ({
          outputText: `Agent ${index} failed: ${error.message}`,
          error: true,
        }))
      );

      const results = await Promise.all(promises);

      // Simple scoring - in practice this would be more sophisticated
      const scoredResults = results.map((result, index) => ({
        ...result,
        score:
          result.outputText.length > 0 && !('error' in result)
            ? result.outputText.length
            : 0,
        index,
      }));

      const best = scoredResults.reduce((prev, current) =>
        (current.score || 0) > (prev.score || 0) ? current : prev
      );

      return {
        results: results.map((r) => ({ outputText: r.outputText })),
        best: { outputText: best.outputText, index: best.index },
      };
    } catch (error) {
      throw new Error(
        `Parallel agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Create an enhanced AI client instance
 */
export async function createEnhancedAIClient(
  config?: AiConfig
): Promise<EnhancedAIClient> {
  const { loadAIConfig } = await import('./config');
  const aiConfig = loadAIConfig(config);
  return new EnhancedAIClient(aiConfig);
}
