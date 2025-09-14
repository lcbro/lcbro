# Chrome DevTools Protocol (CDP) Support

## Overview

Full support for connecting to external browsers through Chrome DevTools Protocol has been implemented. This allows using already running browsers instead of creating new Playwright instances.

## Key Features

### 🔗 **External Browser Connection**
- Automatic detection of running browsers with CDP
- Connection to Chrome, Edge, Chromium
- Support for multiple browsers and tabs

### 🔍 **Automatic Detection**
- Port scanning for CDP browsers
- Browser detection on different ports (9222-9226)
- CDP endpoint validation

### 🔄 **Connection Management**
- WebSocket connections to CDP
- Automatic reconnection on connection loss
- Keep-alive for stable connections

### 🎯 **Full Functionality**
- URL navigation
- JavaScript execution
- Screenshot creation
- Page content extraction

## Configuration

### config/default.yaml

```yaml
browser:
  engine: cdp                # use CDP instead of playwright
  headless: false            # usually false for CDP
  
  # Chrome DevTools Protocol settings
  cdp:
    enabled: true            # enable CDP support
    host: "localhost"        # CDP server host
    port: 9222              # CDP port (default Chrome debug port)
    autoDetect: true        # automatic browser detection
    maxRetries: 3           # connection attempts
    retryDelay: 1000        # delay between attempts (ms)
    
    # Browser detection settings
    detection:
      enabled: true         # enable detection
      ports: [9222, 9223, 9224, 9225, 9226]  # ports to scan
      timeout: 5000         # detection timeout per port
      
    # Browser launch settings
    launch:
      autoLaunch: false     # auto-launch browser if not found
      browserPath: null     # browser path (null = auto-search)
      userDataDir: null     # user data directory
      additionalArgs: []    # additional browser arguments
      
    # Connection settings
    connection:
      timeout: 30000        # connection timeout
      keepAlive: true       # maintain connection
      reconnect: true       # auto-reconnect on disconnect
      maxReconnects: 5      # maximum reconnection attempts
```

## Starting Browser with CDP

### Chrome/Chromium
```bash
# Start Chrome with CDP enabled
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# Or Chromium
chromium --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# With additional options
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  --disable-web-security \
  --disable-features=VizDisplayCompositor
```

### Microsoft Edge
```bash
# Start Edge with CDP
msedge --remote-debugging-port=9222 --user-data-dir=/tmp/edge-debug
```

### Alternative Ports
```bash
# Using different ports for multiple browsers
google-chrome --remote-debugging-port=9223 --user-data-dir=/tmp/chrome-debug-2
google-chrome --remote-debugging-port=9224 --user-data-dir=/tmp/chrome-debug-3
```

## Usage Examples

### 1. Automatic Detection and Connection

```typescript
// Enable CDP in configuration
browser:
  engine: cdp
  cdp:
    enabled: true
    autoDetect: true
    detection:
      ports: [9222, 9223, 9224]

// System will automatically find and connect to first available browser
```

### 2. Connection to Specific Browser

```typescript
// Specify specific port
browser:
  engine: cdp
  cdp:
    enabled: true
    autoDetect: false
    host: "localhost"
    port: 9222
```

### 3. Multiple Browsers

```bash
# Start multiple browsers on different ports
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-1 &
google-chrome --remote-debugging-port=9223 --user-data-dir=/tmp/chrome-2 &
google-chrome --remote-debugging-port=9224 --user-data-dir=/tmp/chrome-3 &

# System will automatically find all available browsers
```

## API for CDP Operations

### Browser Detection

```typescript
import { CDPDetector } from './src/utils/cdp-detector.js';

const detector = new CDPDetector(logger);

// Detect all browsers
const result = await detector.detectBrowsers({
  host: 'localhost',
  ports: [9222, 9223, 9224, 9225, 9226],
  timeout: 5000
});

console.log(`Found ${result.browsers.length} browsers`);
result.browsers.forEach(browser => {
  console.log(`- ${browser.title} on port ${browser.webSocketDebuggerUrl.split(':')[2]}`);
});
```

### Browser Connection

```typescript
import { CDPBrowserManager } from './src/core/cdp-browser-manager.js';

const cdpManager = new CDPBrowserManager(logger, config);

// Connect to specific browser
const contextId = await cdpManager.connectToBrowser(browserInfo);

// Navigation
await cdpManager.navigateToUrl(contextId, 'https://example.com');

// JavaScript execution
const result = await cdpManager.executeScript(contextId, 'document.title');

// Screenshot creation
const screenshot = await cdpManager.takeScreenshot(contextId, { fullPage: true });

// Content extraction
const content = await cdpManager.getPageContent(contextId);
```

