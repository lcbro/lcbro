import { Browser, BrowserContext, Page, chromium, LaunchOptions } from 'playwright';
import { Logger } from 'pino';
import { PageId, ProxyConfig, Viewport } from '../types/index.js';
import { createHash } from 'crypto';
import path from 'path';

export interface BrowserConfig {
  headless: boolean;
  maxContexts: number;
  storageDir: string;
  defaultTimeoutMs: number;
}

export interface ContextOptions {
  viewport?: Viewport;
  userAgent?: string;
  proxy?: ProxyConfig;
  extraHeaders?: Record<string, string>;
  persistSessionKey?: string;
}

export interface PageInfo {
  id: PageId;
  page: Page;
  context: BrowserContext;
  createdAt: Date;
  sessionKey?: string;
}

export class BrowserManager {
  private browser: Browser | null = null;
  private contexts = new Map<string, BrowserContext>();
  private pages = new Map<PageId, PageInfo>();
  private contextCounter = 0;
  
  constructor(
    private config: BrowserConfig,
    private logger: Logger
  ) {}

  async initialize(): Promise<void> {
    const launchOptions: LaunchOptions = {
      headless: this.config.headless,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    };

    if (process.env.NODE_ENV === 'production') {
      launchOptions.args?.push('--no-sandbox');
    }

    this.browser = await chromium.launch(launchOptions);
    this.logger.info('Browser launched successfully');
  }

  async createContext(options: ContextOptions = {}): Promise<BrowserContext> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    if (this.contextCounter >= this.config.maxContexts) {
      throw new Error(`Maximum number of contexts (${this.config.maxContexts}) reached`);
    }

    let context: BrowserContext;
    const contextKey = this.getContextKey(options);

    // Try to reuse existing context for session persistence
    if (options.persistSessionKey && this.contexts.has(contextKey)) {
      context = this.contexts.get(contextKey)!;
      this.logger.info({ sessionKey: options.persistSessionKey }, 'Reusing existing context');
    } else {
      // Create new context
      const contextOptions: any = {
        viewport: options.viewport || { width: 1280, height: 800 },
        userAgent: options.userAgent,
        extraHTTPHeaders: options.extraHeaders,
      };

      if (options.proxy) {
        contextOptions.proxy = {
          server: options.proxy.server,
          username: options.proxy.username,
          password: options.proxy.password
        };
      }

      if (options.persistSessionKey) {
        const storageDir = path.join(
          this.config.storageDir, 
          this.sanitizeSessionKey(options.persistSessionKey)
        );
        contextOptions.storageState = storageDir;
      }

      context = await this.browser.newContext(contextOptions);
      context.setDefaultTimeout(this.config.defaultTimeoutMs);
      
      if (options.persistSessionKey) {
        this.contexts.set(contextKey, context);
      }
      
      this.contextCounter++;
      this.logger.info({ 
        sessionKey: options.persistSessionKey,
        contextCount: this.contextCounter 
      }, 'New context created');
    }

    return context;
  }

  async createPage(context: BrowserContext, sessionKey?: string): Promise<PageInfo> {
    const page = await context.newPage();
    const pageId = this.generatePageId();
    
    const pageInfo: PageInfo = {
      id: pageId,
      page,
      context,
      createdAt: new Date(),
      sessionKey
    };

    this.pages.set(pageId, pageInfo);
    
    this.logger.info({ 
      pageId, 
      sessionKey,
      totalPages: this.pages.size 
    }, 'Page created');

    return pageInfo;
  }

  getPage(pageId: PageId): PageInfo | undefined {
    return this.pages.get(pageId);
  }

  async closePage(pageId: PageId): Promise<void> {
    const pageInfo = this.pages.get(pageId);
    if (!pageInfo) {
      return;
    }

    try {
      await pageInfo.page.close();
    } catch (error) {
      this.logger.warn({ pageId, error }, 'Error closing page');
    }

    this.pages.delete(pageId);
    
    // Close context if no session persistence and no other pages
    if (!pageInfo.sessionKey) {
      const contextPages = Array.from(this.pages.values())
        .filter(p => p.context === pageInfo.context);
      
      if (contextPages.length === 0) {
        try {
          await pageInfo.context.close();
          this.contextCounter = Math.max(0, this.contextCounter - 1);
        } catch (error) {
          this.logger.warn({ pageId, error }, 'Error closing context');
        }
      }
    }

    this.logger.info({ pageId }, 'Page closed');
  }

  async cleanup(): Promise<void> {
    this.logger.info('Starting browser cleanup');

    // Close all pages
    const closePromises = Array.from(this.pages.keys()).map(pageId => 
      this.closePage(pageId)
    );
    await Promise.allSettled(closePromises);

    // Close all non-persistent contexts
    const contextClosePromises = Array.from(this.contexts.values()).map(context =>
      context.close().catch(err => 
        this.logger.warn({ error: err }, 'Error closing context during cleanup')
      )
    );
    await Promise.allSettled(contextClosePromises);

    // Close browser
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
      } catch (error) {
        this.logger.warn({ error }, 'Error closing browser');
      }
    }

    this.pages.clear();
    this.contexts.clear();
    this.contextCounter = 0;

    this.logger.info('Browser cleanup completed');
  }

  getStats() {
    return {
      totalPages: this.pages.size,
      totalContexts: this.contextCounter,
      maxContexts: this.config.maxContexts,
      persistentContexts: this.contexts.size
    };
  }

  private generatePageId(): PageId {
    return crypto.randomUUID();
  }

  private getContextKey(options: ContextOptions): string {
    if (!options.persistSessionKey) {
      return '';
    }
    
    const contextData = {
      sessionKey: options.persistSessionKey,
      proxy: options.proxy?.server,
      userAgent: options.userAgent
    };
    
    return createHash('sha256')
      .update(JSON.stringify(contextData))
      .digest('hex');
  }

  private sanitizeSessionKey(sessionKey: string): string {
    return sessionKey.replace(/[^a-zA-Z0-9_-]/g, '_');
  }
}
