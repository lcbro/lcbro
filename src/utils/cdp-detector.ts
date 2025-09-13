import { Logger } from 'pino';
import { CDPBrowserInfo } from '../core/cdp-browser-manager.js';
import { RemoteCDPClient, RemoteCDPConfig } from './remote-cdp-client.js';

export interface CDPDetectionOptions {
  ports: number[];
  timeout: number;
  host: string;
  useRemote?: boolean;
  remoteConfig?: RemoteCDPConfig;
}

export interface CDPDetectionResult {
  browsers: CDPBrowserInfo[];
  totalScanned: number;
  detectionTime: number;
}

export class CDPDetector {
  constructor(private logger: Logger) {}

  /**
   * Detects all CDP-enabled browsers on the system
   */
  async detectBrowsers(options: CDPDetectionOptions): Promise<CDPDetectionResult> {
    const startTime = Date.now();

    this.logger.info({ 
      ports: options.ports, 
      host: options.host, 
      timeout: options.timeout,
      useRemote: options.useRemote,
      remoteUrl: options.remoteConfig?.url
    }, 'Starting CDP browser detection');

    // Use remote server if configured
    if (options.useRemote && options.remoteConfig) {
      return this.detectRemoteBrowsers(options.remoteConfig, startTime);
    }

    // Local detection
    return this.detectLocalBrowsers(options, startTime);
  }

  /**
   * Detects browsers from remote CDP server
   */
  private async detectRemoteBrowsers(remoteConfig: RemoteCDPConfig, startTime: number): Promise<CDPDetectionResult> {
    try {
      this.logger.info({ url: remoteConfig.url }, 'Detecting browsers from remote CDP server');

      const remoteClient = new RemoteCDPClient(this.logger, remoteConfig);
      const response = await remoteClient.getAvailableBrowsers();

      const detectionTime = Date.now() - startTime;

      if (response.success) {
        this.logger.info({ 
          browsersFound: response.browsers.length,
          detectionTime,
          serverVersion: response.metadata?.serverVersion,
          browsers: response.browsers.map(b => ({ id: b.id, title: b.title, type: b.type }))
        }, 'Remote CDP browser detection completed');

        return {
          browsers: response.browsers,
          totalScanned: 1, // Remote server counts as 1 scan
          detectionTime
        };
      } else {
        this.logger.error({ 
          error: response.error, 
          detectionTime 
        }, 'Remote CDP browser detection failed');

        return {
          browsers: [],
          totalScanned: 1,
          detectionTime
        };
      }

    } catch (error) {
      const detectionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error({ 
        error: errorMessage, 
        detectionTime 
      }, 'Remote CDP browser detection failed');

      return {
        browsers: [],
        totalScanned: 1,
        detectionTime
      };
    }
  }

  /**
   * Detects browsers locally by scanning ports
   */
  private async detectLocalBrowsers(options: CDPDetectionOptions, startTime: number): Promise<CDPDetectionResult> {
    const browsers: CDPBrowserInfo[] = [];
    let totalScanned = 0;

    // Scan ports in parallel for faster detection
    const detectionPromises = options.ports.map(port => 
      this.detectBrowserOnPort(options.host, port, options.timeout)
        .then(result => {
          totalScanned++;
          if (result) {
            browsers.push(result);
            this.logger.debug({ port, browser: result.title }, 'Found CDP browser');
          }
          return result;
        })
        .catch(error => {
          totalScanned++;
          this.logger.debug({ port, error: error instanceof Error ? error.message : String(error) }, 
            'No CDP browser on port');
          return null;
        })
    );

    await Promise.all(detectionPromises);

    const detectionTime = Date.now() - startTime;

    this.logger.info({ 
      browsersFound: browsers.length,
      totalScanned,
      detectionTime,
      browsers: browsers.map(b => ({ id: b.id, title: b.title, type: b.type }))
    }, 'Local CDP browser detection completed');

    return {
      browsers,
      totalScanned,
      detectionTime
    };
  }