### Browser Monitoring

```typescript
// Monitor for new browsers
const stopMonitoring = await detector.monitorBrowsers(
  { host: 'localhost', ports: [9222, 9223, 9224], timeout: 5000 },
  (browsers) => {
    console.log(`Detected ${browsers.length} browsers`);
    browsers.forEach(browser => {
      console.log(`New browser: ${browser.title}`);
    });
  },
  5000 // check every 5 seconds
);

// Stop monitoring
stopMonitoring();
```

## System Architecture

### 1. **CDPDetector** (`src/utils/cdp-detector.ts`)
- Browser detection on ports
- CDP endpoint validation
- New browser monitoring
- Port range scanning

### 2. **CDPBrowserManager** (`src/core/cdp-browser-manager.ts`)
- WebSocket connection management
- CDP command execution
- Browser event handling
- Automatic reconnection

### 3. **BrowserManager** (updated)
- Support for both Playwright and CDP
- Automatic engine selection
- Unified interface for operations

## CDP Commands and Events

### Main Commands
```typescript
// Navigation
{ method: 'Page.navigate', params: { url: 'https://example.com' } }

// JavaScript execution
{ method: 'Runtime.evaluate', params: { expression: 'document.title' } }

// Screenshot creation
{ method: 'Page.captureScreenshot', params: { format: 'png', fullPage: true } }

// Get HTML
{ method: 'Runtime.evaluate', params: { expression: 'document.documentElement.outerHTML' } }
```

### Events
```typescript
// Page load
{ method: 'Page.loadEventFired' }

// Console messages
{ method: 'Runtime.consoleAPICalled', params: { type: 'log', args: [...] } }

// Network requests
{ method: 'Network.responseReceived', params: { response: { url: '...' } } }
```

## Debugging and Monitoring

### Logging
```json
{
  "level": "info",
  "msg": "Found CDP browser",
  "browser": {
    "id": "browser_9222",
    "title": "Chrome Browser",
    "type": "chrome",
    "url": "https://example.com",
    "webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/..."
  }
}

{
  "level": "info",
  "msg": "CDP connection established",
  "contextId": "cdp_1705135815123_abc123",
  "browserId": "browser_9222"
}
```

### Connection Monitoring
```json
{
  "level": "warn",
  "msg": "CDP connection closed",
  "contextId": "cdp_1705135815123_abc123",
  "attemptingReconnect": true
}

{
  "level": "info",
  "msg": "CDP reconnection successful",
  "contextId": "cdp_1705135815123_abc123",
  "attempts": 2
}
```

## CDP Advantages

### **Performance**
- ✅ Using already running browsers
- ✅ No startup overhead
- ✅ Fast tab switching

### **Flexibility**
- ✅ Connect to any CDP-compatible browser
- ✅ Work with user profiles
- ✅ Access to extensions and settings

### **Debugging**
- ✅ Direct access to DevTools
- ✅ Browser console monitoring
- ✅ Network request tracking

### **Scalability**
- ✅ Multiple browser support
- ✅ Load distribution across ports
- ✅ Session isolation

## Limitations and Recommendations

### **Security**
- CDP provides full browser access
- Use only in trusted networks
- Restrict access by IP if possible

### **Stability**
- WebSocket connections may disconnect
- Enable auto-reconnection
- Monitor connection status

### **Performance**
- CDP may be slower than Playwright for some operations
- Use for cases requiring access to existing browser
- Playwright remains preferred for automation

## Usage Scenario Examples

### 1. **Integration with Existing Tests**
```bash
# Start browser for testing
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/test-profile

# Connect from MCP server
# System will automatically find and connect to browser
```

### 2. **User Activity Monitoring**
```bash
# User working in browser
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/user-profile

# MCP server can monitor and analyze activity
```

### 3. **Automation with User Settings**
```bash
# Browser with extensions and settings
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/home/user/.config/google-chrome \
  --profile-directory="Profile 1"
```

## Conclusion

CDP support significantly expands MCP browser server capabilities:

- ✅ **Flexibility**: connect to any CDP-compatible browsers
- ✅ **Performance**: use existing browsers
- ✅ **Integration**: work with user profiles and settings
- ✅ **Monitoring**: track real user activity
- ✅ **Debugging**: direct access to DevTools and console

**Model:** Claude Sonnet 4
