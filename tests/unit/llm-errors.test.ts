import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LLMTools } from '../../src/tools/llm.js';
import { LLMProviderManager } from '../../src/core/llm-provider.js';

// Mock LLMProviderManager
jest.mock('../../src/core/llm-provider.js');

describe('LLM Error Scenarios', () => {
  let llmTools: LLMTools;
  let mockLLMManager: jest.Mocked<LLMProviderManager>;

  beforeEach(() => {
    mockLLMManager = {
      generateText: jest.fn(),
      isProviderAvailable: jest.fn()
    } as any;

    llmTools = new LLMTools(mockLLMManager);
    jest.clearAllMocks();
  });

  describe('LLM Generation Failures', () => {
    it('should handle llm_failed when model is unavailable', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: false,
        error: {
          code: 'llm_failed',
          message: 'Model "unknown-model" not found'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'Test input'
        },
        instruction: 'Transform this',
        model: 'unknown-model'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
        expect(result.error.message).toContain('Model');
      }
    });

    it('should handle API rate limiting', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: false,
        error: {
          code: 'llm_failed',
          message: 'Rate limit exceeded. Please try again later.'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'Test input'
        },
        instruction: 'Transform this',
        model: 'gpt-4'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
        expect(result.error.message).toContain('Rate limit');
      }
    });

    it('should handle API authentication errors', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: false,
        error: {
          code: 'llm_failed',
          message: 'Invalid API key'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'Test input'
        },
        instruction: 'Transform this',
        model: 'gpt-4'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
        expect(result.error.message).toContain('API key');
      }
    });

    it('should handle network timeouts', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: false,
        error: {
          code: 'llm_failed',
          message: 'Request timeout after 30 seconds'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'Test input'
        },
        instruction: 'Transform this',
        model: 'claude-3-sonnet-20240229'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
        expect(result.error.message).toContain('timeout');
      }
    });
  });

  describe('JSON Processing Errors', () => {
    it('should handle invalid JSON output', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: true,
        data: {
          text: 'This is not valid JSON at all'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'Test input'
        },
        instruction: 'Transform to JSON',
        model: 'gpt-4'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
        expect(result.error.message).toContain('Invalid JSON');
      }
    });

    it('should handle JSON with syntax errors', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: true,
        data: {
          text: '{"name": "John", "age": 30, invalid}'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'Test input'
        },
        instruction: 'Transform to JSON',
        model: 'gpt-4'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
        expect(result.error.message).toContain('Invalid JSON');
      }
    });

    it('should handle empty response', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: true,
        data: {
          text: ''
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'Test input'
        },
        instruction: 'Transform this',
        model: 'gpt-4'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
        expect(result.error.message).toContain('empty');
      }
    });
  });

  describe('Schema Validation Errors', () => {
    it('should handle schema validation failures', async () => {
      // Mock Ajv to return validation error
      const mockAjv = {
        compile: jest.fn().mockReturnValue(() => false), // Validation fails
        errorsText: jest.fn().mockReturnValue('Required property "name" is missing')
      };

      jest.doMock('ajv', () => jest.fn().mockImplementation(() => mockAjv));

      mockLLMManager.generateText.mockResolvedValue({
        success: true,
        data: {
          text: '{"age": 30}'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'John is 30 years old'
        },
        instruction: 'Extract person info',
        model: 'gpt-4',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          required: ['name', 'age']
        }
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
        expect(result.error.message).toContain('validation');
      }
    });

    it('should handle malformed schema', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: true,
        data: {
          text: '{"name": "John"}'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'Test input'
        },
        instruction: 'Transform this',
        model: 'gpt-4',
        schema: {
          type: 'invalid-type' // Invalid schema
        } as any
      });

      // Should still attempt to process, but may fail validation
      expect(mockLLMManager.generateText).toHaveBeenCalled();
    });
  });

  describe('Preprocessing Errors', () => {
    it('should handle preprocessing failures', async () => {
      mockLLMManager.generateText
        .mockResolvedValueOnce({
          success: false,
          error: {
            code: 'llm_failed',
            message: 'Local model unavailable for preprocessing'
          }
        });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'html',
          data: '<html>Large content</html>'.repeat(100)
        },
        instruction: 'Extract content',
        model: 'gpt-4',
        preprocessRequest: 'Clean HTML content'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
        expect(result.error.message).toContain('preprocessing');
      }
    });

    it('should handle preprocessing with invalid output', async () => {
      mockLLMManager.generateText
        .mockResolvedValueOnce({
          success: true,
          data: { text: '' } // Empty preprocessing result
        })
        .mockResolvedValueOnce({
          success: true,
          data: { text: '{"result": "final"}' }
        });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'html',
          data: '<html>Content</html>'.repeat(100)
        },
        instruction: 'Extract content',
        model: 'gpt-4',
        preprocessRequest: 'Clean content'
      });

      // Should fallback to original content if preprocessing returns empty
      expect(result.success).toBe(true);
    });
  });

  describe('Input Validation Errors', () => {
    it('should handle extremely large input', async () => {
      const largeInput = 'x'.repeat(1000000); // 1MB of text

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: largeInput
        },
        instruction: 'Summarize this',
        model: 'gpt-4'
      });

      // Should either succeed or fail gracefully
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle invalid input format', async () => {
      const result = await llmTools.llmTransform({
        input: {
          kind: 'json',
          data: 'Invalid JSON content {'
        },
        instruction: 'Process JSON',
        model: 'gpt-4'
      });

      // Should still process as text if JSON is invalid
      expect(mockLLMManager.generateText).toHaveBeenCalled();
    });
  });

  describe('Model-Specific Errors', () => {
    it('should handle OpenAI quota exceeded', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: false,
        error: {
          code: 'llm_failed',
          message: 'You exceeded your current quota'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'Test input'
        },
        instruction: 'Transform this',
        model: 'gpt-4'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
        expect(result.error.message).toContain('quota');
      }
    });

    it('should handle Anthropic content filtering', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: false,
        error: {
          code: 'llm_failed',
          message: 'Content filtered due to safety policies'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'Potentially harmful content'
        },
        instruction: 'Process this',
        model: 'claude-3-sonnet-20240229'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
        expect(result.error.message).toContain('filtered');
      }
    });

    it('should handle Ollama connection errors', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: false,
        error: {
          code: 'llm_failed',
          message: 'Connection refused to Ollama server at localhost:11434'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'Test input'
        },
        instruction: 'Transform this',
        model: 'ollama:llama3.1'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
        expect(result.error.message).toContain('Connection refused');
      }
    });
  });
});
