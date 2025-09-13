import { Browser, BrowserContext, Page, chromium, LaunchOptions } from 'playwright';
import { Logger } from 'pino';
import { PageId, ProxyConfig, Viewport } from '../types/index.js';
import { createHash } from 'crypto';
import path from 'path';
import { CDPBrowserManager, CDPBrowserInfo, CDPContext } from './cdp-browser-manager.js';

export interface BrowserConfig {
  headless: boolean;
  maxContexts: number;
  storageDir: string;
  defaultTimeoutMs: number;
    cdp?: {
      enabled: boolean;
      host: string;
      port: number;
      autoDetect: boolean;
      maxRetries: number;
      retryDelay: number;
      remote: {
        enabled: boolean;
        url: string | null;
        sslMode: 'auto' | 'enabled' | 'disabled' | 'insecure';
        apiKey: string | null;
        headers: Record<string, string>;
      };
      detection: {
        enabled: boolean;
        ports: number[];
        timeout: number;
        useRemote: boolean;
      };
      launch: {
        autoLaunch: boolean;
        browserPath: string | null;
        userDataDir: string | null;
        additionalArgs: string[];
      };
      connection: {
        timeout: number;
        keepAlive: boolean;
        reconnect: boolean;
        maxReconnects: number;
      };
    };
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
  private cdpManager: CDPBrowserManager | null = null;
  private engine: 'playwright' | 'cdp' = 'playwright';
  
  constructor(
    private config: BrowserConfig,
    private logger: Logger
  ) {
    // Initialize CDP manager if enabled
    if (this.config.cdp?.enabled) {
      this.engine = 'cdp';
      this.cdpManager = new CDPBrowserManager(this.logger, this.config);
      this.logger.info('CDP browser manager initialized');
    }
  }

  async initialize(): Promise<void> {
    if (this.engine === 'cdp') {
      await this.initializeCDP();
    } else {
      await this.initializePlaywright();
    }
  }

  private async initializeCDP(): Promise<void> {
    if (!this.cdpManager) {
      throw new Error('CDP manager not initialized');
    }

    this.logger.info('Initializing CDP browser connection');

    // Auto-detect browsers if enabled
    if (this.config.cdp?.autoDetect) {
      const browsers = await this.cdpManager.detectBrowsers();
      if (browsers.length > 0) {
        this.logger.info({ count: browsers.length }, 'Found CDP browsers, connecting to first available');
        const browser = browsers[0];
        await this.cdpManager.connectToBrowser(browser);
        this.logger.info('CDP browser connection established');
        return;
      }
    }

    // Auto-launch browser if enabled
    if (this.config.cdp?.launch?.autoLaunch) {
      await this.launchCDPBrowser();
    } else {
      throw new Error('No CDP browsers found and auto-launch is disabled');
    }
  }

  private async initializePlaywright(): Promise<void> {
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
    this.logger.info('Playwright browser launched successfully');
  }

  private async launchCDPBrowser(): Promise<void> {
    // This would launch a browser with CDP enabled
    // For now, we'll throw an error as this requires external browser launch
    throw new Error('Auto-launching CDP browser is not implemented. Please start a browser manually with --remote-debugging-port=9222');
  }

  async createContext(options: ContextOptions = {}): Promise<BrowserContext | string> {
    if (this.engine === 'cdp') {
      return this.createCDPContext(options);
    } else {
      return this.createPlaywrightContext(options);
    }
  }

  private async createCDPContext(options: ContextOptions = {}): Promise<string> {
    if (!this.cdpManager) {
      throw new Error('CDP manager not initialized');
    }

    // For CDP, we return a context ID that can be used for operations
    // The actual context creation happens during connection
    const contextId = `cdp_context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.info({ contextId }, 'Created CDP context');
    return contextId;
  }

  private async createPlaywrightContext(options: ContextOptions = {}): Promise<BrowserContext> {
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
