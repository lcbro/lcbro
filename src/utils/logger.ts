import pino from 'pino';
import { Config } from './config.js';
import { LogsManager } from './logs-manager.js';

export interface LoggerConfig {
  level: string;
  directory?: string;
  fileLogging?: boolean;
  consoleLogging?: boolean;
  format?: 'json' | 'pretty' | 'text';
  colorize?: boolean;
}

export const createLogger = (config: Config | LoggerConfig) => {
  // Handle both Config and LoggerConfig for backward compatibility
  const loggerConfig: LoggerConfig = 'logging' in config 
    ? {
        level: config.logging.level,
        directory: config.logging.directory,
        fileLogging: config.logging.files.enabled,
        consoleLogging: config.logging.console.enabled,
        format: config.logging.files.format,
        colorize: config.logging.console.colorize
      }
    : config;

  // Check if running in MCP mode (stdio transport)
  const isMCPMode = process.env.NODE_ENV === 'mcp' || 
                    process.argv.includes('--mcp') ||
                    (process.stdin.isTTY === false || process.stdin.isTTY === undefined);

  const streams: any[] = [];

  // Console transport - only if not in MCP mode and explicitly enabled
  if (loggerConfig.consoleLogging === true && !isMCPMode) {
    streams.push({
      stream: process.stderr, // Use stderr to avoid interfering with MCP stdout
      level: loggerConfig.level
    });
  }

  // File transport
  if (loggerConfig.fileLogging && loggerConfig.directory) {
    streams.push({
      stream: pino.transport({
        target: 'pino/file',
        options: {
          destination: `${loggerConfig.directory}/application.log`,
          mkdir: true
        }
      }),
      level: loggerConfig.level
    });
  }

  // Create logger with transports
  const logger = streams.length > 0 
    ? pino({
        level: loggerConfig.level,
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      }, pino.multistream(streams))
    : pino({
        level: 'silent', // Silent logger when no transports
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      });

  return logger;
};

export const createAdvancedLogger = async (config: Config): Promise<{
  logger: pino.Logger;
  logsManager: LogsManager;
}> => {
  // Initialize logs manager
  const logsManager = new LogsManager(
    pino({ level: config.logging.level }),
    config
  );
  
  await logsManager.initialize();
  logsManager.scheduleLogRotation();

  // Check if running in MCP mode
  const isMCPMode = process.env.NODE_ENV === 'mcp' || 
                    process.argv.includes('--mcp') ||
                    (process.stdin.isTTY === false || process.stdin.isTTY === undefined);

  // Create transports based on configuration
  const streams: any[] = [];

  // Console transport - only if not in MCP mode and explicitly enabled
  if (config.logging.console.enabled === true && !isMCPMode) {
    streams.push({
      stream: process.stderr, // Use stderr to avoid interfering with MCP stdout
      level: config.logging.level
    });
  }

  // File transports for different categories
  if (config.logging.files.enabled && config.logging.directory) {
    const categories = Object.entries(config.logging.categories)
      .filter(([_, enabled]) => enabled)
      .map(([category, _]) => category);

    for (const category of categories) {
      const filePath = logsManager.getLogFilePath(category);
      
      streams.push({
        stream: pino.transport({
          target: 'pino/file',
          options: {
            destination: filePath,
            mkdir: true
          }
        }),
        level: config.logging.level
      });
    }

    // General application log
    const generalLogPath = logsManager.getLogFilePath('application');
    streams.push({
      stream: pino.transport({
        target: 'pino/file',
        options: {
          destination: generalLogPath,
          mkdir: true
        }
      }),
      level: config.logging.level
    });
  }

  // Create logger with transports
  const logger = streams.length > 0 
    ? pino({
        level: config.logging.level,
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      }, pino.multistream(streams))
    : pino({
        level: 'silent', // Silent logger when no transports
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      });

  return { logger, logsManager };
};
