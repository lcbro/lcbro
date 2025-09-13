import pino from 'pino';

export const createLogger = (level: string = 'info') => {
  // Use simple console logging in production/MCP environment
  return pino({
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
  });
};
