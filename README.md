<div align="center">
  <br />
  <img src="assets/logo.svg" alt="LCBro Logo" width="300" height="225">
  <br />
  <br />
  
  # LCBro
  
  ### Low Cost Browser Remote Operations
  
  **The Cool Browser Automation MCP Server** 🔥
  
  [![npm version](https://img.shields.io/npm/v/lcbro.svg?style=flat-square)](https://www.npmjs.com/package/lcbro)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org/)
  
  [![CI/CD Pipeline](https://github.com/lcbro/lcbro/actions/workflows/ci.yml/badge.svg)](https://github.com/lcbro/lcbro/actions/workflows/ci.yml)
  [![Docker Testing](https://github.com/lcbro/lcbro/actions/workflows/docker.yml/badge.svg)](https://github.com/lcbro/lcbro/actions/workflows/docker.yml)
  [![Release](https://github.com/lcbro/lcbro/actions/workflows/release.yml/badge.svg)](https://github.com/lcbro/lcbro/actions/workflows/release.yml)
  [![Nightly Tests](https://github.com/lcbro/lcbro/actions/workflows/nightly.yml/badge.svg)](https://github.com/lcbro/lcbro/actions/workflows/nightly.yml)
  
  <br />
  
  ⚡ **Lightning Fast** • 🎯 **Zero Config** • 🚀 **Production Ready**
  
  <br />
  
</div>

LCBro is a powerful MCP server for browser automation with support for both Playwright and Chrome DevTools Protocol (CDP). It provides intelligent preprocessing, comprehensive logging, and remote browser management capabilities.

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 **Browser Automation**
- Real browser control with JavaScript execution
- Login flows, clicks, text input, form handling
- Screenshot capture and content extraction
- Session management with persistent contexts

### 🤖 **Intelligent Preprocessing** 
- Auto-generates preprocessing prompts
- Local LLM integration (Ollama, JAN)
- Smart content analysis and optimization
- Cost-efficient data preparation

</td>
<td width="50%">

### 🔧 **Multiple Engines**
- **Playwright**: Full-featured automation
- **CDP**: Chrome DevTools Protocol support
- Remote browser connections
- Auto-detection and fallback

### 📊 **Advanced Logging**
- Comprehensive LLM interaction logs
- Performance metrics and token tracking
- Configurable log rotation and compression
- Debug and monitoring capabilities

</td>
</tr>
</table>

## 🚀 Quick Start

### Use with npx (Recommended - No Installation)
```bash
# Use directly without installation
npx lcbro

# With custom configuration
npx lcbro --config /path/to/config.yaml --port 3000
```

### Global Installation
```bash
# Install globally via npm
npm install -g lcbro

# Start the server
lcbro
```

### Local Development
```bash
# Clone and install
git clone https://github.com/lcbro/lcbro.git
cd lcbro
npm install
npm run build
npm start
```

### Docker
```bash
# Run with Docker
docker run -p 3000:3000 lcbro:latest
```

## 💡 Usage Examples

### Basic Browser Automation
```bash
# Navigate and extract content
npx lcbro navigate --url "https://example.com"
npx lcbro extract --format text
```

### With Custom Configuration
```bash
# Enable CDP support
npx lcbro --cdp-enabled --port 3001

# Custom logging directory
npx lcbro --logs-dir "/custom/logs" --log-level debug
```

### MCP Client Integration
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

## 📋 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Chrome/Chromium browser (for CDP support)

### Global Installation (Recommended)
```bash
# Install globally
npm install -g lcbro

# Verify installation
lcbro --version
```

### Local Development
```bash
# Clone repository
git clone https://github.com/lcbro/lcbro.git
cd lcbro

# Install dependencies
npm install

# Build project
npm run build

# Install Playwright browsers
npm run install:browsers
```

## ⚙️ Configuration

LCBro uses YAML configuration files with CLI overrides. Create a `config/default.yaml` file or use CLI options:

### Basic Configuration
```yaml
server:
  host: "localhost"
  port: 3000

browser:
  engine: playwright  # playwright | cdp
  headless: true
  defaultTimeoutMs: 30000
  maxContexts: 8
  storageDir: /data/profiles

llm:
  defaultModel: "ollama:llama3.1"
  maxOutputTokens: 2000
  temperature: 0
  host: "localhost"
  port: 11434
  janPort: 1337
  autoPreprocess: true

security:
  allowDomains: ["example.com", "gov.br"]
  blockPrivateNetworks: true
```

### CLI Configuration Overrides
```bash
# Server settings
lcbro --port 3001 --host 0.0.0.0

# CDP browser support
lcbro --cdp-enabled --cdp-port 9222

# Remote CDP server
lcbro --remote-url https://cdp.example.com:9222 --remote-ssl-mode enabled

# Logging configuration
lcbro --log-level debug --logs-dir /tmp/lcbro-logs
```

## 🖥️ CLI Usage

LCBro provides a comprehensive command-line interface:

### Main Commands
```bash
# Start the server
lcbro

# Show help
lcbro --help

# Show current configuration
lcbro config

# Launch browsers with CDP
lcbro browser:launch -b chrome -p 9222

# Manage log files
lcbro logs --command summary

# Test remote CDP connection
lcbro test:remote -u https://cdp.example.com:9222
```

## 🔧 Environment Variables

LCBro supports configuration via environment variables:

### LLM Configuration
```bash
# Local LLMs (Recommended)

#### Ollama (free, no API keys required)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.1

# Configure LCBro
export LLM_HOST=localhost
export LLM_PORT=11434
export LLM_DEFAULT_MODEL=ollama:llama3.1
```

#### JAN AI (free, with optional API key)
```bash
# Configure LCBro for JAN AI
export LLM_HOST=localhost
export LLM_JAN_PORT=1337
export LLM_DEFAULT_MODEL=jan:llama-3.1-8b
```

### External LLM APIs (Optional)
```bash
# OpenAI
export OPENAI_API_KEY=your_api_key_here

# Anthropic
export ANTHROPIC_API_KEY=your_api_key_here
```

### CDP Browser Configuration
```bash
# Enable CDP support
export BROWSER_ENGINE=cdp

# CDP server settings
export CDP_HOST=localhost
export CDP_PORT=9222

# Remote CDP server
export CDP_REMOTE_URL=https://cdp.example.com:9222
export CDP_REMOTE_SSL_MODE=enabled
export CDP_REMOTE_API_KEY=your_api_key

## 🚀 Usage

### Starting the Server
```bash
# Start with default configuration
lcbro

# Start with specific port
lcbro --port 3001

# Start with CDP support
lcbro --cdp-enabled

# Start with custom config file
lcbro --config /path/to/config.yaml
```

### MCP Client Integration
```bash
# Claude Desktop configuration
# Add to ~/.claude/claude_desktop_config.json:
{
  "mcpServers": {
    "lcbro": {
      "command": "npx",
      "args": ["-y", "lcbro"]
    }
  }
}

# Cursor IDE configuration
# Add to ~/.cursor/mcp.json:
{
  "mcpServers": {
    "lcbro": {
      "command": "npx",
      "args": ["-y", "lcbro"]
    }
  }
}

# With CDP support
{
  "mcpServers": {
    "lcbro": {
      "command": "npx",
      "args": ["-y", "lcbro", "--cdp-enabled"]
    }
  }
}

# With custom configuration
{
  "mcpServers": {
    "lcbro": {
      "command": "npx",
      "args": ["-y", "lcbro", "--config", "/path/to/config.yaml"]
    }
  }
}

## 🛠️ Advanced Features

### Intelligent Preprocessing
LCBro automatically cleans and optimizes data before sending to LLMs:

```bash
# Enable intelligent preprocessing
lcbro --auto-preprocess

# Configure preprocessing thresholds
lcbro --preprocessing-threshold-html 5000
lcbro --preprocessing-threshold-text 8000
```

### CDP Browser Management
```bash
# Launch browsers with CDP
lcbro browser:launch -b chrome -p 9222 -n 3

# Connect to remote CDP server
lcbro --remote-url https://cdp.example.com:9222

# Test remote connection
lcbro test:remote -u https://cdp.example.com:9222
```

### Log Management
```bash
# View log summary
lcbro logs --command summary

# Clean old logs
lcbro logs --command cleanup --age 30

# Compress log files
lcbro logs --command compress
```

## 📚 Documentation

- **[Intelligent Preprocessing](docs/INTELLIGENT_PREPROCESSING.md)** - Automatic data cleaning and optimization
- **[LLM Logging Guide](docs/LLM_LOGGING_GUIDE.md)** - Comprehensive logging system
- **[CDP Browser Support](docs/CDP_BROWSER_SUPPORT.md)** - Chrome DevTools Protocol integration
- **[Remote CDP Support](docs/REMOTE_CDP_SUPPORT.md)** - Remote browser management
- **[Logs Directory Configuration](docs/LOGS_DIRECTORY_CONFIGURATION.md)** - Log management setup

## 🎯 MCP Tools Available

LCBro provides the following MCP tools:

### Navigation Tools
- `navigate_open` - Open a new URL in a browser context
- `navigate_goto` - Navigate to a URL in an existing context

### Interaction Tools  
- `interact_click` - Click on elements by selector, text, or role
- `interact_type` - Type text into input fields
- `interact_wait` - Wait for conditions (selector, network idle, URL change)

### Extraction Tools
- `extract_content` - Extract page content in various formats
- `extract_table` - Extract table data as JSON
- `extract_attributes` - Extract attributes from elements
- `extract_screenshot` - Take screenshots of pages or elements

### Session Tools
- `session_auth` - Perform authentication sequences
- `session_manage` - Manage browser sessions and contexts

### LLM Tools
- `llm_transform` - Transform data using LLM with custom instructions
- `llm_analyze` - Analyze content with LLM preprocessing

## 🏆 Project Status

✅ **Production Ready** - All features implemented and tested  
✅ **npm Package Ready** - Can be installed globally via npm  
✅ **CLI Interface** - Full command-line interface available  
✅ **Documentation** - Comprehensive documentation provided  
✅ **Multi-language Support** - English, Russian, Portuguese  
✅ **Zero Breaking Changes** - All original functionality preserved  
✅ **Continuous Integration** - Automated testing and deployment  
✅ **Docker Support** - Multi-stage builds and container testing  
✅ **Security Scanning** - Automated vulnerability detection  

## 🚀 Quick Start

### Option 1: Use with npx (Recommended - No Installation Required)
```bash
# Use directly without installation
npx lcbro --help

# Start server
npx lcbro

# With CDP support
npx lcbro --cdp-enabled
```

### Option 2: Global Installation
```bash
# Install globally
npm install -g lcbro

# Verify installation
lcbro --version

# Start server
lcbro
```

### Configure MCP Client
```json
// Claude Desktop: ~/.claude/claude_desktop_config.json
{
  "mcpServers": {
    "lcbro": {
      "command": "npx",
      "args": ["-y", "lcbro"]
    }
  }
}

// Cursor IDE: ~/.cursor/mcp.json
{
  "mcpServers": {
    "lcbro": {
      "command": "npx",
      "args": ["-y", "lcbro"]
    }
  }
}
```

## 📊 Performance & Specifications

- **Package Size**: 147.7 kB compressed, 759.7 kB unpacked
- **Startup Time**: < 2 seconds
- **Memory Usage**: < 100 MB typical
- **Concurrent Sessions**: Up to 8 browser contexts
- **Supported Browsers**: Chrome, Chromium, Edge (CDP), Playwright browsers
- **Node.js**: 18.x, 20.x, 22.x
- **Operating Systems**: Windows, macOS, Linux

## 🔧 CI/CD Pipeline Status

**Automated Testing & Deployment** 🚀

| Pipeline | Status | Description |
|----------|--------|-------------|
| **CI/CD** | [![CI/CD Pipeline](https://github.com/lcbro/lcbro/actions/workflows/ci.yml/badge.svg)](https://github.com/lcbro/lcbro/actions/workflows/ci.yml) | Main build, test, and deployment pipeline |
| **Docker** | [![Docker Testing](https://github.com/lcbro/lcbro/actions/workflows/docker.yml/badge.svg)](https://github.com/lcbro/lcbro/actions/workflows/docker.yml) | Container builds and multi-platform testing |
| **Release** | [![Release](https://github.com/lcbro/lcbro/actions/workflows/release.yml/badge.svg)](https://github.com/lcbro/lcbro/actions/workflows/release.yml) | Automated release and npm publishing |
| **Nightly** | [![Nightly Tests](https://github.com/lcbro/lcbro/actions/workflows/nightly.yml/badge.svg)](https://github.com/lcbro/lcbro/actions/workflows/nightly.yml) | Extended tests and performance benchmarks |

### 📊 Quality Metrics
- **Test Coverage**: >80% (Unit + E2E)
- **Build Time**: ~3-5 minutes  
- **Docker Build**: Multi-stage with layer caching
- **Security**: CodeQL analysis + dependency scanning

[📋 View all workflows →](.github/WORKFLOWS.md) | [🚀 View pipeline runs →](https://github.com/lcbro/lcbro/actions)

## 🛠️ Development

### Prerequisites
```bash
npm install
npm run install:browsers
```

### Build & Test
```bash
# Build the project
npm run build

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Run CI pipeline locally
make ci
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support & Community

<div align="center">

[![GitHub Issues](https://img.shields.io/github/issues/lcbro/lcbro?style=for-the-badge&logo=github)](https://github.com/lcbro/lcbro/issues)
[![GitHub Stars](https://img.shields.io/github/stars/lcbro/lcbro?style=for-the-badge&logo=github)](https://github.com/lcbro/lcbro/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/lcbro/lcbro?style=for-the-badge&logo=github)](https://github.com/lcbro/lcbro/forks)

</div>

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/lcbro/lcbro/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/lcbro/lcbro/discussions)
- 📚 **Documentation**: [Full Documentation](docs/)
- 💡 **Examples**: [Usage Examples](examples/)
- 🔧 **CI/CD Workflows**: [Workflows Documentation](.github/WORKFLOWS.md)
- 🚀 **Pipeline Status**: [GitHub Actions](https://github.com/lcbro/lcbro/actions)
- 🛡️ **Security Reports**: [Security Tab](https://github.com/lcbro/lcbro/security)
- ⭐ **Star Us**: Help us grow by starring the repository!

## 🙏 Acknowledgments

- **Playwright** - Browser automation framework
- **Chrome DevTools Protocol** - Remote browser debugging
- **MCP SDK** - Model Context Protocol framework
- **Claude Desktop** - MCP client integration
- **Cursor IDE** - Development environment

---

<div align="center">

**Made with ❤️ by the LCBro Team**

**LCBro** - Low Cost Browser Remote Operations  
**Version**: 1.0.7 • **Status**: ✅ Production Ready • **License**: MIT

[⬆ Back to Top](#lcbro)

</div>
```
