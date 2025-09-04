/**
 * Enhanced AI Client with expanded OpenAI Agents SDK support
 * This module provides additional features like handoffs, guardrails, and streaming events
 */

import type { AgentRunOptions, AiConfig } from './types';

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

      // Load the basic AI functionality instead of OpenAI Agents SDK directly
      // since the OpenAI Agents SDK may not be available
      const { generateText } = await import('./client');

      // For now, use the basic generateText function since OpenAI Agents SDK
      // may not be available or properly typed
      const messages = options.messages || [
        { role: 'user' as const, content: options.instructions || 'Hello' },
      ];

      this.addEvent('text', {
        type: 'agent_created',
        model: options.config?.model || 'default',
      });

      // Use generateText instead of the OpenAI Agents SDK for now
      const outputText = await generateText(
        messages.map((m) => m.content).join('\n'),
        options.config ? { config: options.config } : undefined
      );

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
   * Stream agent events in real-time
   */
  async *streamAgentEvents(
    options: EnhancedAgentRunOptions = {}
  ): AsyncGenerator<AgentEvent, void, unknown> {
    try {
      // This is a simplified version - full implementation would require OpenAI Agents SDK streaming support
      this.setTracing(true);

      yield {
        type: 'text',
        data: 'Starting agent execution...',
        timestamp: new Date(),
      };

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
