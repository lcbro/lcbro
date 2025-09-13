import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ExtractionTools } from '../../src/tools/extraction.js';
import { BrowserManager } from '../../src/core/browser-manager.js';
import { mockPage } from '../mocks/llm-providers.js';

// Mock BrowserManager
jest.mock('../../src/core/browser-manager.js');

// Mock Readability
jest.mock('@mozilla/readability', () => ({
  Readability: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockReturnValue({
      title: 'Test Article',
      content: '<p>Test content</p>',
      textContent: 'Test content'
    })
  }))
}));

// Mock JSDOM
jest.mock('jsdom', () => ({
  JSDOM: jest.fn().mockImplementation(() => ({
    window: {
      document: {}
    }
  }))
}));

describe('ExtractionTools', () => {
  let extractionTools: ExtractionTools;
  let mockBrowserManager: jest.Mocked<BrowserManager>;

  beforeEach(() => {
    mockBrowserManager = {
      getPage: jest.fn(),
      createPage: jest.fn(),
      cleanup: jest.fn()
    } as any;

    extractionTools = new ExtractionTools(mockBrowserManager);
    jest.clearAllMocks();
  });

  describe('extractContent', () => {
    beforeEach(() => {
      mockBrowserManager.getPage.mockReturnValue(mockPage);
    });

    it('should extract HTML content successfully', async () => {
      const result = await extractionTools.extractContent({
        pageId: 'test-page-id',
        format: 'html'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('<html><body>Test content</body></html>');
        expect(result.data.format).toBe('html');
      }

      expect(mockPage.content).toHaveBeenCalled();
    });

    it('should extract text content successfully', async () => {
      mockPage.$eval.mockResolvedValue('Extracted text content');

      const result = await extractionTools.extractContent({
        pageId: 'test-page-id',
        format: 'text'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Extracted text content');
        expect(result.data.format).toBe('text');
      }
    });

    it('should extract markdown content using Readability', async () => {
      const result = await extractionTools.extractContent({
        pageId: 'test-page-id',
        format: 'markdown'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.format).toBe('markdown');
      }
    });

    it('should handle page not found', async () => {
      mockBrowserManager.getPage.mockReturnValue(undefined);

      const result = await extractionTools.extractContent({
        pageId: 'non-existent-page',
        format: 'html'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('page_not_found');
      }
    });

    it('should handle content size limits', async () => {
      const largeContent = 'x'.repeat(50000); // Larger than test limit
      mockPage.content.mockResolvedValue(largeContent);

      const result = await extractionTools.extractContent({
        pageId: 'test-page-id',
        format: 'html'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('dom_too_large');
      }
    });
  });

  describe('extractTable', () => {
    beforeEach(() => {
      mockBrowserManager.getPage.mockReturnValue(mockPage);
      mockPage.$$eval.mockResolvedValue([
        { col1: 'row1-col1', col2: 'row1-col2' },
        { col1: 'row2-col1', col2: 'row2-col2' }
      ]);
    });

    it('should extract table successfully', async () => {
      const result = await extractionTools.extractTable({
        pageId: 'test-page-id',
        tableCss: 'table.data'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tables).toHaveLength(1);
        expect(result.data.tables[0]).toHaveLength(2);
      }
    });

    it('should handle table not found', async () => {
      mockPage.$$eval.mockRejectedValue(new Error('Element not found'));

      const result = await extractionTools.extractTable({
        pageId: 'test-page-id',
        tableCss: 'table.non-existent'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('selector_not_found');
      }
    });
  });

  describe('extractAttributes', () => {
    beforeEach(() => {
      mockBrowserManager.getPage.mockReturnValue(mockPage);
    });

    it('should extract attributes successfully', async () => {
      mockPage.locator.mockReturnValue({
        getAttribute: jest.fn().mockResolvedValue('test-value')
      } as any);

      const result = await extractionTools.extractAttributes({
        pageId: 'test-page-id',
        selector: 'input[name="test"]',
        attributes: ['value']
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.attributes).toEqual({ value: 'test-value' });
      }
    });

    it('should handle multiple attributes', async () => {
      mockPage.locator.mockReturnValue({
        getAttribute: jest.fn()
          .mockResolvedValueOnce('test-id')
          .mockResolvedValueOnce('test-class')
      } as any);

      const result = await extractionTools.extractAttributes({
        pageId: 'test-page-id',
        selector: 'div',
        attributes: ['id', 'class']
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.attributes).toEqual({
          id: 'test-id',
          class: 'test-class'
        });
      }
    });
  });

  describe('extractScreenshot', () => {
    beforeEach(() => {
      mockBrowserManager.getPage.mockReturnValue(mockPage);
    });

    it('should take screenshot successfully', async () => {
      const result = await extractionTools.extractScreenshot({
        pageId: 'test-page-id'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.screenshot).toBeDefined();
        expect(result.data.format).toBe('png');
      }

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        type: 'png',
        fullPage: false
      });
    });

    it('should handle custom screenshot options', async () => {
      await extractionTools.extractScreenshot({
        pageId: 'test-page-id',
        fullPage: true,
        format: 'jpeg',
        quality: 80
      });

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        type: 'jpeg',
        fullPage: true,
        quality: 80
      });
    });
  });
});
