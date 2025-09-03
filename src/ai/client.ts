import { generateText as vercelGenerateText, streamText as vercelStreamText } from 'ai';
import { Agent } from '@openai/agents';
import { loadModel } from './config';
import type { 
  AgentRunOptions, 
  GenerateTextOptions, 
  StreamTextOptions,
  GenerateTextInput,
  StreamTextInput 
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
    const model = await loadModel(options.config);
    
    // Handle different input types
    if (typeof input === 'string') {
      const result = await vercelGenerateText({
        model,
        prompt: input,
        ...options,
      });
      return result.text;
    } else {
      const result = await vercelGenerateText({
        model,
        messages: input,
        ...options,
      });
      return result.text;
    }
  } catch (error) {
    throw new Error(`generateText failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const model = await loadModel(options.config);
    
    const result = await vercelStreamText({
      model,
      messages: input,
      ...options,
    });
    
    // Create async generator that yields text chunks
    async function* textStream() {
      for await (const chunk of result.textStream) {
        yield chunk;
      }
    }
    
    return textStream();
  } catch (error) {
    throw new Error(`streamText failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Run an AI agent with tools and instructions
 * 
 * @param options - Agent execution options including instructions, messages, and tools
 * @returns Promise resolving to agent output
 */
export async function runAgent(options: AgentRunOptions = {}): Promise<{ outputText: string }> {
  try {
    const model = await loadModel(options.config);
    
    // Create an Agent instance using the OpenAI Agents SDK
    const agent = new Agent({
      model,
      instructions: options.instructions || 'You are a helpful assistant.',
      tools: options.tools || {},
    });
    
    // Execute the agent with the provided messages
    const messages = options.messages || [];
    const result = await agent.run({ messages });
    
    // Extract the text output from the agent result
    const outputText = result.content || 'No output generated';
    
    return { outputText };
  } catch (error) {
    throw new Error(`runAgent failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
