import { Logger } from 'pino';
import { BrowserManager } from './browser-manager.js';
import { Config } from '../utils/config.js';
import { RemoteCDPClient } from '../utils/remote-cdp-client.js';

export interface CDPBrowserInfo {
  id: string;
  title: string;
  type: string;
  url: string;
  webSocketDebuggerUrl: string;
  version: string;
  description?: string;
}

export interface CDPConnectionOptions {
  host: string;
  port: number;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface CDPContext {
  id: string;
  url: string;
  title: string;
  type: string;
  isActive: boolean;
  createdAt: number;
  lastUsed: number;
}

export class CDPBrowserManager {
  private contexts: Map<string, CDPContext> = new Map();
  private activeConnections: Map<string, WebSocket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private logger: Logger;
  private config: Config;

  constructor(logger: Logger, config: Config) {
    this.logger = logger;
    this.config = config;
  }

  /**
   * Detects running browsers with CDP enabled
   */
  async detectBrowsers(): Promise<CDPBrowserInfo[]> {
    if (!this.config.browser.cdp.detection.enabled) {
      return [];
    }

    // Use remote detection if configured
    if (this.config.browser.cdp.detection.useRemote && this.config.browser.cdp.remote?.enabled) {
      return this.detectRemoteBrowsers();
    }

    // Local detection
    return this.detectLocalBrowsers();
  }

  /**
   * Detects browsers from remote CDP server
   */
  private async detectRemoteBrowsers(): Promise<CDPBrowserInfo[]> {
    const remoteConfig = this.config.browser.cdp.remote;
    if (!remoteConfig?.url) {
      this.logger.warn('Remote CDP URL not configured');
      return [];
    }

    try {
      this.logger.info({ url: remoteConfig.url }, 'Detecting browsers from remote CDP server');

      const remoteClient = RemoteCDPClient.createFromConfig(this.logger, {
        url: remoteConfig.url,
        sslMode: remoteConfig.sslMode,
        apiKey: remoteConfig.apiKey,
        headers: remoteConfig.headers
      });

      const response = await remoteClient.getAvailableBrowsers();

      if (response.success) {
        this.logger.info({ 
          count: response.browsers.length, 
          browsers: response.browsers.map(b => ({ id: b.id, title: b.title }))
        }, 'Remote CDP browser detection completed');

        return response.browsers;
      } else {
        this.logger.error({ error: response.error }, 'Remote CDP browser detection failed');
        return [];
      }

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Remote CDP browser detection failed');
      return [];
    }
  }

  /**
   * Detects browsers locally by scanning ports
   */
  private async detectLocalBrowsers(): Promise<CDPBrowserInfo[]> {
    const browsers: CDPBrowserInfo[] = [];
    const ports = this.config.browser.cdp.detection.ports;
    const timeout = this.config.browser.cdp.detection.timeout;

    this.logger.info({ ports, timeout }, 'Scanning for local CDP-enabled browsers');

    for (const port of ports) {
      try {
        const browserInfo = await this.checkBrowserPort(port, timeout);
        if (browserInfo) {
          browsers.push(browserInfo);
          this.logger.debug({ port, browserInfo }, 'Found CDP browser');
        }
      } catch (error) {
        this.logger.debug({ port, error: error instanceof Error ? error.message : String(error) }, 
          'No CDP browser found on port');
      }
    }

    this.logger.info({ count: browsers.length, browsers: browsers.map(b => ({ id: b.id, title: b.title, port: b.webSocketDebuggerUrl.split(':')[2] })) }, 
      'Local CDP browser detection completed');

    return browsers;
  }

  /**
   * Checks if a browser is running on a specific port
   */
  private async checkBrowserPort(port: number, timeout: number): Promise<CDPBrowserInfo | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`http://localhost:${port}/json/version`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Get list of tabs/pages
      const tabsResponse = await fetch(`http://localhost:${port}/json`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!tabsResponse.ok) {
        return null;
      }

      const tabs = await tabsResponse.json();
      
