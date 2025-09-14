# Logs Directory Configuration

## Overview

An extended log management system with the ability to specify a directory for storing logs, file rotation, compression, and categorization has been implemented.

## 📁 Key Features

### **Log Directory Management**
- Configurable directory for log storage
- Automatic directory creation
- Log rotation by size and time
- Old log compression

### **Log Categorization**
- Separate files for different categories
- Configurable logging formats
- Console and file logging
- Colored console output

### **File Management**
- Automatic log rotation
- Large file compression
- Old file cleanup
- Disk usage monitoring

## ⚙️ Configuration

### config/default.yaml

```yaml
logging:
  level: info
  directory: /data/logs           # directory for log storage
  maxFileSize: "100MB"           # maximum log file size
  maxFiles: 10                   # maximum number of log files
  compress: true                 # compress old log files
  rotation: "daily"              # log rotation: daily, weekly, monthly, size
  
  # File logging configuration
  files:
    enabled: true                # enable file logging
    format: "json"               # log format: json, pretty, text
    includeTimestamp: true       # include timestamp in filename
    includeLevel: true           # include log level in filename
    
  # Console logging configuration  
  console:
    enabled: true                # enable console logging
    format: "pretty"             # console format: pretty, json, text
    colorize: true               # colored console output
    
  # Log categories
  categories:
    browser: true               # browser operation logs
    llm: true                   # LLM operation logs
    cdp: true                   # CDP connection logs
    network: true               # network request logs
    errors: true                # error logs
    performance: true           # performance metrics logs
  
  # Detailed LLM logging
  llm:
    enabled: true                 # enable detailed LLM logging
    logPrompts: true             # log all prompts sent to LLM
    logResponses: true           # log all LLM responses
    logTokens: true              # log token usage statistics
    logPerformance: true         # log time and performance metrics
    logPreprocessing: true       # log preprocessing analysis and results
    
    # Data logging settings
    maxPromptLength: 2000        # maximum characters for logging prompts
    maxResponseLength: 1000      # maximum characters for logging responses
    maxInputDataLength: 5000     # maximum characters for logging input data
    
    # Performance tracking
    trackMetrics: true           # track performance metrics
    metricsInterval: 100         # log metrics every N operations
```

## 📂 Log Directory Structure

### **File Naming**
```
/data/logs/
├── application-2024-01-15.log          # General application logs
├── browser-info-2024-01-15.log         # Browser logs (info level)
├── browser-error-2024-01-15.log        # Browser logs (error level)
├── llm-info-2024-01-15.log             # LLM logs (info level)
├── llm-error-2024-01-15.log            # LLM logs (error level)
├── cdp-info-2024-01-15.log             # CDP logs (info level)
├── network-info-2024-01-15.log         # Network logs (info level)
├── performance-info-2024-01-15.log     # Performance logs (info level)
├── errors-error-2024-01-15.log         # Error logs (error level)
├── application-2024-01-14.log.gz       # Compressed old files
└── browser-2024-01-14.log.gz
```

### **File Name Format**
- `{category}-{level}-{timestamp}.log` - if level and timestamp are enabled
- `{category}-{timestamp}.log` - if only timestamp is enabled
- `{category}-{level}.log` - if only level is enabled
- `{category}.log` - basic format

## 🔄 Log Rotation

### **Rotation Types**

#### **daily** (daily)
```yaml
rotation: "daily"
```
- New file each day
- Old files compressed and archived

#### **weekly** (weekly)
```yaml
rotation: "weekly"
```
- New file each week
- Suitable for low-activity applications

#### **monthly** (monthly)
```yaml
rotation: "monthly"
```
- New file each month
- For long-term storage

#### **size** (by size)
```yaml
rotation: "size"
maxFileSize: "100MB"
```
- Rotation when maximum size is reached
- Check every hour

### **Rotation Settings**
```yaml
logging:
  maxFileSize: "100MB"           # maximum file size
  maxFiles: 10                   # maximum number of files
  compress: true                 # compress old files
  rotation: "daily"              # rotation type
```

## 🎨 Logging Formats

### **JSON Format** (recommended for files)
```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "msg": "Browser navigation completed",
  "url": "https://example.com",
  "duration": 1250,
  "category": "browser"
}
```

### **Pretty Format** (for console)
```
[2024-01-15 10:30:00] [INFO] Browser navigation completed
    url: "https://example.com"
    duration: 1250ms
    category: "browser"
```

### **Text Format** (simple)
```
2024-01-15T10:30:00.000Z [INFO] Browser navigation completed
```

## 🛠️ Log Management Utilities

### **logs-manager.sh**

#### **List Log Files**
```bash
./scripts/logs-manager.sh list
./scripts/logs-manager.sh list -d /custom/logs/dir
```

#### **Log Statistics**
```bash
./scripts/logs-manager.sh summary
```

#### **Clean Old Logs**
```bash
./scripts/logs-manager.sh cleanup 7    # remove files older than 7 days
./scripts/logs-manager.sh cleanup 30   # remove files older than 30 days
```

#### **Compress Logs**
```bash
./scripts/logs-manager.sh compress
```

#### **Monitor Logs**
```bash
# View recent entries
./scripts/logs-manager.sh tail browser

# Follow logs in real-time
./scripts/logs-manager.sh tail browser -f

# View with filtering
./scripts/logs-manager.sh tail browser -g "error"
```

