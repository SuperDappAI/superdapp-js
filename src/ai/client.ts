import type { AgentRunOptions, GenerateTextOptions, StreamTextOptions } from './types';

// Temporary, provider-agnostic fallbacks; will be implemented in issues #36-#38

export async function generateText(prompt: string, _options: GenerateTextOptions = {}): Promise<string> {
  // Placeholder to keep API surface stable; real implementation will route to Vercel AI SDK models
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('generateText: prompt must be a non-empty string');
  }
  // Provide a deterministic placeholder output to avoid surprising callers during scaffold
  return `AI response (scaffold): ${prompt.slice(0, 64)}`;
}

export async function streamText(
  _messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  _options: StreamTextOptions = {}
): Promise<AsyncIterable<string>> {
  // Minimal mock stream: yields one chunk. Real impl will return a stream from AI SDK
  async function* oneShot() {
    yield 'AI stream (scaffold)';
  }
  return oneShot();
}

export async function runAgent(_options: AgentRunOptions = {}): Promise<{ outputText: string }> {
  // Stub implementation; real one will construct an Agents SDK Agent with aisdk(model)
  return { outputText: 'Agent output (scaffold)' };
}
