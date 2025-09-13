import { test, expect } from '@playwright/test';

// Minimal E2E tests that can work in CI environment
test.describe('Minimal E2E Infrastructure Tests', () => {
  
  test('should validate Playwright infrastructure', async () => {
    // Simple validation that Playwright is working
    expect(test.info().title).toBeTruthy();
    expect(test.info().project.name).toBeTruthy();
  });

  test('should test data URLs without external dependencies', async ({ page }) => {
    // Test using data URL to avoid network dependencies
    const htmlContent = 'data:text/html,<html><head><title>Test Page</title></head><body><h1>Hello World</h1></body></html>';
    
    await page.goto(htmlContent);
    
    // Verify basic page functionality
    const title = await page.title();
    expect(title).toBe('Test Page');
    
    const h1Text = await page.textContent('h1');
    expect(h1Text).toBe('Hello World');
  });

  test('should handle JavaScript in data URLs', async ({ page }) => {
    const htmlWithJS = `data:text/html,
      <html>
        <head><title>JS Test</title></head>
        <body>
          <div id="result">initial</div>
          <script>
            setTimeout(() => {
              document.getElementById('result').textContent = 'updated';
            }, 100);
          </script>
        </body>
      </html>`;
    
    await page.goto(htmlWithJS);
    
    // Wait for JavaScript to execute
    await page.waitForFunction(() => 
      document.getElementById('result')?.textContent === 'updated'
    );
    
    const result = await page.textContent('#result');
    expect(result).toBe('updated');
  });

  test('should take screenshot with data URL', async ({ page }) => {
    const simpleHtml = 'data:text/html,<html><body style="background:red;width:100px;height:100px;"></body></html>';
    
    await page.goto(simpleHtml);
    
    const screenshot = await page.screenshot();
    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(100);
  });

  test('should handle form interactions with data URL', async ({ page }) => {
    const formHtml = `data:text/html,
      <html>
        <body>
          <form>
            <input id="name" type="text" placeholder="Enter name">
            <button type="button" onclick="document.getElementById('output').textContent = document.getElementById('name').value">
              Submit
            </button>
          </form>
          <div id="output"></div>
        </body>
      </html>`;
    
    await page.goto(formHtml);
    
    await page.fill('#name', 'Test User');
    await page.click('button');
    
    const output = await page.textContent('#output');
    expect(output).toBe('Test User');
  });
});