  /**
   * Detects a browser on a specific port
   */
  private async detectBrowserOnPort(
    host: string, 
    port: number, 
    timeout: number
  ): Promise<CDPBrowserInfo | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // First, check if the CDP endpoint is available
      const versionResponse = await fetch(`http://${host}:${port}/json/version`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CDP-Detector/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!versionResponse.ok) {
        return null;
      }

      const versionData = await versionResponse.json();

      // Get list of tabs/pages
      const tabsResponse = await fetch(`http://${host}:${port}/json`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CDP-Detector/1.0'
        }
      });

      if (!tabsResponse.ok) {
        return null;
      }

      const tabs = await tabsResponse.json();

      // Find the first tab or create a default one
      const activeTab = tabs.find((tab: any) => tab.type === 'page') || tabs[0] || {
        url: 'about:blank',
        title: 'New Tab',
        id: 'default'
      };

      const browserInfo: CDPBrowserInfo = {
        id: versionData.id || `browser_${port}`,
        title: versionData.Browser || 'Chrome Browser',
        type: this.detectBrowserType(versionData.Browser || ''),
        url: activeTab.url || 'about:blank',
        webSocketDebuggerUrl: versionData.webSocketDebuggerUrl,
        version: versionData.Browser || 'Unknown',
        description: `Browser on ${host}:${port}`
      };

      return browserInfo;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Timeout checking ${host}:${port}`);
      }
      
      throw error;
    }
  }

  /**
   * Detects browser type from version string
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
   * Checks if a specific browser is available
   */
  async isBrowserAvailable(host: string, port: number, timeout: number = 5000): Promise<boolean> {
    try {
      await this.detectBrowserOnPort(host, port, timeout);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets detailed information about a specific browser
   */
  async getBrowserInfo(host: string, port: number, timeout: number = 5000): Promise<CDPBrowserInfo | null> {
    try {
      return await this.detectBrowserOnPort(host, port, timeout);
    } catch {
      return null;
    }
  }

  /**
   * Scans a range of ports for CDP browsers
   */
  async scanPortRange(
    host: string, 
    startPort: number, 
    endPort: number, 
    timeout: number = 5000
  ): Promise<CDPBrowserInfo[]> {
    const ports = Array.from({ length: endPort - startPort + 1 }, (_, i) => startPort + i);
    
    const result = await this.detectBrowsers({
      host,
      ports,
      timeout
    });

    return result.browsers;
  }

  /**
   * Monitors for new CDP browsers (continuously scans)
   */
  async monitorBrowsers(
    options: CDPDetectionOptions,
    callback: (browsers: CDPBrowserInfo[]) => void,
    interval: number = 5000
  ): Promise<() => void> {
    let isMonitoring = true;
    
    const monitor = async () => {
      while (isMonitoring) {
        try {
          const result = await this.detectBrowsers(options);
          callback(result.browsers);
        } catch (error) {
          this.logger.error({ error }, 'Error during browser monitoring');
        }
        
        await this.sleep(interval);
      }
    };

    // Start monitoring in background
    monitor();

    // Return stop function
    return () => {
      isMonitoring = false;
    };
  }

  /**
   * Validates CDP endpoint
   */
  async validateCDPEndpoint(host: string, port: number, timeout: number = 5000): Promise<{
    isValid: boolean;
    version?: string;
    tabs?: number;
    error?: string;
  }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const versionResponse = await fetch(`http://${host}:${port}/json/version`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!versionResponse.ok) {
        return {
          isValid: false,
          error: `HTTP ${versionResponse.status}: ${versionResponse.statusText}`
        };
      }

      const versionData = await versionResponse.json();

      // Get tabs count
      const tabsResponse = await fetch(`http://${host}:${port}/json`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      let tabsCount = 0;
      if (tabsResponse.ok) {
        const tabs = await tabsResponse.json();
        tabsCount = tabs.length;
      }

      return {
        isValid: true,
        version: versionData.Browser || 'Unknown',
        tabs: tabsCount
      };

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Utility method for sleeping
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