      return {
        id: data.id || `browser_${port}`,
        title: data.Browser || 'Chrome Browser',
        type: data.Browser || 'chrome',
        url: tabs[0]?.url || 'about:blank',
        webSocketDebuggerUrl: data.webSocketDebuggerUrl,
        version: data.Browser || 'Unknown',
        description: `Browser on port ${port}`
      };

    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Timeout checking port ${port}`);
      }
      throw error;
    }
  }

  /**
   * Connects to a CDP browser
   */
  async connectToBrowser(browserInfo: CDPBrowserInfo, options?: CDPConnectionOptions): Promise<string> {
    const host = options?.host || this.config.browser.cdp.host;
    const port = options?.port || this.config.browser.cdp.port;
    const timeout = options?.timeout || this.config.browser.cdp.connection.timeout;
    const maxRetries = options?.maxRetries || this.config.browser.cdp.maxRetries;
    const retryDelay = options?.retryDelay || this.config.browser.cdp.retryDelay;

    this.logger.info({ 
      browserId: browserInfo.id, 
      webSocketUrl: browserInfo.webSocketDebuggerUrl,
      host,
      port 
    }, 'Connecting to CDP browser');

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const contextId = await this.establishConnection(browserInfo, timeout);
        
        this.logger.info({ 
          browserId: browserInfo.id, 
          contextId, 
          attempt 
        }, 'Successfully connected to CDP browser');

        return contextId;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        this.logger.warn({ 
          browserId: browserInfo.id, 
          attempt, 
          maxRetries, 
          error: lastError.message 
        }, 'CDP connection attempt failed');

        if (attempt < maxRetries) {
          await this.sleep(retryDelay);
        }
      }
    }

    throw new Error(`Failed to connect to CDP browser after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Establishes WebSocket connection to CDP browser
   */
  private async establishConnection(browserInfo: CDPBrowserInfo, timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const wsUrl = browserInfo.webSocketDebuggerUrl;
      
      if (!wsUrl) {
        reject(new Error('No WebSocket URL provided'));
        return;
      }

      const ws = new WebSocket(wsUrl);
      const contextId = `cdp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        ws.close();
        reject(new Error(`Connection timeout after ${timeout}ms`));
      }, timeout);

      ws.onopen = () => {
        clearTimeout(timeoutId);
        
        // Store connection
        this.activeConnections.set(contextId, ws);
        this.reconnectAttempts.set(contextId, 0);

        // Create context record
        const context: CDPContext = {
          id: contextId,
          url: browserInfo.url,
          title: browserInfo.title,
          type: 'cdp',
          isActive: true,
          createdAt: Date.now(),
          lastUsed: Date.now()
        };

        this.contexts.set(contextId, context);

        // Set up message handling
        ws.onmessage = (event) => {
          this.handleCDPMessage(contextId, event.data);
        };

        ws.onclose = () => {
          this.handleConnectionClose(contextId);
        };

        ws.onerror = (error) => {
          this.logger.error({ contextId, error }, 'CDP WebSocket error');
        };

        // Send initial CDP commands
        this.initializeCDPSession(ws, contextId)
          .then(() => resolve(contextId))
          .catch(reject);

        this.logger.debug({ contextId, wsUrl }, 'CDP WebSocket connection established');
      };

      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`WebSocket connection failed: ${error}`));
      };

      ws.onclose = (event) => {
        clearTimeout(timeoutId);
        if (!event.wasClean) {
          reject(new Error(`WebSocket connection closed unexpectedly: ${event.code} ${event.reason}`));
        }
      };
    });
  }

  /**
   * Initializes CDP session with basic commands
   */
  private async initializeCDPSession(ws: WebSocket, contextId: string): Promise<void> {
    const commands = [
      { id: 1, method: 'Runtime.enable' },
      { id: 2, method: 'Page.enable' },
      { id: 3, method: 'Network.enable' },
      { id: 4, method: 'DOM.enable' }
    ];

    for (const command of commands) {
      await this.sendCDPCommand(ws, command);
    }

    this.logger.debug({ contextId, commandsCount: commands.length }, 'CDP session initialized');
  }

  /**
   * Sends a CDP command via WebSocket
   */
  async sendCDPCommand(ws: WebSocket, command: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket connection is not open'));
        return;
      }

      const commandId = command.id || Date.now();
      const commandWithId = { ...command, id: commandId };

      // Set up response handler
      const responseHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.id === commandId) {
            ws.removeEventListener('message', responseHandler);
            if (data.error) {
              reject(new Error(`CDP command failed: ${data.error.message}`));
            } else {
              resolve(data.result);
            }
          }
        } catch (error) {
          ws.removeEventListener('message', responseHandler);
          reject(error);
        }
      };

      ws.addEventListener('message', responseHandler);

      // Send command
      ws.send(JSON.stringify(commandWithId));

      // Set timeout for response
      setTimeout(() => {
        ws.removeEventListener('message', responseHandler);
        reject(new Error(`CDP command timeout: ${command.method}`));
      }, 30000);
    });
  }

  /**
   * Handles incoming CDP messages
   */
  private handleCDPMessage(contextId: string, data: string): void {
    try {
      const message = JSON.parse(data);
      
      // Update context last used time
      const context = this.contexts.get(contextId);
      if (context) {
        context.lastUsed = Date.now();
      }

      // Handle different message types
      if (message.method) {
        this.logger.debug({ contextId, method: message.method }, 'CDP event received');
        
        // Handle specific events
        switch (message.method) {
          case 'Page.loadEventFired':
            this.logger.debug({ contextId }, 'Page load event fired');
            break;
          case 'Runtime.consoleAPICalled':
            this.handleConsoleMessage(contextId, message.params);
            break;
          case 'Network.responseReceived':
            this.logger.debug({ contextId, url: message.params.response.url }, 'Network response received');
            break;
        }
      }

    } catch (error) {
      this.logger.error({ contextId, error: error instanceof Error ? error.message : String(error) }, 
        'Failed to parse CDP message');
    }
  }

  /**
   * Handles console messages from CDP
   */
  private handleConsoleMessage(contextId: string, params: any): void {
    const level = params.type || 'log';
    const message = params.args?.map((arg: any) => arg.value || arg.description || 'undefined').join(' ') || '';
    
    if (level === 'error') {
      this.logger.error({ contextId, consoleMessage: message }, 'Browser console error');
    } else if (level === 'warning') {
      this.logger.warn({ contextId, consoleMessage: message }, 'Browser console warning');
    } else {
      this.logger.debug({ contextId, consoleMessage: message }, 'Browser console message');
    }
  }

  /**
   * Handles connection close
   */
  private handleConnectionClose(contextId: string): void {
    const context = this.contexts.get(contextId);
    if (context) {
      context.isActive = false;
    }

    this.activeConnections.delete(contextId);
    this.reconnectAttempts.delete(contextId);

    this.logger.warn({ contextId }, 'CDP connection closed');

    // Attempt reconnection if enabled
    if (this.config.browser.cdp.connection.reconnect && context) {
      const attempts = this.reconnectAttempts.get(contextId) || 0;
      if (attempts < this.config.browser.cdp.connection.maxReconnects) {
        this.reconnectAttempts.set(contextId, attempts + 1);
        this.attemptReconnection(contextId);
      }
    }
  }

  /**
   * Attempts to reconnect to a CDP browser
   */
  private async attemptReconnection(contextId: string): Promise<void> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return;
    }

    const attempts = this.reconnectAttempts.get(contextId) || 0;
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Exponential backoff, max 30s

    this.logger.info({ contextId, attempts, delay }, 'Attempting CDP reconnection');

    await this.sleep(delay);

    try {
      // Try to detect browsers again and reconnect
      const browsers = await this.detectBrowsers();
      if (browsers.length > 0) {
        const browser = browsers[0]; // Use first available browser
        await this.connectToBrowser(browser);
        this.logger.info({ contextId, attempts }, 'CDP reconnection successful');
      } else {
        throw new Error('No browsers available for reconnection');
      }
    } catch (error) {
      this.logger.error({ 
        contextId, 
        attempts, 
        error: error instanceof Error ? error.message : String(error) 
      }, 'CDP reconnection failed');
    }
  }

  /**
   * Navigates to a URL using CDP
   */
  async navigateToUrl(contextId: string, url: string): Promise<void> {
    const ws = this.activeConnections.get(contextId);
    if (!ws) {
      throw new Error(`No active CDP connection for context ${contextId}`);
    }

    this.logger.info({ contextId, url }, 'Navigating to URL via CDP');

    try {
      await this.sendCDPCommand(ws, {
        method: 'Page.navigate',
        params: { url }
      });

      // Wait for navigation to complete
      await this.waitForNavigation(ws);

      // Update context
      const context = this.contexts.get(contextId);
      if (context) {
        context.url = url;
        context.lastUsed = Date.now();
      }

      this.logger.info({ contextId, url }, 'Navigation completed via CDP');

    } catch (error) {
      this.logger.error({ 
        contextId, 
        url, 
        error: error instanceof Error ? error.message : String(error) 
      }, 'CDP navigation failed');
      throw error;
    }
  }

  /**
   * Waits for navigation to complete
   */
  private async waitForNavigation(ws: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Navigation timeout'));
      }, 30000);

      const messageHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.method === 'Page.loadEventFired') {
            clearTimeout(timeoutId);
            ws.removeEventListener('message', messageHandler);
            resolve();
          }
        } catch (error) {
          // Ignore parsing errors
        }
      };

      ws.addEventListener('message', messageHandler);
    });
  }

  /**
   * Executes JavaScript in the browser context
   */
  async executeScript(contextId: string, script: string): Promise<any> {
    const ws = this.activeConnections.get(contextId);
    if (!ws) {
      throw new Error(`No active CDP connection for context ${contextId}`);
    }

    this.logger.debug({ contextId, scriptLength: script.length }, 'Executing script via CDP');

    try {
      const result = await this.sendCDPCommand(ws, {
        method: 'Runtime.evaluate',
        params: {
          expression: script,
          returnByValue: true
        }
      });

      return result.result?.value;

    } catch (error) {
      this.logger.error({ 
        contextId, 
        error: error instanceof Error ? error.message : String(error) 
      }, 'CDP script execution failed');
      throw error;
    }
  }

  /**
   * Takes a screenshot using CDP
   */
  async takeScreenshot(contextId: string, options?: { fullPage?: boolean; format?: string }): Promise<string> {
    const ws = this.activeConnections.get(contextId);
    if (!ws) {
      throw new Error(`No active CDP connection for context ${contextId}`);
    }

    this.logger.debug({ contextId, options }, 'Taking screenshot via CDP');

    try {
      const result = await this.sendCDPCommand(ws, {
        method: 'Page.captureScreenshot',
        params: {
          format: options?.format || 'png',
          fullPage: options?.fullPage || false
        }
      });

      return result.data; // Base64 encoded image

    } catch (error) {
      this.logger.error({ 
        contextId, 
        error: error instanceof Error ? error.message : String(error) 
      }, 'CDP screenshot failed');
      throw error;
    }
  }

  /**
   * Gets page content using CDP
   */
  async getPageContent(contextId: string): Promise<string> {
    const ws = this.activeConnections.get(contextId);
    if (!ws) {
      throw new Error(`No active CDP connection for context ${contextId}`);
    }

    this.logger.debug({ contextId }, 'Getting page content via CDP');

    try {
      const result = await this.sendCDPCommand(ws, {
        method: 'Runtime.evaluate',
        params: {
          expression: 'document.documentElement.outerHTML',
          returnByValue: true
        }
      });

      return result.result?.value || '';

    } catch (error) {
      this.logger.error({ 
        contextId, 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Failed to get page content via CDP');
      throw error;
    }
  }

  /**
   * Closes a CDP context
   */
  async closeContext(contextId: string): Promise<void> {
    const ws = this.activeConnections.get(contextId);
    if (ws) {
      ws.close();
      this.activeConnections.delete(contextId);
    }

    this.contexts.delete(contextId);
    this.reconnectAttempts.delete(contextId);

    this.logger.info({ contextId }, 'CDP context closed');
  }

  /**
   * Gets all active contexts
   */
  getActiveContexts(): CDPContext[] {
    return Array.from(this.contexts.values()).filter(context => context.isActive);
  }

  /**
   * Gets context information
   */
  getContext(contextId: string): CDPContext | undefined {
    return this.contexts.get(contextId);
  }

  /**
   * Cleanup method
   */
  async cleanup(): Promise<void> {
    this.logger.info({ activeConnections: this.activeConnections.size }, 'Cleaning up CDP connections');

    for (const [contextId, ws] of this.activeConnections) {
      try {
        ws.close();
      } catch (error) {
        this.logger.warn({ contextId, error }, 'Error closing CDP connection');
      }
    }

    this.activeConnections.clear();
    this.contexts.clear();
    this.reconnectAttempts.clear();

    this.logger.info('CDP cleanup completed');
  }

  /**
   * Utility method for sleeping
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
