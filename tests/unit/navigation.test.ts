import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NavigationTools } from '../../src/tools/navigation.js';
import { BrowserManager } from '../../src/core/browser-manager.js';
import { mockBrowser, mockContext, mockPage } from '../mocks/llm-providers.js';

// Mock BrowserManager
jest.mock('../../src/core/browser-manager.js');

describe('NavigationTools', () => {
  let navigationTools: NavigationTools;
  let mockBrowserManager: jest.Mocked<BrowserManager>;

  beforeEach(() => {
    mockBrowserManager = {
      createPage: jest.fn(),
      getPage: jest.fn(),
      cleanup: jest.fn()
    } as any;

    navigationTools = new NavigationTools(mockBrowserManager);
    jest.clearAllMocks();
  });

  describe('navigateOpen', () => {
    it('should open URL successfully', async () => {
      mockBrowserManager.createPage.mockResolvedValue({
        success: true,
        data: {
          pageId: 'test-page-id',
          url: 'https://example.com'
        }
      });

      const result = await navigationTools.navigateOpen({
        url: 'https://example.com',
        headless: true
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageId).toBe('test-page-id');
        expect(result.data.url).toBe('https://example.com');
      }

      expect(mockBrowserManager.createPage).toHaveBeenCalledWith({
        url: 'https://example.com',
        headless: true,
        persistSessionKey: undefined,
        proxy: undefined
      });
    });

    it('should handle browser creation errors', async () => {
      mockBrowserManager.createPage.mockResolvedValue({
        success: false,
        error: {
          code: 'nav_timeout',
          message: 'Navigation timeout'
        }
      });

      const result = await navigationTools.navigateOpen({
        url: 'https://invalid-url.com'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('nav_timeout');
      }
    });

    it('should pass session persistence parameters', async () => {
      mockBrowserManager.createPage.mockResolvedValue({
        success: true,
        data: {
          pageId: 'test-page-id',
          url: 'https://example.com'
        }
      });

      await navigationTools.navigateOpen({
        url: 'https://example.com',
        persistSessionKey: 'test-session',
        proxy: 'http://proxy:8080'
      });

      expect(mockBrowserManager.createPage).toHaveBeenCalledWith({
        url: 'https://example.com',
        headless: undefined,
        persistSessionKey: 'test-session',
        proxy: 'http://proxy:8080'
      });
    });
  });

  describe('navigateGoto', () => {
    beforeEach(() => {
      mockBrowserManager.getPage.mockReturnValue(mockPage);
    });

    it('should navigate to URL successfully', async () => {
      const result = await navigationTools.navigateGoto({
        pageId: 'test-page-id',
        url: 'https://example.com/page2'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe('https://example.com/page2');
      }

      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com/page2', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    });

    it('should handle page not found', async () => {
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

    it('should handle navigation timeout', async () => {
      mockPage.goto.mockRejectedValue(new Error('Navigation timeout'));

      const result = await navigationTools.navigateGoto({
        pageId: 'test-page-id',
        url: 'https://slow-site.com'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('nav_timeout');
      }
    });

    it('should use custom timeout and wait strategy', async () => {
      await navigationTools.navigateGoto({
        pageId: 'test-page-id',
        url: 'https://example.com',
        timeoutMs: 5000,
        waitUntil: 'networkidle'
      });

      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
        waitUntil: 'networkidle',
        timeout: 5000
      });
    });
  });
});
