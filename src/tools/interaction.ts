import { Logger } from 'pino';
import { BrowserManager } from '../core/browser-manager.js';
import { 
  InteractClickInput, 
  InteractTypeInput, 
  InteractWaitInput,
  InteractSuccessResponse,
  Target
} from '../types/interaction.js';
import { ErrorResponse } from '../types/index.js';
import { Locator } from 'playwright';

export class InteractionTools {
  constructor(
    private browserManager: BrowserManager,
    private logger: Logger
  ) {}

  async click(params: InteractClickInput): Promise<InteractSuccessResponse | ErrorResponse> {
    const startTime = Date.now();
    this.logger.info({ pageId: params.pageId, target: params.target }, 'Clicking element');

    try {
      const pageInfo = this.browserManager.getPage(params.pageId);
      if (!pageInfo) {
        return {
          status: 'error',
          code: 'page_not_found',
          message: 'Page not found',
          details: { pageId: params.pageId }
        };
      }

      const locator = this.createLocator(pageInfo.page, params.target);
      
      // Wait for element to be visible and clickable
      await locator.nth(params.nth).waitFor({ 
        state: 'visible', 
        timeout: params.timeoutMs 
      });

      // Perform click
      await locator.nth(params.nth).click({ timeout: params.timeoutMs });

      const duration = Date.now() - startTime;
      this.logger.info({ 
        pageId: params.pageId, 
        target: params.target,
        nth: params.nth,
        duration 
      }, 'Click completed');

      return { status: 'ok' };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error({ 
        pageId: params.pageId,
        target: params.target,
        error: error instanceof Error ? error.message : String(error),
        duration 
      }, 'Click failed');

      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('not found')) {
          return {
            status: 'error',
            code: 'selector_not_found',
            message: 'Element not found or not clickable within timeout',
            details: { 
              pageId: params.pageId, 
              target: params.target,
              timeout: params.timeoutMs 
            }
          };
        }
      }

      return {
        status: 'error',
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error during click',
        details: { pageId: params.pageId, target: params.target }
      };
    }
  }

  async type(params: InteractTypeInput): Promise<InteractSuccessResponse | ErrorResponse> {
    const startTime = Date.now();
    this.logger.info({ pageId: params.pageId, css: params.css }, 'Typing text');

    try {
      const pageInfo = this.browserManager.getPage(params.pageId);
      if (!pageInfo) {
        return {
          status: 'error',
          code: 'page_not_found',
          message: 'Page not found',
          details: { pageId: params.pageId }
        };
      }

      const locator = pageInfo.page.locator(params.css);
      
      // Wait for input field to be visible
      await locator.waitFor({ 
        state: 'visible', 
        timeout: params.timeoutMs 
      });

      // Clear field if requested
      if (params.clear) {
        await locator.clear();
      }

      // Type text
      await locator.type(params.text, { timeout: params.timeoutMs });

      // Press Enter if requested
      if (params.pressEnter) {
        await locator.press('Enter');
      }

      const duration = Date.now() - startTime;
      this.logger.info({ 
        pageId: params.pageId, 
        css: params.css,
        textLength: params.text.length,
        pressEnter: params.pressEnter,
        duration 
      }, 'Type completed');

      return { status: 'ok' };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error({ 
        pageId: params.pageId,
        css: params.css,
        error: error instanceof Error ? error.message : String(error),
        duration 
      }, 'Type failed');

      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('not found')) {
          return {
            status: 'error',
            code: 'selector_not_found',
            message: 'Input field not found within timeout',
            details: { 
              pageId: params.pageId, 
              css: params.css,
              timeout: params.timeoutMs 
            }
          };
        }
      }

      return {
        status: 'error',
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error during type',
        details: { pageId: params.pageId, css: params.css }
      };
    }
  }

  async wait(params: InteractWaitInput): Promise<InteractSuccessResponse | ErrorResponse> {
    const startTime = Date.now();
    this.logger.info({ pageId: params.pageId, waitFor: params.for }, 'Waiting for condition');

    try {
      const pageInfo = this.browserManager.getPage(params.pageId);
      if (!pageInfo) {
        return {
          status: 'error',
          code: 'page_not_found',
          message: 'Page not found',
          details: { pageId: params.pageId }
        };
      }

      switch (params.for) {
        case 'selector':
          if (!params.selector) {
            return {
              status: 'error',
              code: 'invalid_params',
              message: 'Selector is required when waiting for selector',
              details: { pageId: params.pageId }
            };
          }
          await pageInfo.page.waitForSelector(params.selector, { 
            timeout: params.timeoutMs 
          });
          break;

        case 'idle':
          await pageInfo.page.waitForLoadState('networkidle', { 
            timeout: params.timeoutMs 
          });
          break;

        case 'url':
          if (!params.urlIncludes) {
            return {
              status: 'error',
              code: 'invalid_params',
              message: 'urlIncludes is required when waiting for URL',
              details: { pageId: params.pageId }
            };
          }
          await pageInfo.page.waitForURL(url => url.toString().includes(params.urlIncludes!), {
            timeout: params.timeoutMs
          });
          break;
      }

      const duration = Date.now() - startTime;
      this.logger.info({ 
        pageId: params.pageId, 
        waitFor: params.for,
        duration 
      }, 'Wait completed');

      return { status: 'ok' };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error({ 
        pageId: params.pageId,
        waitFor: params.for,
        error: error instanceof Error ? error.message : String(error),
        duration 
      }, 'Wait failed');

      if (error instanceof Error && error.message.includes('timeout')) {
        return {
          status: 'error',
          code: 'nav_timeout',
          message: `Wait condition not met within ${params.timeoutMs}ms`,
          details: { 
            pageId: params.pageId, 
            waitFor: params.for,
            timeout: params.timeoutMs 
          }
        };
      }

      return {
        status: 'error',
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error during wait',
        details: { pageId: params.pageId, waitFor: params.for }
      };
    }
  }

  private createLocator(page: any, target: Target): Locator {
    if (target.css) {
      return page.locator(target.css);
    }
    
    if (target.text) {
      return page.getByText(target.text);
    }
    
    if (target.role) {
      return page.getByRole(target.role);
    }
    
    throw new Error('Invalid target: at least one of css, text, or role must be provided');
  }
}
