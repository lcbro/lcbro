import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BrowserManager } from '../../src/core/browser-manager.js';
import { mockBrowser, mockContext, mockPage } from '../mocks/llm-providers.js';

// Mock Playwright
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn().mockResolvedValue(mockBrowser)
  }
}));

describe('BrowserManager', () => {
  let browserManager: BrowserManager;

  beforeEach(async () => {
    browserManager = new BrowserManager();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await browserManager.cleanup();
  });

  describe('createPage', () => {
    it('should create a new page successfully', async () => {
      const result = await browserManager.createPage({
        url: 'https://example.com',
        headless: true
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageId).toBeDefined();
        expect(result.data.url).toBe('https://example.com');
      }
    });

    it('should reuse context for session persistence', async () => {
      const sessionKey = 'test-session';
      
      // Create first page
      const result1 = await browserManager.createPage({
        url: 'https://example.com',
        persistSessionKey: sessionKey
      });

      // Create second page with same session
      const result2 = await browserManager.createPage({
        url: 'https://example.com/page2',
        persistSessionKey: sessionKey
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      // Should reuse the same context
      expect(mockBrowser.newContext).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid URLs', async () => {
      const result = await browserManager.createPage({
        url: 'invalid-url',
        headless: true
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('nav_timeout');
      }
    });
  });

  describe('getPage', () => {
    it('should return existing page', async () => {
      const createResult = await browserManager.createPage({
        url: 'https://example.com'
      });

      expect(createResult.success).toBe(true);
      if (createResult.success) {
        const page = browserManager.getPage(createResult.data.pageId);
        expect(page).toBeDefined();
      }
    });

    it('should return undefined for non-existent page', () => {
      const page = browserManager.getPage('non-existent');
      expect(page).toBeUndefined();
    });
  });

  describe('cleanup', () => {
    it('should close all browsers and clear pages', async () => {
      await browserManager.createPage({ url: 'https://example.com' });
      
      await browserManager.cleanup();
      
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe('resource limits', () => {
    it('should respect max contexts limit', async () => {
      // Create maximum number of contexts (2 in test config)
      for (let i = 0; i < 3; i++) {
        await browserManager.createPage({
          url: 'https://example.com',
          persistSessionKey: `session-${i}`
        });
      }

      // Should only create 2 contexts due to limit
      expect(mockBrowser.newContext).toHaveBeenCalledTimes(2);
    });
  });
});
