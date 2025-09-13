import { Logger } from 'pino';
import { BrowserManager, ContextOptions } from '../core/browser-manager.js';
import { 
  NavigateOpenInput, 
  NavigateOpenOutput,
  NavigateGotoInput,
  NavigateGotoOutput 
} from '../types/navigation.js';
import { ErrorResponse } from '../types/index.js';

export class NavigationTools {
  constructor(
    private browserManager: BrowserManager,
    private logger: Logger
  ) {}

  async open(params: NavigateOpenInput): Promise<NavigateOpenOutput | ErrorResponse> {
    const startTime = Date.now();
    this.logger.info({ url: params.url, sessionKey: params.persistSessionKey }, 'Opening page');

    try {
      // Validate domain if security rules are configured
      // TODO: Implement domain validation in security module

      const contextOptions: ContextOptions = {
        viewport: params.viewport,
        userAgent: params.userAgent,
        extraHeaders: params.extraHeaders,
        persistSessionKey: params.persistSessionKey
      };

      if (params.proxy) {
        contextOptions.proxy = { server: params.proxy };
      }

      const context = await this.browserManager.createContext(contextOptions);
      const pageInfo = await this.browserManager.createPage(context, params.persistSessionKey);

      // Navigate to URL
      const response = await pageInfo.page.goto(params.url, {
        waitUntil: params.waitUntil,
        timeout: params.timeoutMs
      });

      if (!response) {
        return {
          status: 'error',
          code: 'nav_timeout',
          message: 'Navigation failed - no response received',
          details: { url: params.url }
        };
      }

      const finalUrl = pageInfo.page.url();
      const cookiesStored = !!params.persistSessionKey;

      const duration = Date.now() - startTime;
      this.logger.info({ 
        pageId: pageInfo.id, 
        finalUrl, 
        duration,
        status: response.status() 
      }, 'Page opened successfully');

      return {
        status: 'ok',
        pageId: pageInfo.id,
        finalUrl,
        cookiesStored
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error({ 
        url: params.url, 
        error: error instanceof Error ? error.message : String(error),
        duration 
      }, 'Failed to open page');

      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          return {
            status: 'error',
            code: 'nav_timeout',
            message: `Navigation timeout after ${params.timeoutMs}ms`,
            details: { url: params.url, timeout: params.timeoutMs }
          };
        }
      }

      return {
        status: 'error',
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error during navigation',
        details: { url: params.url }
      };
    }
  }

  async goto(params: NavigateGotoInput): Promise<NavigateGotoOutput | ErrorResponse> {
    const startTime = Date.now();
    this.logger.info({ pageId: params.pageId, url: params.url }, 'Navigating to URL');

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

      const response = await pageInfo.page.goto(params.url, {
        waitUntil: params.waitUntil,
        timeout: params.timeoutMs
      });

      if (!response) {
        return {
          status: 'error',
          code: 'nav_timeout',
          message: 'Navigation failed - no response received',
          details: { url: params.url, pageId: params.pageId }
        };
      }

      const finalUrl = pageInfo.page.url();
      const cookiesStored = !!pageInfo.sessionKey;

      const duration = Date.now() - startTime;
      this.logger.info({ 
        pageId: params.pageId, 
        finalUrl, 
        duration,
        status: response.status() 
      }, 'Navigation completed');

      return {
        status: 'ok',
        finalUrl,
        cookiesStored
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error({ 
        pageId: params.pageId,
        url: params.url,
        error: error instanceof Error ? error.message : String(error),
        duration 
      }, 'Navigation failed');

      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          return {
            status: 'error',
            code: 'nav_timeout',
            message: `Navigation timeout after ${params.timeoutMs}ms`,
            details: { url: params.url, pageId: params.pageId, timeout: params.timeoutMs }
          };
        }
      }

      return {
        status: 'error',
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error during navigation',
        details: { url: params.url, pageId: params.pageId }
      };
    }
  }
}
