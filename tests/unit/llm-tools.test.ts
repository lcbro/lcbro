import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LLMTools } from '../../src/tools/llm.js';
import { LLMProviderManager } from '../../src/core/llm-provider.js';

// Mock LLMProviderManager
jest.mock('../../src/core/llm-provider.js');

// Mock Ajv
jest.mock('ajv', () => {
  return jest.fn().mockImplementation(() => ({
    compile: jest.fn().mockReturnValue((data: any) => {
      // Simple validation - just check if data is an object
      return typeof data === 'object' && data !== null;
    }),
    errorsText: jest.fn().mockReturnValue('Validation error')
  }));
});

describe('LLMTools', () => {
  let llmTools: LLMTools;
  let mockLLMManager: jest.Mocked<LLMProviderManager>;

  beforeEach(() => {
    mockLLMManager = {
      generateText: jest.fn(),
      isProviderAvailable: jest.fn()
    } as any;

    llmTools = new LLMTools(mockLLMManager, { autoPreprocess: false });
    jest.clearAllMocks();
  });

  describe('llmTransform', () => {
    it('should transform data successfully', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: true,
        data: {
          text: '{"result": "transformed data", "status": "success"}'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'Sample input text'
        },
        instruction: 'Transform this text to JSON',
        model: 'gpt-4'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toEqual({
          result: 'transformed data',
          status: 'success'
        });
      }

      expect(mockLLMManager.generateText).toHaveBeenCalledWith(
        expect.stringContaining('Transform this text to JSON'),
        'gpt-4',
        expect.any(Object)
      );
    });

    it('should handle LLM generation errors', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: false,
        error: {
          code: 'llm_failed',
          message: 'Model not available'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'Sample input'
        },
        instruction: 'Transform this',
        model: 'unavailable-model'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
      }
    });

    it('should validate JSON schema when provided', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: true,
        data: {
          text: '{"name": "John", "age": 30}'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'User data'
        },
        instruction: 'Extract user info',
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

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toEqual({
          name: 'John',
          age: 30
        });
      }
    });

    it('should handle invalid JSON output', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: true,
        data: {
          text: 'Invalid JSON response'
        }
      });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'Sample input'
        },
        instruction: 'Transform this',
        model: 'gpt-4'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('llm_failed');
        expect(result.error.message).toContain('Invalid JSON');
      }
    });

    it('should handle preprocessing when enabled', async () => {
      const llmToolsWithPreprocess = new LLMTools(mockLLMManager, { autoPreprocess: true });
      
      // Mock preprocessing call
      mockLLMManager.generateText
        .mockResolvedValueOnce({
          success: true,
          data: { text: 'Cleaned input data' }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { text: '{"result": "final output"}' }
        });

      const result = await llmToolsWithPreprocess.llmTransform({
        input: {
          kind: 'html',
          data: '<html><body>Large HTML content with ads and navigation</body></html>'.repeat(100)
        },
        instruction: 'Extract main content',
        model: 'gpt-4'
      });

      expect(result.success).toBe(true);
      // Should have called LLM twice - once for preprocessing, once for main processing
      expect(mockLLMManager.generateText).toHaveBeenCalledTimes(2);
    });

    it('should use explicit preprocessing request', async () => {
      mockLLMManager.generateText
        .mockResolvedValueOnce({
          success: true,
          data: { text: 'Preprocessed data' }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { text: '{"result": "processed output"}' }
        });

      const result = await llmTools.llmTransform({
        input: {
          kind: 'html',
          data: '<html>Raw HTML</html>'
        },
        instruction: 'Extract data',
        model: 'gpt-4',
        preprocessRequest: 'Remove HTML tags and keep only text content'
      });

      expect(result.success).toBe(true);
      expect(mockLLMManager.generateText).toHaveBeenCalledTimes(2);
      
      // First call should be preprocessing
      expect(mockLLMManager.generateText).toHaveBeenNthCalledWith(1, 
        expect.stringContaining('Remove HTML tags'),
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should handle different input formats', async () => {
      mockLLMManager.generateText.mockResolvedValue({
        success: true,
        data: { text: '{"processed": true}' }
      });

      // Test JSON input
      await llmTools.llmTransform({
        input: {
          kind: 'json',
          data: '{"key": "value"}'
        },
        instruction: 'Process JSON',
        model: 'gpt-4'
      });

      // Test HTML input
      await llmTools.llmTransform({
        input: {
          kind: 'html',
          data: '<p>HTML content</p>'
        },
        instruction: 'Process HTML',
        model: 'gpt-4'
      });

      expect(mockLLMManager.generateText).toHaveBeenCalledTimes(2);
    });
  });
});
