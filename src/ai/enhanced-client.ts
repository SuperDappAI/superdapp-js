/**
 * Enhanced AI Client with expanded OpenAI Agents SDK support
 * This module provides additional features like handoffs, guardrails, and streaming events
 */

import type { AgentRunOptions } from './types';
import type { AIConfig } from './config';

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
 * 
 * Note: Use createEnhancedAIClient() factory function instead of direct instantiation
 * to ensure proper configuration loading and validation.
 */
export class EnhancedAIClient {
  private aiConfig: AIConfig;
  private tracingEnabled: boolean = false;
  private currentSession: string | null = null;
  private events: AgentEvent[] = [];

  constructor(aiConfig: AIConfig) {
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

      // Check if we should use OpenAI Agents SDK
      const shouldUseAgents = this.aiConfig.provider === 'openai' && 
                             this.aiConfig.agents?.enabled === true;

      let outputText: string;

      if (shouldUseAgents) {
        // Try to use OpenAI Agents SDK
        try {
          const { loadModel } = await import('./config');
          const { 
            runOpenAIAgent, 
            createOpenAIAgentOptions,
            isOpenAIAgentsAvailable
          } = await import('./providers/openai-agents');

          // Check if the SDK is available
          const isAvailable = await isOpenAIAgentsAvailable();
          
          if (isAvailable) {
            this.addEvent('text', {
              type: 'using_openai_agents',
              model: options.config?.model || this.aiConfig.model,
            });

            const model = await loadModel(options.config || this.aiConfig);
            
            const agentOptions = createOpenAIAgentOptions(
              this.aiConfig,
              model,
              {
                ...(options.instructions !== undefined && { instructions: options.instructions }),
                ...(options.messages !== undefined && { messages: options.messages }),
                ...(options.tools !== undefined && { tools: options.tools }),
                ...(this.aiConfig.agents?.maxTurns !== undefined && { maxTurns: this.aiConfig.agents.maxTurns }),
                ...(this.aiConfig.agents?.streaming !== undefined && { streaming: this.aiConfig.agents.streaming }),
                ...(options.temperature !== undefined && { temperature: options.temperature }),
                ...(options.maxTokens !== undefined && { maxTokens: options.maxTokens }),
              }
            );

            const result = await runOpenAIAgent(agentOptions);
            outputText = result.outputText;

            // Add usage information to tracing if available
            if (result.usage) {
              this.addEvent('text', {
                type: 'usage_info',
                usage: result.usage,
              });
            }
          } else {
            // OpenAI Agents SDK not available, fall back to basic generateText
            this.addEvent('text', {
              type: 'fallback_to_generatetext',
              reason: 'openai_agents_not_available',
            });

            outputText = await this.fallbackToGenerateText(options);
          }
        } catch (error) {
          // If it's specifically an OpenAI Agents not available error, fall back gracefully
          if (error && (error as any).name === 'OpenAIAgentsNotAvailableError') {
            this.addEvent('text', {
              type: 'fallback_to_generatetext',
              reason: 'openai_agents_not_installed',
            });

            outputText = await this.fallbackToGenerateText(options);
          } else {
            // Other errors should be thrown
            throw error;
          }
        }
      } else {
        // Use basic generateText path
        this.addEvent('text', {
          type: 'using_generatetext',
          reason: shouldUseAgents ? 'agents_disabled' : 'non_openai_provider',
        });

        outputText = await this.fallbackToGenerateText(options);
      }

      // Output validation
      if (
        !this.validateOutput(outputText, options.guardrails?.outputValidation)
      ) {
        throw new Error('Output validation failed');
      }

      // Human approval for output if required
      if (options.guardrails?.outputValidation?.requireApproval) {
        const approved = await this.requestHumanApproval(
          `Agent wants to respond: "${outputText}"`,
          { required: true, timeout: 30000 }
        );
        if (!approved) {
          return {
            outputText: 'Response was not approved for delivery.',
            ...(this.getTracingData() && { tracing: this.getTracingData()! }),
          };
        }
      }

      this.addEvent('text', {
        type: 'agent_complete',
        outputLength: outputText.length,
      });

      return {
        outputText,
        ...(this.getTracingData() && { tracing: this.getTracingData()! }),
      };
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
   * Fallback to basic generateText when OpenAI Agents SDK is not available
   */
  private async fallbackToGenerateText(
    options: EnhancedAgentRunOptions
  ): Promise<string> {
    // Load the basic AI functionality instead of OpenAI Agents SDK directly
    const { generateText } = await import('./client');

    // Prepare messages for generateText
    const messages = options.messages || [
      { role: 'user' as const, content: options.instructions || 'Hello' },
    ];

    this.addEvent('text', {
      type: 'agent_created',
      model: options.config?.model || 'default',
    });

    // Use generateText instead of the OpenAI Agents SDK
    return await generateText(
      messages.map((m) => m.content).join('\n'),
      options.config ? { config: options.config } : undefined
    );
  }

  /**
   * Stream agent events in real-time
   */
  async *streamAgentEvents(
    options: EnhancedAgentRunOptions = {}
  ): AsyncGenerator<AgentEvent, void, unknown> {
    try {
      // Check if we should use OpenAI Agents SDK for streaming
      const shouldUseAgents = this.aiConfig.provider === 'openai' && 
                             this.aiConfig.agents?.enabled === true &&
                             this.aiConfig.agents?.streaming === true;

      this.setTracing(true);

      yield {
        type: 'text',
        data: shouldUseAgents ? 'Starting OpenAI Agents streaming...' : 'Starting basic agent execution...',
        timestamp: new Date(),
      };

      if (shouldUseAgents) {
        try {
          const { loadModel } = await import('./config');
          const { 
            streamOpenAIAgent, 
            createOpenAIAgentOptions,
            isOpenAIAgentsAvailable
          } = await import('./providers/openai-agents');

          // Check if the SDK is available
          const isAvailable = await isOpenAIAgentsAvailable();
          
          if (isAvailable) {
            const model = await loadModel(options.config || this.aiConfig);
            
            const agentOptions = createOpenAIAgentOptions(
              this.aiConfig,
              model,
              {
                ...(options.instructions !== undefined && { instructions: options.instructions }),
                ...(options.messages !== undefined && { messages: options.messages }),
                ...(options.tools !== undefined && { tools: options.tools }),
                ...(this.aiConfig.agents?.maxTurns !== undefined && { maxTurns: this.aiConfig.agents.maxTurns }),
                streaming: true,
                ...(options.temperature !== undefined && { temperature: options.temperature }),
                ...(options.maxTokens !== undefined && { maxTokens: options.maxTokens }),
              }
            );

            // Stream from OpenAI Agents SDK
            for await (const agentEvent of streamOpenAIAgent(agentOptions as any)) {
              // Convert OpenAI agent event to our standard format
              yield {
                type: agentEvent.type as AgentEvent['type'],
                data: agentEvent.data,
                timestamp: agentEvent.timestamp,
              };
              
              // Add to tracing
              this.addEvent(agentEvent.type as AgentEvent['type'], agentEvent.data);
            }
            
            return;
          } else {
            yield {
              type: 'text',
              data: 'OpenAI Agents SDK not available, falling back to basic execution...',
              timestamp: new Date(),
            };
          }
        } catch (error) {
          yield {
            type: 'text',
            data: 'OpenAI Agents streaming failed, falling back to basic execution...',
            timestamp: new Date(),
          };
        }
      }

      // Fallback to basic execution
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
  config?: Partial<AIConfig>
): Promise<EnhancedAIClient> {
  const { loadAIConfig } = await import('./config');
  const aiConfig = loadAIConfig(config);
  return new EnhancedAIClient(aiConfig);
}
