import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LLMProviderManager, OpenAIProvider, AnthropicProvider, OllamaProvider } from '../../src/core/llm-provider.js';
import { mockOpenAI, mockAnthropic, mockAxios } from '../mocks/llm-providers.js';

// Mock external modules
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => mockOpenAI)
  };
});

jest.mock('@anthropic-ai/sdk', () => {
  return {
    default: jest.fn().mockImplementation(() => mockAnthropic)
  };
});

jest.mock('axios', () => ({
  default: mockAxios
}));

describe('LLM Providers', () => {
  describe('OpenAIProvider', () => {
    let provider: OpenAIProvider;

    beforeEach(() => {
      provider = new OpenAIProvider('test-key');
      jest.clearAllMocks();
    });

    it('should generate text successfully', async () => {
      const result = await provider.generateText(
        'Test prompt',
        'gpt-4',
        { maxTokens: 100, temperature: 0 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe('{"result": "mocked response"}');
      }
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test prompt' }],
        max_tokens: 100,
        temperature: 0
      });
    });

    it('should handle API errors', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('API Error'));

      const result = await provider.generateText('Test prompt', 'gpt-4');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
      }
    });
  });

  describe('AnthropicProvider', () => {
    let provider: AnthropicProvider;

    beforeEach(() => {
      provider = new AnthropicProvider('test-key');
      jest.clearAllMocks();
    });

    it('should generate text successfully', async () => {
      const result = await provider.generateText(
        'Test prompt',
        'claude-3-sonnet-20240229',
        { maxTokens: 100, temperature: 0 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe('{"result": "mocked response"}');
      }
    });
  });

  describe('OllamaProvider', () => {
    let provider: OllamaProvider;

    beforeEach(() => {
      provider = new OllamaProvider('localhost', 11434);
      jest.clearAllMocks();
    });

    it('should generate text successfully', async () => {
      const result = await provider.generateText(
        'Test prompt',
        'llama3.1',
        { maxTokens: 100, temperature: 0 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe('{"result": "mocked response"}');
      }
      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        {
          model: 'llama3.1',
          prompt: 'Test prompt',
          stream: false,
          options: {
            num_predict: 100,
            temperature: 0
          }
        }
      );
    });
  });

  describe('LLMProviderManager', () => {
    let manager: LLMProviderManager;

    beforeEach(() => {
      // Mock environment variables
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      
      manager = new LLMProviderManager('localhost', 11434, 1337);
      jest.clearAllMocks();
    });

    afterEach(() => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
    });

    it('should route OpenAI models correctly', async () => {
      const result = await manager.generateText(
        'Test prompt',
        'gpt-4',
        { maxTokens: 100 }
      );

      expect(result.success).toBe(true);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should route Anthropic models correctly', async () => {
      const result = await manager.generateText(
        'Test prompt',
        'claude-3-sonnet-20240229',
        { maxTokens: 100 }
      );

      expect(result.success).toBe(true);
      expect(mockAnthropic.messages.create).toHaveBeenCalled();
    });

    it('should route Ollama models correctly', async () => {
      const result = await manager.generateText(
        'Test prompt',
        'ollama:llama3.1',
        { maxTokens: 100 }
      );

      expect(result.success).toBe(true);
      expect(mockAxios.post).toHaveBeenCalled();
    });

    it('should handle unknown models', async () => {
      const result = await manager.generateText(
        'Test prompt',
        'unknown-model',
        { maxTokens: 100 }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
      }
    });
  });
});
