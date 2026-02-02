/// <reference lib="dom" />
/**
 * Edge-compatible AI Client using fetch API
 *
 * This module provides a lightweight, fetch-based AI client that works in:
 * - Cloudflare Workers (workerd)
 * - Vercel Edge Functions
 * - Deno Deploy
 * - Any JavaScript runtime with fetch support
 *
 * Unlike the main client.ts which uses Vercel AI SDK with Node.js dependencies,
 * this module uses only the fetch API for maximum compatibility.
 */

export type EdgeAIProvider = 'openai' | 'anthropic';

export interface EdgeAIConfig {
  provider: EdgeAIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface EdgeGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface EdgeImageGenerationOptions {
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'low' | 'medium' | 'high' | 'auto';
  model?: string;
  timeoutMs?: number;
}

export interface EdgeChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Helper to build fetch options with optional signal
 */
function buildFetchOptions(
  method: string,
  headers: Record<string, string>,
  body: unknown,
  controller?: AbortController
): globalThis.RequestInit {
  const options: globalThis.RequestInit = {
    method,
    headers,
    body: JSON.stringify(body),
  };
  if (controller) {
    options.signal = controller.signal;
  }
  return options;
}

/**
 * Edge-compatible AI Client
 * Uses only fetch API for maximum runtime compatibility
 */
export class EdgeAIClient {
  private config: EdgeAIConfig;

  constructor(config: EdgeAIConfig) {
    this.config = config;
  }

