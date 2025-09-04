import { generateText, streamText, runAgent } from '../../ai/client';
import { loadModel } from '../../ai/config';
import * as aiModule from 'ai';
import * as agentsModule from '@openai/agents';

// Mock the AI SDK and Agents SDK
jest.mock('ai');
jest.mock('@openai/agents');
jest.mock('../../ai/config');

const mockLoadModel = loadModel as jest.MockedFunction<typeof loadModel>;
const mockGenerateText = aiModule.generateText as jest.MockedFunction<typeof aiModule.generateText>;
const mockStreamText = aiModule.streamText as jest.MockedFunction<typeof aiModule.streamText>;
const mockAgent = agentsModule.Agent as jest.MockedClass<typeof agentsModule.Agent>;

describe('AI Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the model
    mockLoadModel.mockResolvedValue('mock-model' as any);
    
    // Mock generateText
    mockGenerateText.mockResolvedValue({
      text: 'Generated response',
      finishReason: 'stop',
      usage: { totalTokens: 100 }
    } as any);
    
    // Mock streamText
    const mockTextStream = async function* () {
      yield 'chunk1';
      yield 'chunk2';
      yield 'chunk3';
    };
    
    mockStreamText.mockResolvedValue({
      textStream: mockTextStream(),
    } as any);
    
    // Mock Agent
    const mockAgentInstance = {
      run: jest.fn().mockResolvedValue({
        content: 'Agent response content'
      })
    };
    mockAgent.mockImplementation(() => mockAgentInstance as any);
  });

  describe('generateText', () => {
    it('should generate text with string prompt', async () => {
      const result = await generateText('Hello, AI!');
      
      expect(result).toBe('Generated response');
      expect(mockLoadModel).toHaveBeenCalledWith(undefined);
      expect(mockGenerateText).toHaveBeenCalledWith({
        model: 'mock-model',
        prompt: 'Hello, AI!',
      });
    });

    it('should generate text with messages array', async () => {
      const messages = [
        { role: 'user' as const, content: 'Hello!' },
        { role: 'assistant' as const, content: 'Hi there!' }
      ];
      
      const result = await generateText(messages);
      
      expect(result).toBe('Generated response');
      expect(mockGenerateText).toHaveBeenCalledWith({
        model: 'mock-model',
        messages,
      });
    });

    it('should pass through options to AI SDK', async () => {
      const options = {
        temperature: 0.7,
        maxTokens: 100,
        config: {
          provider: 'openai' as const,
          model: 'gpt-4',
          apiKey: 'test-key'
        }
      };
      
      await generateText('Test prompt', options);
      
      expect(mockLoadModel).toHaveBeenCalledWith(options.config);
      expect(mockGenerateText).toHaveBeenCalledWith({
        model: 'mock-model',
        prompt: 'Test prompt',
        temperature: 0.7,
        maxTokens: 100,
        topP: undefined,
        topK: undefined,
        frequencyPenalty: undefined,
        presencePenalty: undefined,
        seed: undefined,
        stop: undefined,
      });
    });

    it('should handle errors gracefully', async () => {
      mockGenerateText.mockRejectedValue(new Error('AI SDK error'));
      
      await expect(generateText('Test')).rejects.toThrow('generateText failed: AI SDK error');
    });
  });

  describe('streamText', () => {
    it('should stream text with messages', async () => {
      const messages = [
        { role: 'user' as const, content: 'Tell me a story' }
      ];
      
      const stream = await streamText(messages);
      const chunks: string[] = [];
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      expect(chunks).toEqual(['chunk1', 'chunk2', 'chunk3']);
      expect(mockLoadModel).toHaveBeenCalledWith(undefined);
      expect(mockStreamText).toHaveBeenCalledWith({
        model: 'mock-model',
        messages,
      });
    });

    it('should pass through streaming options', async () => {
      const messages = [{ role: 'user' as const, content: 'Test' }];
      const options = {
        temperature: 0.8,
        config: {
          provider: 'anthropic' as const,
          model: 'claude-3',
          apiKey: 'test-key'
        }
      };
      
      await streamText(messages, options);
      
      expect(mockLoadModel).toHaveBeenCalledWith(options.config);
      expect(mockStreamText).toHaveBeenCalledWith({
        model: 'mock-model',
        messages,
        temperature: 0.8,
        maxTokens: undefined,
        topP: undefined,
        topK: undefined,
        frequencyPenalty: undefined,
        presencePenalty: undefined,
        seed: undefined,
        stop: undefined,
      });
    });

    it('should handle streaming errors gracefully', async () => {
      mockStreamText.mockRejectedValue(new Error('Stream error'));
      
      const messages = [{ role: 'user' as const, content: 'Test' }];
      await expect(streamText(messages)).rejects.toThrow('streamText failed: Stream error');
    });
  });

  describe('runAgent', () => {
    it('should run agent with default options', async () => {
      const result = await runAgent();
      
      expect(result).toEqual({ outputText: 'Agent response content' });
      expect(mockLoadModel).toHaveBeenCalledWith(undefined);
      expect(mockAgent).toHaveBeenCalledWith({
        name: 'superdapp-agent',
        model: 'mock-model',
        instructions: 'You are a helpful assistant.',
        tools: [],
      });
    });

    it('should run agent with custom instructions and messages', async () => {
      const options = {
        instructions: 'You are a coding assistant.',
        messages: [
          { role: 'user' as const, content: 'Write a function' }
        ],
        tools: { codeGenerator: {} },
        config: {
          provider: 'openai' as const,
          model: 'gpt-4',
          apiKey: 'test-key'
        }
      };
      
      const result = await runAgent(options);
      
      expect(result).toEqual({ outputText: 'Agent response content' });
      expect(mockLoadModel).toHaveBeenCalledWith(options.config);
      expect(mockAgent).toHaveBeenCalledWith({
        name: 'superdapp-agent',
        model: 'mock-model',
        instructions: 'You are a coding assistant.',
        tools: { codeGenerator: {} },
      });
      
      const agentInstance = mockAgent.mock.results[0].value;
      expect(agentInstance.run).toHaveBeenCalledWith({
        messages: options.messages
      });
    });

    it('should handle missing content in agent response', async () => {
      const mockAgentInstance = {
        run: jest.fn().mockResolvedValue({})
      };
      mockAgent.mockImplementation(() => mockAgentInstance as any);
      
      const result = await runAgent();
      
      expect(result).toEqual({ outputText: 'No output generated' });
    });

    it('should handle agent errors gracefully', async () => {
      const mockAgentInstance = {
        run: jest.fn().mockRejectedValue(new Error('Agent error'))
      };
      mockAgent.mockImplementation(() => mockAgentInstance as any);
      
      await expect(runAgent()).rejects.toThrow('runAgent failed: Agent error');
    });
  });
});