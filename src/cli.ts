#!/usr/bin/env node

import { program } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MCPBrowserServer } from './server.js';
import { loadConfig } from './utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get package.json info
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

program
  .name('lcbro')
  .description('Low Cost Browser Remote Operations - MCP server for browser automation')
  .version(packageJson.version)
  .option('-c, --config <path>', 'Path to configuration file', 'config/default.yaml')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .option('-h, --host <host>', 'Host to bind the server to', 'localhost')
  .option('--no-console', 'Disable console logging')
  .option('--no-files', 'Disable file logging')
  .option('--log-level <level>', 'Log level (debug, info, warn, error)', 'info')
  .option('--logs-dir <dir>', 'Directory for log files', '/data/logs')
  .option('--cdp-enabled', 'Enable CDP browser support')
  .option('--cdp-host <host>', 'CDP server host', 'localhost')
  .option('--cdp-port <port>', 'CDP server port', '9222')
  .option('--remote-url <url>', 'Remote CDP server URL')
  .option('--remote-ssl-mode <mode>', 'Remote CDP SSL mode', 'auto')
  .option('--remote-api-key <key>', 'Remote CDP API key')
  .action(async (options) => {
    try {
      // Show ASCII logo
      console.log(`
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║        ╔═══════════════════════════════════════════╗          ║
    ║        ║                                           ║          ║
    ║        ║    ██╗     ██████╗    ██████╗ ██████╗    ║          ║
    ║        ║    ██║    ██╔═══██╗  ██╔══██╗██╔══██╗   ║          ║
    ║        ║    ██║    ██║   ██║  ██████╔╝██████╔╝   ║          ║
    ║        ║    ██║    ██║   ██║  ██╔══██╗██╔══██╗   ║          ║
    ║        ║    ███████╗╚██████╔╝  ██████╔╝██║  ██║   ║          ║
    ║        ║    ╚══════╝ ╚═════╝   ╚═════╝ ╚═╝  ╚═╝   ║          ║
    ║        ║                                           ║          ║
    ║        ║        ● ●   [●●●]  Browser Automation    ║          ║
    ║        ║        └─┘   [███]  Cool Browser Ops     ║          ║
    ║        ║        🚀    [███]  Playwright + CDP     ║          ║
    ║        ╚═══════════════════════════════════════════╝          ║
    ║                                                               ║
    ║              Low Cost Browser Remote Operations     ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
      `);
      console.log(`🚀 Starting LCBro v${packageJson.version}`);
      console.log(`📋 Configuration: ${options.config}`);
      
      // Load configuration
      const config = await loadConfig(options.config);
      
      // Override configuration with CLI options
      if (options.port) {
        config.server.port = parseInt(options.port);
      }
      if (options.host) {
        config.server.host = options.host;
      }
      if (options.logLevel) {
        config.logging.level = options.logLevel as any;
      }
      if (options.logsDir) {
        config.logging.directory = options.logsDir;
      }
      if (options.console === false) {
        config.logging.console.enabled = false;
      }
      if (options.files === false) {
        config.logging.files.enabled = false;
      }
      
      // CDP options
      if (options.cdpEnabled) {
        config.browser.engine = 'cdp';
        config.browser.cdp.enabled = true;
      }
      if (options.cdpHost) {
        config.browser.cdp.host = options.cdpHost;
      }
      if (options.cdpPort) {
        config.browser.cdp.port = parseInt(options.cdpPort);
      }
      if (options.remoteUrl) {
        config.browser.cdp.remote.enabled = true;
        config.browser.cdp.remote.url = options.remoteUrl;
      }
      if (options.remoteSslMode) {
        config.browser.cdp.remote.sslMode = options.remoteSslMode as any;
      }
      if (options.remoteApiKey) {
        config.browser.cdp.remote.apiKey = options.remoteApiKey;
      }
      
      console.log(`🌐 Server: ${config.server.host}:${config.server.port}`);
      console.log(`📝 Logging: ${config.logging.level} level`);
      console.log(`📁 Logs directory: ${config.logging.directory}`);
      console.log(`🔧 Browser engine: ${config.browser.engine}`);
      
      if (config.browser.engine === 'cdp') {
        console.log(`🔗 CDP: ${config.browser.cdp.host}:${config.browser.cdp.port}`);
        if (config.browser.cdp.remote.enabled) {
          console.log(`🌍 Remote CDP: ${config.browser.cdp.remote.url}`);
        }
      }
      
      // Create and start server
      const server = new MCPBrowserServer(config);
      await server.start();
      
      console.log(`✅ LCBro server started successfully!`);
      console.log(`📡 MCP endpoint: stdio`);
      console.log(`🛑 Press Ctrl+C to stop`);
      
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
  });

// Add subcommands
program
  .command('config')
  .description('Show current configuration')
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config);
      console.log('📋 Current Configuration:');
      console.log(JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      process.exit(1);
    }
  });

