import { Logger } from 'pino';
import { CDPBrowserInfo } from '../core/cdp-browser-manager.js';

export interface RemoteCDPConfig {
  url: string;
  sslMode: 'auto' | 'enabled' | 'disabled' | 'insecure';
  apiKey?: string | null;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface RemoteCDPResponse {
  success: boolean;
  browsers: CDPBrowserInfo[];
  error?: string;
  metadata?: {
    serverVersion?: string;
    serverInfo?: string;
    timestamp: number;
  };
}

export class RemoteCDPClient {
  private logger: Logger;
  private config: RemoteCDPConfig;

  constructor(logger: Logger, config: RemoteCDPConfig) {
    this.logger = logger;
    this.config = config;
  }

  /**
   * Fetches available browsers from remote CDP server
   */
  async getAvailableBrowsers(): Promise<RemoteCDPResponse> {
    try {
      this.logger.info({ 
        url: this.config.url, 
        sslMode: this.config.sslMode 
      }, 'Fetching browsers from remote CDP server');

      const response = await this.makeRequest('/api/browsers');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Parse browser information
      const browsers: CDPBrowserInfo[] = data.browsers?.map((browser: any) => ({
        id: browser.id || `remote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: browser.title || browser.name || 'Remote Browser',
        type: this.detectBrowserType(browser.userAgent || browser.version || ''),
        url: browser.url || 'about:blank',
        webSocketDebuggerUrl: browser.webSocketUrl || browser.wsUrl,
        version: browser.version || 'Unknown',
        description: browser.description || `Remote browser from ${this.config.url}`
      })) || [];

      this.logger.info({ 
        count: browsers.length, 
        browsers: browsers.map(b => ({ id: b.id, title: b.title }))
      }, 'Retrieved browsers from remote CDP server');

      return {
        success: true,
        browsers,
        metadata: {
          serverVersion: data.serverVersion,
          serverInfo: data.serverInfo,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error({ 
        url: this.config.url, 
        error: errorMessage 
      }, 'Failed to fetch browsers from remote CDP server');

      return {
        success: false,
        browsers: [],
        error: errorMessage
      };
    }
  }

  /**
   * Gets server information and status
   */
  async getServerInfo(): Promise<{
    success: boolean;
    info?: any;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest('/api/info');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const info = await response.json();
      
      return {
        success: true,
        info
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error({ 
        url: this.config.url, 
        error: errorMessage 
      }, 'Failed to get server info');

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Checks if remote server is available
   */
  async isServerAvailable(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/health', { timeout: 5000 });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Gets browser details by ID
   */
  async getBrowserDetails(browserId: string): Promise<{
    success: boolean;
    browser?: CDPBrowserInfo;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest(`/api/browsers/${browserId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const browser: CDPBrowserInfo = {
        id: data.id || browserId,
        title: data.title || data.name || 'Remote Browser',
        type: this.detectBrowserType(data.userAgent || data.version || ''),
        url: data.url || 'about:blank',
        webSocketDebuggerUrl: data.webSocketUrl || data.wsUrl,
        version: data.version || 'Unknown',
        description: data.description || `Remote browser ${browserId}`
      };

      return {
        success: true,
        browser
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error({ 
        browserId, 
        url: this.config.url, 
        error: errorMessage 
      }, 'Failed to get browser details');

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Makes HTTP request to remote CDP server
   */
  private async makeRequest(endpoint: string, options: { timeout?: number } = {}): Promise<Response> {
    const url = new URL(endpoint, this.config.url);
    const timeout = options.timeout || this.config.timeout || 30000;

    // Prepare headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'MCP-Browser-Server/1.0',
      ...this.config.headers
    };

    // Add API key if provided
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      headers['X-API-Key'] = this.config.apiKey;
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(timeout)
    };

    // Handle SSL mode
    if (this.config.sslMode === 'insecure') {
      // In Node.js environment, we would need to set rejectUnauthorized: false
      // For browser environments, this is handled by the browser
      this.logger.warn('SSL verification disabled - connections may not be secure');
    }

    this.logger.debug({ 
      url: url.toString(), 
      method: 'GET', 
      sslMode: this.config.sslMode 
    }, 'Making request to remote CDP server');

    const response = await fetch(url.toString(), fetchOptions);
    
    this.logger.debug({ 
      url: url.toString(), 
      status: response.status, 
      statusText: response.statusText 
    }, 'Remote CDP server response');

    return response;
  }

  /**
   * Detects browser type from user agent or version string
   */
  private detectBrowserType(versionString: string): string {
    const version = versionString.toLowerCase();
    
    if (version.includes('chrome')) {
      return 'chrome';
    } else if (version.includes('edge')) {
      return 'edge';
    } else if (version.includes('firefox')) {
      return 'firefox';
    } else if (version.includes('safari')) {
      return 'safari';
    } else {
      return 'unknown';
    }
  }

  /**
   * Validates remote CDP server URL
   */
  static validateURL(url: string): { valid: boolean; error?: string } {
    try {
      const parsedUrl = new URL(url);
      
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return {
          valid: false,
          error: 'URL must use HTTP or HTTPS protocol'
        };
      }

      if (!parsedUrl.hostname) {
        return {
          valid: false,
          error: 'URL must include hostname'
        };
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid URL format'
      };
    }
  }

  /**
   * Parses remote CDP server URL and extracts components
   */
  static parseRemoteURL(url: string): {
    host: string;
    port: number;
    protocol: string;
    path: string;
  } {
    const parsedUrl = new URL(url);
    
    return {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port) || (parsedUrl.protocol === 'https:' ? 443 : 80),
      protocol: parsedUrl.protocol,
      path: parsedUrl.pathname
    };
  }

  /**
   * Creates a RemoteCDPClient from configuration
   */
  static createFromConfig(logger: Logger, config: {
    url: string;
    sslMode?: string;
    apiKey?: string | null;
    headers?: Record<string, string>;
    timeout?: number;
  }): RemoteCDPClient {
    const remoteConfig: RemoteCDPConfig = {
      url: config.url,
      sslMode: (config.sslMode as any) || 'auto',
      apiKey: config.apiKey || null,
      headers: config.headers || {},
      timeout: config.timeout || 30000
    };

    return new RemoteCDPClient(logger, remoteConfig);
  }
}
