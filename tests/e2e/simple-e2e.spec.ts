import { test, expect } from '@playwright/test';

test.describe('Simple E2E Tests', () => {
  test('should load example.com', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Check that the page loaded
    const title = await page.title();
    expect(title).toContain('Example Domain');
    
    // Check for expected content
    const content = await page.textContent('body');
    expect(content).toContain('Example Domain');
  });

  test('should handle basic navigation', async ({ page }) => {
    await page.goto('https://httpbin.org/html');
    
    // Check that we can get page content
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should take screenshot', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Take a screenshot
    const screenshot = await page.screenshot();
    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('should extract page title', async ({ page }) => {
    await page.goto('https://example.com');
    
    const title = await page.title();
    expect(title).toBe('Example Domain');
  });

  test('should handle form interaction', async ({ page }) => {
    // Use data URL to avoid external dependencies
    await page.goto('data:text/html,<html><body><form><input id="test-input" type="text"><button type="submit">Submit</button></form></body></html>');
    
    // Type in input field
    await page.fill('#test-input', 'Hello World');
    
    // Check value
    const value = await page.inputValue('#test-input');
    expect(value).toBe('Hello World');
  });

  test('should extract elements', async ({ page }) => {
    // Use data URL with structured content
    await page.goto('data:text/html,<html><body><h1 id="title">Test Title</h1><p class="content">Test content</p></body></html>');
    
    // Extract title
    const title = await page.textContent('#title');
    expect(title).toBe('Test Title');
    
    // Extract content
    const content = await page.textContent('.content');
    expect(content).toBe('Test content');
  });
});
