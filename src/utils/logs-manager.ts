import { Logger } from 'pino';
import { Config } from './config.js';
import { mkdir, writeFile, readdir, stat, unlink } from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { join, basename, extname } from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

export interface LogFileInfo {
  name: string;
  path: string;
  size: number;
  created: Date;
  modified: Date;
  compressed: boolean;
}

export interface LogRotationOptions {
  maxFileSize: string;
  maxFiles: number;
  compress: boolean;
  rotation: 'daily' | 'weekly' | 'monthly' | 'size';
}

export class LogsManager {
  private logger: Logger;
  private config: Config;
  private logsDirectory: string;
  private isInitialized = false;

  constructor(logger: Logger, config: Config) {
    this.logger = logger;
    this.config = config;
    this.logsDirectory = config.logging.directory;
  }

  /**
   * Initializes the logs directory and ensures it exists
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create logs directory if it doesn't exist
      await mkdir(this.logsDirectory, { recursive: true });
      
      this.logger.info({ 
        logsDirectory: this.logsDirectory 
      }, 'Logs directory initialized');

      // Perform log rotation if needed
      await this.performLogRotation();

      this.isInitialized = true;

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        logsDirectory: this.logsDirectory 
      }, 'Failed to initialize logs directory');
      throw error;
    }
  }

  /**
   * Gets the logs directory path
   */
  getLogsDirectory(): string {
    return this.logsDirectory;
  }

  /**
   * Generates a log file name based on configuration
   */
  generateLogFileName(category: string, level?: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const parts: string[] = [];

    // Add category
    parts.push(category);

    // Add level if configured
    if (level && this.config.logging.files.includeLevel) {
      parts.push(level);
    }

    // Add timestamp if configured
    if (this.config.logging.files.includeTimestamp) {
      parts.push(timestamp);
    }

    // Add extension
    parts.push('log');

    return parts.join('-');
  }

  /**
   * Gets the full path for a log file
   */
  getLogFilePath(category: string, level?: string): string {
    const fileName = this.generateLogFileName(category, level);
    return join(this.logsDirectory, fileName);
  }