#### **Search Logs**
```bash
./scripts/logs-manager.sh search "error"
./scripts/logs-manager.sh search "timeout" -g "browser"
```

#### **Export Logs**
```bash
# Export all logs
./scripts/logs-manager.sh export

# Export browser logs
./scripts/logs-manager.sh export browser -o browser-logs.tar.gz

# Export LLM logs
./scripts/logs-manager.sh export llm -o llm-logs.tar.gz
```

#### **Disk Usage Statistics**
```bash
./scripts/logs-manager.sh size
```

## 💻 Programmatic Usage

### **LogsManager**

```typescript
import { LogsManager } from './src/utils/logs-manager.js';
import { Config } from './src/utils/config.js';

const logsManager = new LogsManager(logger, config);

// Initialize
await logsManager.initialize();

// Schedule automatic rotation
logsManager.scheduleLogRotation();

// Get log file information
const logFiles = await logsManager.listLogFiles();
console.log(`Found ${logFiles.length} log files`);

// Get files by category
const browserLogs = await logsManager.getLogFilesByCategory('browser');

// Get files by level
const errorLogs = await logsManager.getLogFilesByLevel('error');

// Compress log file
await logsManager.compressLogFile('/data/logs/old-file.log');

// Clean old logs
await logsManager.cleanupOldLogs(30); // remove files older than 30 days

// Get disk usage statistics
const diskUsage = await logsManager.getLogsDiskUsage();
console.log(`Total size: ${diskUsage.totalSize} bytes`);

// Get log summary
const summary = await logsManager.getLogsSummary();
console.log(summary);
```

### **Create Advanced Logger**

```typescript
import { createAdvancedLogger } from './src/utils/logger.js';

// Create logger with file management
const { logger, logsManager } = await createAdvancedLogger(config);

// Logging with category
logger.info({ 
  category: 'browser', 
  url: 'https://example.com' 
}, 'Browser navigation started');

// Automatic rotation already configured
```

## 📊 Monitoring and Analysis

### **Usage Statistics**
```bash
# General statistics
./scripts/logs-manager.sh summary

# Disk usage
./scripts/logs-manager.sh size

# File list
./scripts/logs-manager.sh list
```

### **Log Analysis**
```bash
# Search for errors
./scripts/logs-manager.sh search "error" -g "level.*error"

# Performance analysis
./scripts/logs-manager.sh search "duration" -g "performance"

# Monitor CDP connections
./scripts/logs-manager.sh tail cdp -f
```

### **Export for Analysis**
```bash
# Export all logs for period
./scripts/logs-manager.sh export

# Export logs by specific category
./scripts/logs-manager.sh export browser -o browser-analysis.tar.gz
```

## 🔧 Configuration for Different Environments

### **Development**
```yaml
logging:
  level: debug
  directory: ./logs
  files:
    enabled: true
    format: "pretty"
  console:
    enabled: true
    colorize: true
  rotation: "size"
  maxFileSize: "10MB"
```

### **Testing**
```yaml
logging:
  level: info
  directory: /tmp/test-logs
  files:
    enabled: true
    format: "json"
  console:
    enabled: false
  rotation: "daily"
  maxFiles: 5
```

### **Production**
```yaml
logging:
  level: warn
  directory: /var/log/mcp-browser
  files:
    enabled: true
    format: "json"
  console:
    enabled: false
  rotation: "daily"
  maxFiles: 30
  compress: true
```

### **Docker**
```yaml
logging:
  level: info
  directory: /data/logs
  files:
    enabled: true
    format: "json"
  console:
    enabled: true
    format: "text"
  rotation: "size"
  maxFileSize: "50MB"
```

## 🚨 Warnings and Recommendations

### **Security**
- Don't log sensitive data (passwords, tokens)
- Restrict access to log directory
- Regularly clean old logs

### **Performance**
- Use asynchronous logging
- Configure rotation to prevent disk overflow
- Compress old files to save space

### **Monitoring**
- Set up error alerts
- Monitor log directory size
- Regularly analyze logs for issues

## 🎯 Usage Examples

### **1. High-load Application Configuration**
```yaml
logging:
  level: warn
  directory: /var/log/mcp-browser
  rotation: "size"
  maxFileSize: "500MB"
  maxFiles: 20
  compress: true
  files:
    enabled: true
    format: "json"
  console:
    enabled: false
```

### **2. Debug Configuration**
```yaml
logging:
  level: debug
  directory: ./debug-logs
  rotation: "daily"
  maxFiles: 7
  files:
    enabled: true
    format: "pretty"
  console:
    enabled: true
    colorize: true
  categories:
    browser: true
    llm: true
    cdp: true
    network: true
    errors: true
    performance: true
```

### **3. Monitoring Configuration**
```yaml
logging:
  level: info
  directory: /monitoring/logs
  rotation: "weekly"
  maxFiles: 12
  compress: true
  files:
    enabled: true
    format: "json"
  console:
    enabled: false
  categories:
    performance: true
    errors: true
```

## 🚀 Ready for Use

The log directory management system is fully implemented:

- ✅ **Configurable directory** for log storage
- ✅ **Automatic rotation** by size and time
- ✅ **Old file compression** for space saving
- ✅ **Log categorization** by operation types
- ✅ **Management utilities** for administration
- ✅ **Disk usage monitoring**
- ✅ **Export and analysis** capabilities
- ✅ **Flexible configuration** for different environments

---

**Implemented with Claude Sonnet 4 model**
