import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NavigationTools } from '../../src/tools/navigation.js';
import { ExtractionTools } from '../../src/tools/extraction.js';
import { InteractionTools } from '../../src/tools/interaction.js';
import { BrowserManager } from '../../src/core/browser-manager.js';

// Mock BrowserManager for error scenarios
jest.mock('../../src/core/browser-manager.js');

describe('Error Scenarios', () => {
  let mockBrowserManager: jest.Mocked<BrowserManager>;
  let navigationTools: NavigationTools;
  let extractionTools: ExtractionTools;
  let interactionTools: InteractionTools;

  beforeEach(() => {
    mockBrowserManager = {
      createPage: jest.fn(),
      getPage: jest.fn(),
      cleanup: jest.fn()
    } as any;

    navigationTools = new NavigationTools(mockBrowserManager);
    extractionTools = new ExtractionTools(mockBrowserManager);
    interactionTools = new InteractionTools(mockBrowserManager);
    jest.clearAllMocks();
  });

  describe('Navigation Errors', () => {
    it('should handle nav_timeout error', async () => {
      mockBrowserManager.createPage.mockResolvedValue({
        success: false,
        error: {
          code: 'nav_timeout',
          message: 'Navigation timeout after 30000ms'
        }
      });

      const result = await navigationTools.navigateOpen({
        url: 'https://very-slow-site.com'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('nav_timeout');
        expect(result.error.message).toContain('timeout');
      }
    });

    it('should handle invalid URLs', async () => {
      const result = await navigationTools.navigateOpen({
        url: 'not-a-valid-url'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('nav_timeout');
      }
    });

    it('should handle page_not_found for navigation', async () => {
      mockBrowserManager.getPage.mockReturnValue(undefined);

      const result = await navigationTools.navigateGoto({
        pageId: 'non-existent-page',
        url: 'https://example.com'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('page_not_found');
      }
    });
  });

  describe('Extraction Errors', () => {
    it('should handle page_not_found for extraction', async () => {
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

    it('should handle dom_too_large error', async () => {
      const mockPage = {
        content: jest.fn().mockResolvedValue('x'.repeat(50000)), // Exceeds test limit
        close: jest.fn()
      };

      mockBrowserManager.getPage.mockReturnValue(mockPage as any);

      const result = await extractionTools.extractContent({
        pageId: 'test-page',
        format: 'html'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('dom_too_large');
      }
    });

    it('should handle selector_not_found for table extraction', async () => {
      const mockPage = {
        $$eval: jest.fn().mockRejectedValue(new Error('No element found')),
        close: jest.fn()
      };

      mockBrowserManager.getPage.mockReturnValue(mockPage as any);

      const result = await extractionTools.extractTable({
        pageId: 'test-page',
        tableCss: 'table.non-existent'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('selector_not_found');
      }
    });

    it('should handle selector_not_found for attributes', async () => {
      const mockPage = {
        locator: jest.fn().mockReturnValue({
          getAttribute: jest.fn().mockRejectedValue(new Error('Element not found'))
        }),
        close: jest.fn()
      };

      mockBrowserManager.getPage.mockReturnValue(mockPage as any);

      const result = await extractionTools.extractAttributes({
        pageId: 'test-page',
        selector: '.non-existent',
        attributes: ['class']
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('selector_not_found');
      }
    });

    it('should handle screenshot errors', async () => {
      const mockPage = {
        screenshot: jest.fn().mockRejectedValue(new Error('Screenshot failed')),
        close: jest.fn()
      };

      mockBrowserManager.getPage.mockReturnValue(mockPage as any);

      const result = await extractionTools.extractScreenshot({
        pageId: 'test-page'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('internal_error');
      }
    });
  });

  describe('Interaction Errors', () => {
    it('should handle selector_not_found for click', async () => {
      const mockPage = {
        click: jest.fn().mockRejectedValue(new Error('Element not found')),
        close: jest.fn()
      };

      mockBrowserManager.getPage.mockReturnValue(mockPage as any);

      const result = await interactionTools.interactClick({
        pageId: 'test-page',
        method: 'css',
        target: '.non-existent-button'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('selector_not_found');
      }
    });

    it('should handle selector_not_found for typing', async () => {
      const mockPage = {
        type: jest.fn().mockRejectedValue(new Error('Element not found')),
        close: jest.fn()
      };

      mockBrowserManager.getPage.mockReturnValue(mockPage as any);

      const result = await interactionTools.interactType({
        pageId: 'test-page',
        selector: 'input.non-existent',
        text: 'test'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('selector_not_found');
      }
    });

    it('should handle timeout in wait operations', async () => {
      const mockPage = {
        waitForSelector: jest.fn().mockRejectedValue(new Error('Timeout')),
        close: jest.fn()
      };

      mockBrowserManager.getPage.mockReturnValue(mockPage as any);

      const result = await interactionTools.interactWait({
        pageId: 'test-page',
        for: 'selector',
        selector: '.never-appears',
        timeoutMs: 1000
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('nav_timeout');
      }
    });
  });

  describe('CAPTCHA Detection', () => {
    it('should detect CAPTCHA in page content', async () => {
      const mockPage = {
        content: jest.fn().mockResolvedValue(`
          <html>
            <body>
              <div class="captcha">Please verify you are human</div>
              <div class="g-recaptcha">reCAPTCHA</div>
            </body>
          </html>
        `),
        close: jest.fn()
      };

      mockBrowserManager.getPage.mockReturnValue(mockPage as any);

      const result = await extractionTools.extractContent({
        pageId: 'test-page',
        format: 'html'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('captcha_required');
      }
    });

    it('should detect CAPTCHA by common selectors', async () => {
      const mockPage = {
        content: jest.fn().mockResolvedValue(`
          <html>
            <body>
              <iframe src="https://www.google.com/recaptcha/api2/anchor"></iframe>
            </body>
          </html>
        `),
        close: jest.fn()
      };

      mockBrowserManager.getPage.mockReturnValue(mockPage as any);

      const result = await extractionTools.extractContent({
        pageId: 'test-page',
        format: 'html'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('captcha_required');
      }
    });
  });

  describe('Browser Manager Errors', () => {
    it('should handle browser launch failures', async () => {
      mockBrowserManager.createPage.mockResolvedValue({
        success: false,
        error: {
          code: 'internal_error',
          message: 'Failed to launch browser'
        }
      });

      const result = await navigationTools.navigateOpen({
        url: 'https://example.com'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('internal_error');
      }
    });

    it('should handle context creation failures', async () => {
      mockBrowserManager.createPage.mockResolvedValue({
        success: false,
        error: {
          code: 'internal_error',
          message: 'Failed to create browser context'
        }
      });

      const result = await navigationTools.navigateOpen({
        url: 'https://example.com',
        persistSessionKey: 'test-session'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('internal_error');
      }
    });
  });

  describe('Resource Limits', () => {
    it('should handle max contexts limit', async () => {
      // Simulate reaching max contexts limit
      mockBrowserManager.createPage.mockResolvedValue({
        success: false,
        error: {
          code: 'internal_error',
          message: 'Maximum number of contexts reached'
        }
      });

      const result = await navigationTools.navigateOpen({
        url: 'https://example.com',
        persistSessionKey: 'new-session'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('internal_error');
      }
    });
  });
});
