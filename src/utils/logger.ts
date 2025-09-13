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

  const transports: any[] = [];

  // Console transport
  if (loggerConfig.consoleLogging !== false) {
    // Simple console logging without pino-pretty dependency
    const consoleLogger = pino({
      level: loggerConfig.level,
      transport: undefined, // No transport for console
      formatters: {
        level: (label) => ({ level: label }),
      },
    });
    transports.push(consoleLogger);
  }

  // File transport
  if (loggerConfig.fileLogging && loggerConfig.directory) {
    const fileTransport = pino.transport({
      target: 'pino/file',
      options: {
        destination: `${loggerConfig.directory}/application.log`,
        mkdir: true
      }
    });
    transports.push(fileTransport);
  }

  // Create logger with transports
  const logger = transports.length > 0 
    ? pino({
        level: loggerConfig.level,
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      }, pino.multistream(transports))
    : pino({
        level: loggerConfig.level,
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

  // Create transports based on configuration
  const transports: any[] = [];

  // Console transport
  if (config.logging.console.enabled) {
    // Simple console logging without pino-pretty dependency
    const consoleLogger = pino({
      level: config.logging.level,
      transport: undefined, // No transport for console
      formatters: {
        level: (label) => ({ level: label }),
      },
    });
    transports.push(consoleLogger);
  }

  // File transports for different categories
  if (config.logging.files.enabled && config.logging.directory) {
    const categories = Object.entries(config.logging.categories)
      .filter(([_, enabled]) => enabled)
      .map(([category, _]) => category);

    for (const category of categories) {
      const filePath = logsManager.getLogFilePath(category);
      
      const fileTransport = pino.transport({
        target: 'pino/file',
        options: {
          destination: filePath,
          mkdir: true
        }
      });
      transports.push(fileTransport);
    }

    // General application log
    const generalLogPath = logsManager.getLogFilePath('application');
    const generalTransport = pino.transport({
      target: 'pino/file',
      options: {
        destination: generalLogPath,
        mkdir: true
      }
    });
    transports.push(generalTransport);
  }

  // Create logger with transports
  const logger = transports.length > 0 
    ? pino({
        level: config.logging.level,
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      }, pino.multistream(transports))
    : pino({
        level: config.logging.level,
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      });

  return { logger, logsManager };
};