  /**
   * Generate text using chat completion API
   */
  async generateText(
    messages: EdgeChatMessage[],
    options: EdgeGenerateOptions = {}
  ): Promise<string | null> {
    const controller =
      typeof AbortController !== 'undefined'
        ? new AbortController()
        : undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const timeoutMs = options.timeoutMs ?? 30000;
      if (controller && timeoutMs > 0) {
        timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      }

      if (this.config.provider === 'openai') {
        return await this.callOpenAI(messages, options, controller);
      } else if (this.config.provider === 'anthropic') {
        return await this.callAnthropic(messages, options, controller);
      }

      throw new Error(`Unsupported provider: ${this.config.provider}`);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  /**
   * Generate text with a simple prompt (convenience method)
   */
  async generate(
    systemPrompt: string,
    userPrompt: string,
    options: EdgeGenerateOptions = {}
  ): Promise<string | null> {
    return this.generateText(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options
    );
  }

  /**
   * Generate an image using OpenAI's image generation API
   */
  async generateImage(
    prompt: string,
    options: EdgeImageGenerationOptions = {}
  ): Promise<string | null> {
    if (this.config.provider !== 'openai') {
      console.warn(
        '[EdgeAI] Image generation only supported with OpenAI provider'
      );
      return null;
    }

    const controller =
      typeof AbortController !== 'undefined'
        ? new AbortController()
        : undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const timeoutMs = options.timeoutMs ?? 60000;
      if (controller && timeoutMs > 0) {
        timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      }

      const baseUrl = this.config.baseUrl || 'https://api.openai.com';
      const fetchOptions = buildFetchOptions(
        'POST',
        {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        {
          model: options.model || 'gpt-image-1-mini',
          prompt: prompt,
          n: 1,
          size: options.size || '1024x1024',
          quality: options.quality || 'low',
        },
        controller
      );

      const res = await globalThis.fetch(
        `${baseUrl}/v1/images/generations`,
        fetchOptions
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.warn('[EdgeAI] Image generation error', res.status, errorText);
        return null;
      }

      const json = (await res.json()) as {
        data?: Array<{ url?: string; b64_json?: string }>;
      };

      // Return URL or base64 data
      const imageData = json?.data?.[0];
      return (
        imageData?.url ||
        (imageData?.b64_json
          ? `data:image/png;base64,${imageData.b64_json}`
          : null)
      );
    } catch (e) {
      console.warn('[EdgeAI] Image generation error:', e);
      return null;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  /**
   * Call OpenAI Chat Completion API
   */
  private async callOpenAI(
    messages: EdgeChatMessage[],
    options: EdgeGenerateOptions,
    controller?: AbortController
  ): Promise<string | null> {
    try {
      // Newer models (gpt-4o, gpt-5, o1, o3, o4-mini, etc.) use max_completion_tokens
      // Older models (gpt-4, gpt-3.5-turbo) use max_tokens
      const isNewerModel =
        this.config.model.startsWith('gpt-4o') ||
        this.config.model.startsWith('gpt-5') ||
        this.config.model.startsWith('o1') ||
        this.config.model.startsWith('o3') ||
        this.config.model.startsWith('o4');

      // Reasoning models and newer GPT-5 models don't support custom temperature
      // Only the default (1) value is supported
      const isReasoningModel =
        this.config.model.startsWith('gpt-5') ||
        this.config.model.startsWith('o1') ||
        this.config.model.startsWith('o3') ||
        this.config.model.startsWith('o4');

      const requestBody: Record<string, unknown> = {
        model: this.config.model,
        messages,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
      };

      // Only set temperature for non-reasoning models
      if (!isReasoningModel && options.temperature !== undefined) {
        requestBody.temperature = options.temperature;
      }

      // Use appropriate token limit parameter based on model
      if (options.maxTokens) {
        if (isNewerModel) {
          requestBody.max_completion_tokens = options.maxTokens;
        } else {
          requestBody.max_tokens = options.maxTokens;
        }
      }

      // Remove undefined values
      Object.keys(requestBody).forEach((key) => {
        if (requestBody[key] === undefined) {
          delete requestBody[key];
        }
      });

      const baseUrl = this.config.baseUrl || 'https://api.openai.com';
      const fetchOptions = buildFetchOptions(
        'POST',
        {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        requestBody,
        controller
      );

      const res = await globalThis.fetch(
        `${baseUrl}/v1/chat/completions`,
        fetchOptions
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.warn('[EdgeAI] OpenAI error', res.status, errorText);
        return null;
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        output_text?: string; // Some newer models use this
      };

      // Try standard chat completion format first
      let content = json?.choices?.[0]?.message?.content ?? null;

      // Some newer OpenAI models (like gpt-5) might use output_text
      if (!content && json?.output_text) {
        content = json.output_text;
      }

      console.log(
        '[EdgeAI] OpenAI response received, content length:',
        content?.length ?? 0,
        'choices:',
        json?.choices?.length ?? 0
      );

      // If still no content, log the structure for debugging
      if (!content) {
        console.warn('[EdgeAI] Empty content, response keys:', Object.keys(json || {}));
      }

      return content;
    } catch (e) {
      console.warn('[EdgeAI] OpenAI call error:', e);
      return null;
    }
  }

  /**
   * Call Anthropic Messages API
   */
  private async callAnthropic(
    messages: EdgeChatMessage[],
    options: EdgeGenerateOptions,
    controller?: AbortController
  ): Promise<string | null> {
    try {
      // Separate system message from other messages
      const systemMessage = messages.find((m) => m.role === 'system');
      const nonSystemMessages = messages.filter((m) => m.role !== 'system');

      const baseUrl = this.config.baseUrl || 'https://api.anthropic.com';
      const fetchOptions = buildFetchOptions(
        'POST',
        {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        {
          model: this.config.model,
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature,
          top_p: options.topP,
          system: systemMessage?.content,
          messages: nonSystemMessages.map((m) => ({
            role: m.role,
            content: [{ type: 'text', text: m.content }],
          })),
        },
        controller
      );

      const res = await globalThis.fetch(
        `${baseUrl}/v1/messages`,
        fetchOptions
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.warn('[EdgeAI] Anthropic error', res.status, errorText);
        return null;
      }

      const json = (await res.json()) as {
        content?: Array<{ text?: string }>;
      };
      return json?.content?.[0]?.text ?? null;
    } catch (e) {
      console.warn('[EdgeAI] Anthropic call error:', e);
      return null;
    }
  }

  /**
   * Update the AI configuration
   */
  setConfig(config: Partial<EdgeAIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration (without exposing API key)
   */
  getConfig(): Omit<EdgeAIConfig, 'apiKey'> & { apiKey: string } {
    return {
      ...this.config,
      apiKey: this.config.apiKey ? '***' : '',
    };
  }
}

/**
 * Create an edge-compatible AI client
 * Factory function for convenience
 */
export function createEdgeAIClient(config: EdgeAIConfig): EdgeAIClient {
  return new EdgeAIClient(config);
}