program
  .command('browser:launch')
  .description('Launch browser with CDP enabled')
  .option('-p, --port <port>', 'CDP port', '9222')
  .option('-b, --browser <browser>', 'Browser type (chrome, chromium, edge)', 'chrome')
  .option('-n, --num-browsers <num>', 'Number of browsers to launch', '1')
  .action(async (options) => {
    try {
      console.log(`🚀 Launching ${options.numBrowsers} ${options.browser} browser(s) with CDP on port ${options.port}`);
      
      // This would call the browser launcher script
      const { spawn } = await import('child_process');
      const scriptPath = join(__dirname, '../scripts/cdp-browser-launcher.sh');
      
      const child = spawn('bash', [scriptPath, '-b', options.browser, '-p', options.port, '-n', options.numBrowsers], {
        stdio: 'inherit'
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Browser(s) launched successfully');
        } else {
          console.error(`❌ Failed to launch browser(s), exit code: ${code}`);
          process.exit(1);
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to launch browser:', error);
      process.exit(1);
    }
  });

program
  .command('logs')
  .description('Manage log files')
  .option('-d, --directory <dir>', 'Logs directory', '/data/logs')
  .option('-c, --command <cmd>', 'Command (list, summary, cleanup, compress)', 'list')
  .option('-a, --age <days>', 'Age in days for cleanup', '30')
  .action(async (options) => {
    try {
      console.log(`📁 Managing logs in: ${options.directory}`);
      
      const { spawn } = await import('child_process');
      const scriptPath = join(__dirname, '../scripts/logs-manager.sh');
      
      const args = [scriptPath, options.command];
      if (options.command === 'cleanup') {
        args.push(options.age);
      }
      args.push('-d', options.directory);
      
      const child = spawn('bash', args, {
        stdio: 'inherit'
      });
      
      child.on('close', (code) => {
        process.exit(code || 0);
      });
      
    } catch (error) {
      console.error('❌ Failed to manage logs:', error);
      process.exit(1);
    }
  });

program
  .command('test:remote')
  .description('Test remote CDP server connection')
  .requiredOption('-u, --url <url>', 'Remote CDP server URL')
  .option('-s, --ssl-mode <mode>', 'SSL mode', 'auto')
  .option('-k, --api-key <key>', 'API key')
  .action(async (options) => {
    try {
      console.log(`🔍 Testing remote CDP server: ${options.url}`);
      
      const { spawn } = await import('child_process');
      const scriptPath = join(__dirname, '../scripts/test-remote-cdp.sh');
      
      const args = [scriptPath, '-s', options.sslMode, options.url];
      if (options.apiKey) {
        args.splice(-1, 0, '-k', options.apiKey);
      }
      
      const child = spawn('bash', args, {
        stdio: 'inherit'
      });
      
      child.on('close', (code) => {
        process.exit(code || 0);
      });
      
    } catch (error) {
      console.error('❌ Failed to test remote CDP server:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
