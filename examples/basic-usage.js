#!/usr/bin/env node

/**
 * Basic usage example for LCBro MCP Server
 * 
 * This example shows how to use LCBro programmatically
 * and demonstrates the main features.
 */

import { MCPBrowserServer } from 'lcbro';

// Example configuration
const config = {
  server: {
    host: 'localhost',
    port: 3000
  },
  browser: {
    engine: 'playwright', // or 'cdp'
    headless: true,
    defaultTimeoutMs: 30000,
    storageDir: '/tmp/lcbro-profiles',
    maxContexts: 5,
    cdp: {
      enabled: false,
      host: 'localhost',
      port: 9222,
      autoDetect: true,
      maxRetries: 3,
      retryDelay: 1000,
      remote: {
        enabled: false,
        url: null,
        sslMode: 'auto',
        apiKey: null,
        headers: {}
      },
      detection: {
        enabled: true,
        ports: [9222, 9223, 9224, 9225, 9226],
        timeout: 5000,
        useRemote: false
      },
      launch: {
        autoLaunch: false,
        browserPath: null,
        userDataDir: null,
        additionalArgs: []
      },
      connection: {
        timeout: 30000,
        keepAlive: true,
        reconnect: true,
        maxReconnects: 5
      }
    }
  },
  network: {
    proxyDefault: null
  },
  security: {
    allowDomains: [],
    blockDomains: [],
    allowUrls: [],
    blockUrls: []
  },
  llm: {
    host: 'localhost',
    port: 11434,
    janPort: 1337,
    autoPreprocess: true,
    preprocessing: {
      enabled: true,
      intelligentMode: true,
      fallbackToTemplates: true,
      thresholds: {
        html: 3000,
        text: 5000,
        json: 1000
      },
      preferredModels: [
        'ollama:qwen2.5:7b',
        'ollama:llama3.2:3b',
        'ollama:mistral:7b'
      ],
      analysis: {
        maxContentSample: 1000,
        maxAnalysisTokens: 300,
        analysisTemperature: 0.1
      }
    }
  },
  limits: {
    maxChars: 300000,
    maxScreenshotBytes: 8000000
  },
  logging: {
    level: 'info',
    directory: '/tmp/lcbro-logs',
    maxFileSize: '100MB',
    maxFiles: 10,
    compress: true,
    rotation: 'daily',
    files: {
      enabled: true,
      format: 'json',
      includeTimestamp: true,
      includeLevel: true
    },
    console: {
      enabled: true,
      format: 'pretty',
      colorize: true
    },
    categories: {
      browser: true,
      llm: true,
      cdp: true,
      network: true,
      errors: true,
      performance: true
    },
    llm: {
      enabled: true,
      logPrompts: true,
      logResponses: true,
      logTokens: true,
      logPerformance: true,
      logPreprocessing: true,
      maxPromptLength: 2000,
      maxResponseLength: 1000,
      maxInputDataLength: 5000,
      trackMetrics: true,
      metricsInterval: 100
    }
  }
};

async function main() {
  console.log('🚀 Starting LCBro MCP Server example...');
  
  try {
    // Create server instance
    const server = new MCPBrowserServer(config);
    
    // Start the server
    await server.start();
    
    console.log('✅ LCBro server started successfully!');
    console.log('📡 MCP endpoint: stdio');
    console.log('🛑 Press Ctrl+C to stop');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down LCBro server...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down LCBro server...');
      await server.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start LCBro server:', error);
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);
