<div align="center">
  <img src="assets/logo.svg" alt="LCBro Logo" width="150" height="112">
  
# LCBro Quick Start Guide
</div>

## 🚀 Install & Run in 30 Seconds

```bash
# 1. Use with npx (no installation needed)
npx lcbro

# 2. Done! LCBro is running
```

### Or install globally:
```bash
# 1. Install globally
npm install -g lcbro

# 2. Start the server
lcbro

# 3. Done! LCBro is running
```

## 🔧 Basic Configuration

### Claude Desktop Setup
Add to `~/.claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "lcbro": {
      "command": "npx",
      "args": ["-y", "lcbro"]
    }
  }
}
```

### Cursor IDE Setup
Add to `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "lcbro": {
      "command": "npx",
      "args": ["-y", "lcbro"]
    }
  }
}
```

### With CDP Support
```json
{
  "mcpServers": {
    "lcbro": {
      "command": "npx",
      "args": ["-y", "lcbro", "--cdp-enabled"]
    }
  }
}
```

## 🎯 Available Commands

```bash
# Start server (with npx)
npx lcbro

# Show help
npx lcbro --help

# Show configuration
npx lcbro config

# Launch browsers
npx lcbro browser:launch -b chrome -p 9222

# Manage logs
npx lcbro logs --command summary

# Test remote CDP
npx lcbro test:remote -u https://cdp.example.com:9222

# Or if installed globally, use directly:
lcbro --help
```

## ⚙️ Key Options

```bash
# CDP support
npx lcbro --cdp-enabled

# Custom port
npx lcbro --port 3001

# Remote CDP server
npx lcbro --remote-url https://cdp.example.com:9222

# Debug logging
npx lcbro --log-level debug

# Or with global installation:
lcbro --cdp-enabled
```

## 📚 Full Documentation

- [Complete README](README.md)
- [Intelligent Preprocessing](docs/INTELLIGENT_PREPROCESSING.md)
- [CDP Browser Support](docs/CDP_BROWSER_SUPPORT.md)
- [LLM Logging Guide](docs/LLM_LOGGING_GUIDE.md)

## 🆘 Need Help?

- [GitHub Issues](https://github.com/lcbro/lcbro/issues)
- [Documentation](docs/)
- [Examples](examples/)

---

**LCBro** - Lightweight Chrome Browser Remote Operations  
**Status**: ✅ Production Ready
