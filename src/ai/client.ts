import type {
  AgentRunOptions,
  GenerateTextOptions,
  StreamTextOptions,
  GenerateTextInput,
  StreamTextInput,
} from './types';

/**
 * Generate text using the configured AI model
 *
 * @param input - String prompt or messages array
 * @param options - Generation options including AI config overrides
 * @returns Promise resolving to generated text
 */
export async function generateText(
  input: GenerateTextInput,
  options: GenerateTextOptions = {}
): Promise<string> {
  try {
    // Dynamic import to avoid circular dependencies and optional loading
    const { loadModel } = await import('./config');
    const { generateText: vercelGenerateText } = await import('ai');

    const model = await loadModel(options.config as any);

    // Handle different input types
    const generateOptions: any = {
      model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      topP: options.topP,
      topK: options.topK,
      frequencyPenalty: options.frequencyPenalty,
      presencePenalty: options.presencePenalty,
      seed: options.seed,
      stop: options.stop,
    };

    if (typeof input === 'string') {
      generateOptions.prompt = input;
    } else {
      generateOptions.messages = input;
    }

    const result = await vercelGenerateText(generateOptions);
    return (result as any).text;
  } catch (error) {
    throw new Error(
      `generateText failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Stream text generation using the configured AI model
 *
 * @param input - Messages array for the conversation
 * @param options - Streaming options including AI config overrides
 * @returns Promise resolving to an async iterable of text chunks
 */
export async function streamText(
  input: StreamTextInput,
  options: StreamTextOptions = {}
): Promise<AsyncIterable<string>> {
  try {
    // Dynamic import to avoid circular dependencies and optional loading
    const { loadModel } = await import('./config');
    const { streamText: vercelStreamText } = await import('ai');

    const model = await loadModel(options.config as any);

    const result = await vercelStreamText({
      model,
      messages: input,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      topP: options.topP,
      topK: options.topK,
      frequencyPenalty: options.frequencyPenalty,
      presencePenalty: options.presencePenalty,
      seed: options.seed,
      stop: options.stop,
    } as any);

    // Type-safe access to the text stream without using `any`
    type TextStreamResult = { textStream: AsyncIterable<string> };
    const { textStream } = result as unknown as TextStreamResult;

    // Return an async generator that yields text chunks
    return (async function* () {
      for await (const chunk of textStream) {
        yield chunk;
      }
    })();
  } catch (error) {
    throw new Error(
      `streamText failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Run an AI agent with tools and instructions
 *
 * @param options - Agent execution options including instructions, messages, and tools
 * @returns Promise resolving to agent output
 */
export async function runAgent(
  options: AgentRunOptions = {}
): Promise<{ outputText: string }> {
  try {
    // Dynamic import to avoid circular dependencies and optional loading
    const { loadModel } = await import('./config');
    const { Agent } = await import('@openai/agents');

    const model = await loadModel(options.config as any);

    // Create an Agent instance using the OpenAI Agents SDK
    const agent = new Agent({
      name: 'superdapp-agent',
      model,
      instructions: options.instructions || 'You are a helpful assistant.',
      tools: (options.tools as any) || [],
    } as any);

    // Execute the agent with the provided messages
    const messages = options.messages || [];
    const result = await (agent as any).run({ messages });

    // Extract the text output from the agent result
    const outputText = result?.content || 'No output generated';

    return { outputText };
  } catch (error) {
    throw new Error(
      `runAgent failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
