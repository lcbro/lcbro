#!/usr/bin/env node

import { MCPBrowserServer } from './server.js';
import { loadConfig } from './utils/config.js';
import path from 'path';

async function main() {
  try {
    // Load configuration
    const configPath = process.env.CONFIG_PATH || path.join(process.cwd(), 'config', 'default.yaml');
    const config = loadConfig(configPath);
    
    // Create and start server
    const server = new MCPBrowserServer(config);
    await server.start();
    
  } catch (error) {
    console.error('Failed to start MCP Browser Server:', error);
    process.exit(1);
  }
}

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main();
