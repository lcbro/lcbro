import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NavigationTools } from '../../src/tools/navigation.js';
import { ExtractionTools } from '../../src/tools/extraction.js';
import { InteractionTools } from '../../src/tools/interaction.js';
import { BrowserManager } from '../../src/core/browser-manager.js';

// These are integration tests with real websites
// They may be slower and can fail due to network issues or site changes

describe('Real Website Integration', () => {
  let browserManager: BrowserManager;
  let navigationTools: NavigationTools;
  let extractionTools: ExtractionTools;
  let interactionTools: InteractionTools;

  beforeEach(async () => {
    browserManager = new BrowserManager();
    navigationTools = new NavigationTools(browserManager);
    extractionTools = new ExtractionTools(browserManager);
    interactionTools = new InteractionTools(browserManager);
  });

  afterEach(async () => {
    await browserManager.cleanup();
  });

  describe('HTTPBin.org Tests', () => {
    it('should extract JSON data from API endpoint', async () => {
      const openResult = await navigationTools.navigateOpen({
        url: 'https://httpbin.org/json',
        headless: true
      });

      expect(openResult.success).toBe(true);
      if (!openResult.success) return;

      const contentResult = await extractionTools.extractContent({
        pageId: openResult.data.pageId,
        format: 'text'
      });

      expect(contentResult.success).toBe(true);
      if (contentResult.success) {
        expect(contentResult.data.content).toContain('slideshow');
        expect(contentResult.data.content).toContain('title');
      }
    }, 15000);

    it('should handle form submission', async () => {
      const openResult = await navigationTools.navigateOpen({
        url: 'https://httpbin.org/forms/post',
        headless: true
      });

      expect(openResult.success).toBe(true);
      if (!openResult.success) return;

      const pageId = openResult.data.pageId;

      // Fill form fields
      await interactionTools.interactType({
        pageId,
        selector: 'input[name="custname"]',
        text: 'Test Customer'
      });

      await interactionTools.interactType({
        pageId,
        selector: 'input[name="custemail"]',
        text: 'test@example.com'
      });

      // Select pizza size
      await interactionTools.interactClick({
        pageId,
        method: 'css',
        target: 'input[value="medium"]'
      });

      // Submit form
      const submitResult = await interactionTools.interactClick({
        pageId,
        method: 'css',
        target: 'input[type="submit"]'
      });

      expect(submitResult.success).toBe(true);

      // Wait for form submission
      await interactionTools.interactWait({
        pageId,
        for: 'timeout',
        timeoutMs: 3000
      });

      // Extract response
      const responseResult = await extractionTools.extractContent({
        pageId,
        format: 'text'
      });

      expect(responseResult.success).toBe(true);
      if (responseResult.success) {
        expect(responseResult.data.content).toContain('Test Customer');
        expect(responseResult.data.content).toContain('test@example.com');
      }
    }, 20000);
  });

  describe('Example.com Tests', () => {
    it('should extract page title and content', async () => {
      const openResult = await navigationTools.navigateOpen({
        url: 'https://example.com',
        headless: true
      });

      expect(openResult.success).toBe(true);
      if (!openResult.success) return;

      const pageId = openResult.data.pageId;

      // Extract HTML content
      const htmlResult = await extractionTools.extractContent({
        pageId,
        format: 'html'
      });

      expect(htmlResult.success).toBe(true);
      if (htmlResult.success) {
        expect(htmlResult.data.content).toContain('<title>');
        expect(htmlResult.data.content).toContain('Example Domain');
      }

      // Extract text content
      const textResult = await extractionTools.extractContent({
        pageId,
        format: 'text'
      });

      expect(textResult.success).toBe(true);
      if (textResult.success) {
        expect(textResult.data.content).toContain('Example Domain');
        expect(textResult.data.content).toContain('illustrative examples');
      }

      // Take screenshot
      const screenshotResult = await extractionTools.extractScreenshot({
        pageId,
        fullPage: true
      });

      expect(screenshotResult.success).toBe(true);
      if (screenshotResult.success) {
        expect(screenshotResult.data.screenshot.length).toBeGreaterThan(1000);
      }
    }, 15000);

    it('should extract link attributes', async () => {
      const openResult = await navigationTools.navigateOpen({
        url: 'https://example.com',
        headless: true
      });

      expect(openResult.success).toBe(true);
      if (!openResult.success) return;

      const attributesResult = await extractionTools.extractAttributes({
        pageId: openResult.data.pageId,
        selector: 'a',
        attributes: ['href', 'text']
      });

      expect(attributesResult.success).toBe(true);
      if (attributesResult.success) {
        expect(attributesResult.data.attributes.href).toContain('iana.org');
      }
    }, 10000);
  });

  describe('Session Persistence', () => {
    it('should maintain cookies across requests', async () => {
      const sessionKey = 'integration-test-session';

      // Set a cookie
      const setCookieResult = await navigationTools.navigateOpen({
        url: 'https://httpbin.org/cookies/set/test_cookie/test_value',
        persistSessionKey: sessionKey,
        headless: true
      });

      expect(setCookieResult.success).toBe(true);
      if (!setCookieResult.success) return;

      // Check cookies in new request with same session
      const checkCookieResult = await navigationTools.navigateOpen({
        url: 'https://httpbin.org/cookies',
        persistSessionKey: sessionKey,
        headless: true
      });

      expect(checkCookieResult.success).toBe(true);
      if (!checkCookieResult.success) return;

      const contentResult = await extractionTools.extractContent({
        pageId: checkCookieResult.data.pageId,
        format: 'text'
      });

      expect(contentResult.success).toBe(true);
      if (contentResult.success) {
        expect(contentResult.data.content).toContain('test_cookie');
        expect(contentResult.data.content).toContain('test_value');
      }
    }, 20000);
  });

  describe('Error Handling', () => {
    it('should handle 404 pages gracefully', async () => {
      const result = await navigationTools.navigateOpen({
        url: 'https://httpbin.org/status/404',
        headless: true
      });

      // Should still open the page even if it returns 404
      expect(result.success).toBe(true);
      if (result.success) {
        const contentResult = await extractionTools.extractContent({
          pageId: result.data.pageId,
          format: 'text'
        });

        expect(contentResult.success).toBe(true);
      }
    }, 15000);

    it('should handle slow loading pages', async () => {
      const result = await navigationTools.navigateOpen({
        url: 'https://httpbin.org/delay/3',
        headless: true
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const contentResult = await extractionTools.extractContent({
          pageId: result.data.pageId,
          format: 'text'
        });

        expect(contentResult.success).toBe(true);
        if (contentResult.success) {
          expect(contentResult.data.content).toContain('origin');
        }
      }
    }, 25000);
  });
});