  /**
   * Lists all log files in the logs directory
   */
  async listLogFiles(): Promise<LogFileInfo[]> {
    await this.initialize();

    try {
      const files = await readdir(this.logsDirectory);
      const logFiles: LogFileInfo[] = [];

      for (const file of files) {
        if (file.endsWith('.log') || file.endsWith('.gz')) {
          const filePath = join(this.logsDirectory, file);
          const stats = await stat(filePath);
          
          logFiles.push({
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            compressed: file.endsWith('.gz')
          });
        }
      }

      // Sort by modification time (newest first)
      logFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime());

      return logFiles;

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Failed to list log files');
      return [];
    }
  }

  /**
   * Gets log files by category
   */
  async getLogFilesByCategory(category: string): Promise<LogFileInfo[]> {
    const allFiles = await this.listLogFiles();
    return allFiles.filter(file => file.name.startsWith(`${category}-`));
  }

  /**
   * Gets log files by level
   */
  async getLogFilesByLevel(level: string): Promise<LogFileInfo[]> {
    const allFiles = await this.listLogFiles();
    return allFiles.filter(file => file.name.includes(`-${level}-`));
  }

  /**
   * Compresses a log file
   */
  async compressLogFile(filePath: string): Promise<string> {
    const compressedPath = `${filePath}.gz`;
    
    try {
      const source = createReadStream(filePath);
      const destination = createWriteStream(compressedPath);
      const gzip = createGzip();

      await pipeline(source, gzip, destination);

      // Remove original file after successful compression
      await unlink(filePath);

      this.logger.debug({ 
        originalFile: filePath, 
        compressedFile: compressedPath 
      }, 'Log file compressed');

      return compressedPath;

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        filePath 
      }, 'Failed to compress log file');
      throw error;
    }
  }

  /**
   * Parses file size string (e.g., "100MB", "1GB") to bytes
   */
  private parseFileSize(sizeStr: string): number {
    const units: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([A-Z]+)$/i);
    if (!match) {
      throw new Error(`Invalid file size format: ${sizeStr}`);
    }

    const size = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    if (!units[unit]) {
      throw new Error(`Unknown file size unit: ${unit}`);
    }

    return Math.floor(size * units[unit]);
  }

  /**
   * Performs log rotation based on configuration
   */
  async performLogRotation(): Promise<void> {
    try {
      const maxFileSize = this.parseFileSize(this.config.logging.maxFileSize);
      const maxFiles = this.config.logging.maxFiles;
      const shouldCompress = this.config.logging.compress;

      this.logger.debug({ 
        maxFileSize, 
        maxFiles, 
        shouldCompress 
      }, 'Performing log rotation');

      const logFiles = await this.listLogFiles();
      
      // Group files by category and level
      const fileGroups: Record<string, LogFileInfo[]> = {};
      
      for (const file of logFiles) {
        const baseName = basename(file.name, extname(file.name));
        if (!fileGroups[baseName]) {
          fileGroups[baseName] = [];
        }
        fileGroups[baseName].push(file);
      }

      // Process each group
      for (const [groupName, files] of Object.entries(fileGroups)) {
        // Sort by modification time (newest first)
        files.sort((a, b) => b.modified.getTime() - a.modified.getTime());

        // Check if we need to compress or delete files
        let filesToProcess = [...files];
        
        // Compress large files if compression is enabled
        if (shouldCompress) {
          for (const file of files) {
            if (!file.compressed && file.size > maxFileSize) {
              try {
                await this.compressLogFile(file.path);
                filesToProcess = filesToProcess.filter(f => f.path !== file.path);
              } catch (error) {
                this.logger.warn({ 
                  error: error instanceof Error ? error.message : String(error),
                  file: file.path 
                }, 'Failed to compress log file during rotation');
              }
            }
          }
        }

        // Delete old files if we exceed maxFiles
        if (filesToProcess.length > maxFiles) {
          const filesToDelete = filesToProcess.slice(maxFiles);
          
          for (const file of filesToDelete) {
            try {
              await unlink(file.path);
              this.logger.debug({ file: file.path }, 'Deleted old log file');
            } catch (error) {
              this.logger.warn({ 
                error: error instanceof Error ? error.message : String(error),
                file: file.path 
              }, 'Failed to delete old log file');
            }
          }
        }
      }

      this.logger.info({ 
        processedGroups: Object.keys(fileGroups).length 
      }, 'Log rotation completed');

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Failed to perform log rotation');
    }
  }

  /**
   * Cleans up old log files based on age
   */
  async cleanupOldLogs(maxAgeDays: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      const logFiles = await this.listLogFiles();
      let deletedCount = 0;

      for (const file of logFiles) {
        if (file.modified < cutoffDate) {
          try {
            await unlink(file.path);
            deletedCount++;
            this.logger.debug({ file: file.path }, 'Deleted old log file');
          } catch (error) {
            this.logger.warn({ 
              error: error instanceof Error ? error.message : String(error),
              file: file.path 
            }, 'Failed to delete old log file');
          }
        }
      }

      if (deletedCount > 0) {
        this.logger.info({ 
          deletedCount, 
          maxAgeDays 
        }, 'Cleaned up old log files');
      }

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Failed to cleanup old logs');
    }
  }

  /**
   * Gets disk usage statistics for logs directory
   */
  async getLogsDiskUsage(): Promise<{
    totalFiles: number;
    totalSize: number;
    compressedFiles: number;
    uncompressedFiles: number;
  }> {
    try {
      const logFiles = await this.listLogFiles();
      
      let totalSize = 0;
      let compressedFiles = 0;
      let uncompressedFiles = 0;

      for (const file of logFiles) {
        totalSize += file.size;
        if (file.compressed) {
          compressedFiles++;
        } else {
          uncompressedFiles++;
        }
      }

      return {
        totalFiles: logFiles.length,
        totalSize,
        compressedFiles,
        uncompressedFiles
      };

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Failed to get logs disk usage');
      
      return {
        totalFiles: 0,
        totalSize: 0,
        compressedFiles: 0,
        uncompressedFiles: 0
      };
    }
  }

  /**
   * Creates a summary of log files
   */
  async getLogsSummary(): Promise<{
    directory: string;
    totalFiles: number;
    totalSize: string;
    categories: Record<string, number>;
    levels: Record<string, number>;
    oldestFile?: Date;
    newestFile?: Date;
  }> {
    try {
      const logFiles = await this.listLogFiles();
      const diskUsage = await this.getLogsDiskUsage();
      
      const categories: Record<string, number> = {};
      const levels: Record<string, number> = {};
      let oldestFile: Date | undefined;
      let newestFile: Date | undefined;

      for (const file of logFiles) {
        // Extract category (first part before dash)
        const category = file.name.split('-')[0];
        categories[category] = (categories[category] || 0) + 1;

        // Extract level if present
        const levelMatch = file.name.match(/-([a-z]+)-/);
        if (levelMatch) {
          const level = levelMatch[1];
          levels[level] = (levels[level] || 0) + 1;
        }

        // Track oldest and newest files
        if (!oldestFile || file.modified < oldestFile) {
          oldestFile = file.modified;
        }
        if (!newestFile || file.modified > newestFile) {
          newestFile = file.modified;
        }
      }

      // Format total size
      const formatSize = (bytes: number): string => {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
          size /= 1024;
          unitIndex++;
        }
        
        return `${size.toFixed(1)}${units[unitIndex]}`;
      };

      return {
        directory: this.logsDirectory,
        totalFiles: diskUsage.totalFiles,
        totalSize: formatSize(diskUsage.totalSize),
        categories,
        levels,
        oldestFile,
        newestFile
      };

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Failed to get logs summary');
      
      return {
        directory: this.logsDirectory,
        totalFiles: 0,
        totalSize: '0B',
        categories: {},
        levels: {},
        oldestFile: undefined,
        newestFile: undefined
      };
    }
  }

  /**
   * Schedules automatic log rotation
   */
  scheduleLogRotation(): void {
    const rotationInterval = this.getRotationInterval();
    
    if (rotationInterval > 0) {
      setInterval(async () => {
        try {
          await this.performLogRotation();
        } catch (error) {
          this.logger.error({ 
            error: error instanceof Error ? error.message : String(error) 
          }, 'Scheduled log rotation failed');
        }
      }, rotationInterval);

      this.logger.info({ 
        interval: rotationInterval,
        intervalHours: rotationInterval / (1000 * 60 * 60)
      }, 'Scheduled automatic log rotation');
    }
  }

  /**
   * Gets rotation interval in milliseconds based on configuration
   */
  private getRotationInterval(): number {
    switch (this.config.logging.rotation) {
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000; // 30 days
      case 'size':
        return 60 * 60 * 1000; // 1 hour (check every hour for size-based rotation)
      default:
        return 24 * 60 * 60 * 1000; // Default to daily
    }
  }
}
