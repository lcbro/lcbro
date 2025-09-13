# Low Cost Browsing MCP Server

с

## Features

- **Browser Automation**: Control real browsers with JavaScript execution, login, clicks, typing
- **Content Extraction**: Extract text, HTML, tables, attributes, and screenshots
- **Session Management**: Persistent browser sessions with authentication flows
- **LLM Integration**: Transform and clean extracted data using various LLM providers
- **Multiple Providers**: Support for OpenAI, Anthropic, Ollama, and JAN AI
- **IDE Integration**: Works with Claude Desktop and Cursor IDE

## Installation

```bash
npm install
npm run build
npm run install:browsers
```

## Configuration

Create a `config/default.yaml` file or set `CONFIG_PATH` environment variable:

```yaml
browser:
  headless: true
  maxContexts: 8
  storageDir: /data/profiles
  defaultTimeoutMs: 30000

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

limits:
  maxChars: 300000
  maxScreenshotBytes: 8000000
```

## Environment Variables

### For Local LLMs (Recommended)

#### Ollama (free, no API keys required)
```yaml
llm:
  defaultModel: "ollama:llama3.1"  # or your model
  host: "localhost"                # Ollama server address
  port: 11434                     # Ollama port
```

#### JAN AI (free, with optional API key)
```yaml
llm:
  defaultModel: "jan:llama-3.1-8b"  # or your model in JAN
  host: "localhost"                 # JAN server address
  janPort: 1337                    # JAN port
```

For JAN, also configure environment variable if required:
```bash
JAN_API_KEY=your_jan_api_key_here
```

### For External LLM Providers (Optional)

Create `.env` file only if you want to use external APIs:

```bash
# JAN API Key (only if JAN requires authentication)
JAN_API_KEY=your_jan_api_key_here

# OpenAI API Key (only if you need GPT models)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Anthropic API Key (only if you need Claude models)  
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here

# Configuration file path (optional)
CONFIG_PATH=/path/to/config.yaml
```

### How to get API keys:

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key in format `sk-...`

**Anthropic:**
1. Go to https://console.anthropic.com/
2. Navigate to API Keys section
3. Create a new key in format `sk-ant-...`

**JAN AI:**
1. Download and install JAN from https://jan.ai/
2. Launch JAN and load a model
3. If API key is required, configure it in JAN Settings

**For Ollama and JAN (local models):**
API keys are usually not required, just configure `host`, `port` and `janPort` in configuration.

## Usage

### Quick Start

1. **Install dependencies:**
```bash
npm install
npm run install:browsers
```

2. **Configure LLM (choose one option):**

### Option A - Ollama (recommended, free)
```bash
# Make sure Ollama is running
ollama serve

# Check available models
ollama list

# Download model if needed
ollama pull llama3.1
```

Configure in `config/default.yaml`:
```yaml
llm:
  defaultModel: "ollama:llama3.1"  # your model from "ollama list"
  host: "localhost"                # or your server IP
  port: 11434                     # Ollama port
```

### Option B - JAN AI (free, graphical interface)
```bash
# 1. Download JAN AI from https://jan.ai/
# 2. Launch JAN
# 3. Load model through interface
# 4. Enable API Server in Settings
```

Configure in `config/default.yaml`:
```yaml
llm:
  defaultModel: "jan:llama-3.1-8b"  # model name in JAN
  host: "localhost"                 # or JAN server IP
  janPort: 1337                    # JAN API Server port
```

If JAN requires API key, add to `.env`:
```bash
echo "JAN_API_KEY=your_jan_key" > .env
```

### Option C - External APIs (paid)
```bash
# Create .env file with keys
cp env.example .env
nano .env  # add your API keys
```

3. **Build project:**
```bash
npm run build
```

4. **Start server:**
```bash
npm start
```

### Configuration for Claude Desktop

1. **Find Claude Desktop configuration file:**
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

2. **Add MCP server configuration:**

**Important:** Replace `/path/to/your` with the actual absolute path to your project.

To find the full path, run in project root:
```bash
pwd
# Example output: /Users/username/projects/mcp_servers/low_cost_browsing
```

### Claude Desktop Configuration Examples:

**For Ollama (no API keys):**
```json
{
  "mcpServers": {
    "lc-browser-mcp": {
      "command": "node",
      "args": ["/path/to/your/mcp_servers/low_cost_browsing/dist/index.js"]
    }
  }
}
```

**For JAN AI (with API key):**
```json
{
  "mcpServers": {
    "lc-browser-mcp": {
      "command": "node",
      "args": ["/path/to/your/mcp_servers/low_cost_browsing/dist/index.js"],
      "env": {
        "JAN_API_KEY": "your_jan_api_key_here"
      }
    }
  }
}
```

**For external APIs (OpenAI/Anthropic):**
```json
{
  "mcpServers": {
    "lc-browser-mcp": {
      "command": "node", 
      "args": ["/path/to/your/mcp_servers/low_cost_browsing/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your_openai_key_here",
        "ANTHROPIC_API_KEY": "sk-ant-your_anthropic_key_here"
      }
    }
  }
}
```

**Combined configuration (all providers):**
```json
{
  "mcpServers": {
    "lc-browser-mcp": {
      "command": "node",
      "args": ["/path/to/your/mcp_servers/low_cost_browsing/dist/index.js"],
      "env": {
        "JAN_API_KEY": "your_jan_key",
        "OPENAI_API_KEY": "sk-your_openai_key", 
        "ANTHROPIC_API_KEY": "sk-ant-your_anthropic_key"
      }
    }
  }
}
```

3. **Restart Claude Desktop**

### Configuration for Cursor IDE

1. **Find Cursor configuration file:**
   - **macOS:** `~/Library/Application Support/Cursor/User/settings.json`
   - **Windows:** `%APPDATA%\Cursor\User\settings.json`
   - **Linux:** `~/.config/Cursor/User/settings.json`

   Or use the ready-made `cursor-mcp-config.json` file from the project.

2. **Find the full project path:**
```bash
pwd
# Example: /Users/username/projects/mcp_servers/low_cost_browsing
```

3. **Add MCP server to settings.json (replace paths with yours):**

**For Ollama (no API keys):**
```json
{
  "mcp": {
    "servers": {
      "lc-browser-mcp": {
        "command": "node",
        "args": ["/path/to/your/mcp_servers/low_cost_browsing/dist/index.js"],
        "cwd": "/path/to/your/mcp_servers/low_cost_browsing"
      }
    }
  }
}
```

**For JAN AI (with API key):**
```json
{
  "mcp": {
    "servers": {
      "lc-browser-mcp": {
        "command": "node",
        "args": ["/path/to/your/mcp_servers/low_cost_browsing/dist/index.js"],
        "cwd": "/path/to/your/mcp_servers/low_cost_browsing",
        "env": {
          "JAN_API_KEY": "your_jan_api_key_here"
        }
      }
    }
  }
}
```

**For external APIs:**
```json
{
  "mcp": {
    "servers": {
      "lc-browser-mcp": {
        "command": "node",
        "args": ["/path/to/your/mcp_servers/low_cost_browsing/dist/index.js"],
        "cwd": "/path/to/your/mcp_servers/low_cost_browsing",
        "env": {
          "OPENAI_API_KEY": "sk-your_openai_key_here",
          "ANTHROPIC_API_KEY": "sk-ant-your_anthropic_key_here",
          "JAN_API_KEY": "your_jan_key"
        }
      }
    }
  }
}
```

4. **Restart Cursor**

5. **Activate MCP in chat:**
   - Open AI chat in Cursor (`Cmd/Ctrl + L`)
   - Use `@lc-browser-mcp` to access browsing tools

### Testing

After setup, new tools will appear in Claude Desktop or Cursor. You can test them:

**In Claude Desktop:**
```
Can you open example.com and extract the page title?
```

**In Cursor IDE:**
```
@lc-browser-mcp open example.com and extract the page title
```

AI should respond something like:
> Of course! I'll open example.com and extract the page title.

And execute navigate.open and extract.content commands.

### Available Tools

1. **navigate.open** - Open URL and create page context
2. **navigate.goto** - Navigate to URL in existing context
3. **interact.click** - Click elements by CSS/text/role
4. **interact.type** - Type text into input fields
5. **interact.wait** - Wait for conditions
6. **extract.content** - Extract page content (text/html/markdown)
7. **extract.table** - Extract tables as JSON
8. **extract.attributes** - Extract element attributes
9. **extract.screenshot** - Take screenshots
10. **session.auth** - Perform authentication sequences
11. **llm.transform** - Transform data using LLM with custom instructions, JSON schema validation and optional preprocessing

### Example: Extract Table from Website

```typescript
// 1. Open page
const openResult = await mcp.callTool('navigate.open', {
  url: 'https://example.com/data',
  persistSessionKey: 'my-session'
});

// 2. Wait for table to load
await mcp.callTool('interact.wait', {
  pageId: openResult.pageId,
  for: 'selector',
  selector: 'table.data'
});

// 3. Extract table
const tableResult = await mcp.callTool('extract.table', {
  pageId: openResult.pageId,
  tableCss: 'table.data',
  headerStrategy: 'auto'
});

// 4. Transform with LLM (with optional preprocessing)
const cleanResult = await mcp.callTool('llm.transform', {
  input: {
    kind: 'json',
    data: JSON.stringify(tableResult.tables[0])
  },
  instruction: 'Extract only the most important fields and standardize the data format',
  model: 'gpt-4o-mini',
  preprocessRequest: 'Remove any empty or null values, normalize text fields, and ensure consistent date formats'
});
```

### Automatic Preprocessing

**What is it?**

Automatic preprocessing is an intelligent system that analyzes incoming data and automatically cleans it before main processing through LLM. It's a two-stage process:

1. **Preprocessing stage** (automatic) — local LLM cleans and prepares data
2. **Main processing stage** — target LLM processes already cleaned data

**Why is it needed?**

🎯 **Token and cost savings** — expensive APIs (OpenAI, Anthropic) receive already cleaned data  
📊 **Better quality results** — LLM works with clean, structured data  
⚡ **Automation** — no need to manually plan data cleaning  
🔧 **Smart adaptation** — system understands what needs to be cleaned based on data type and task  

**How does it work?**

```
Raw data → [Local LLM cleans] → Clean data → [Target LLM processes] → Result
     ↓              ↓                ↓              ↓
HTML with ads   Removes navigation,   Product content   Extracts JSON
and navigation  ads, scripts         only              structure
```

The system automatically determines when preprocessing is needed:

**Automatically enabled for:**
- HTML content > 5000 characters
- Text > 3000 characters  
- JSON arrays > 10 elements
- JSON objects > 20 fields
- Instructions with keywords: "clean", "extract", "parse", "standardize", "normalize"

**Examples of automatic processing:**

📄 **HTML content** — system removes:
- Navigation menus and sidebars
- Advertisement blocks and banners  
- JavaScript code and CSS styles
- Comments and service information
- Focuses on main article/product content

📝 **Text data** — system fixes:
- Typos and grammar errors
- Multiple spaces and line breaks
- Duplicate sentences
- Illogical paragraph arrangement

📊 **JSON data** — system standardizes:
- Removes null and empty values
- Brings field names to unified style
- Converts dates to YYYY-MM-DD format
- Normalizes numeric values and currencies
- Merges duplicate records

**Smart task adaptation:**

The system analyzes your instruction and adapts preprocessing:

- "extract **table**" → preserves table structures
- "find **products**" → focuses on product cards  
- "get **article**" → preserves main article text
- "structure **data**" → normalizes formats

**Configuring automatic preprocessing:**

```yaml
# config/default.yaml
llm:
  autoPreprocess: true   # enable automatic preprocessing (default)
  autoPreprocess: false  # disable automatic preprocessing
```

**Comparison: with and without preprocessing**

❌ **Without preprocessing:**
```
Input data: HTML page (50KB) with ads, menus, scripts
                ↓
Result: LLM tries to find products among ads and navigation
        → Low quality, many errors, expensive (many tokens)
```

✅ **With automatic preprocessing:**
```
Input data: HTML page (50KB) with ads, menus, scripts
                ↓
Preprocessing: Local LLM removes ads, keeps only products (5KB)
                ↓ 
Main processing: Target LLM structures clean product data
                ↓
Result: High quality, fast, economical
```

**Cost savings example:**
- Processing 50KB HTML through GPT-4: ~$0.50
- With preprocessing: ~$0.05 (local cleaning) + ~$0.05 (GPT-4 for 5KB) = ~$0.10
- **Savings: 80%** + better result quality!

### Instructions for Cursor IDE

**Simple request (automatic preprocessing):**
```
@lc-browser-mcp extract products from this HTML page and structure into JSON
```

**With explicit preprocessing:**
```
@lc-browser-mcp use llm.transform with:
- input: extracted HTML
- instruction: "create product catalog in JSON"
- preprocessRequest: "remove menus, ads, keep only product cards"
- model: "ollama:llama3.1"
```

**For table extraction and cleaning:**
```
@lc-browser-mcp:
1. Open data page
2. Extract table
3. Use llm.transform for cleaning with preprocessRequest: "remove empty rows, standardize dates to YYYY-MM-DD"
```

### Preprocessing Usage Examples

**HTML cleaning before analysis:**
```typescript
const result = await mcp.callTool('llm.transform', {
  input: {
    kind: 'html',
    data: extractedHTML
  },
  instruction: 'Extract product information as JSON',
  model: 'ollama:llama3.1',
  preprocessRequest: 'Remove all HTML tags, navigation menus, advertisements, and keep only the main product content'
});
```

**Text normalization before structuring:**
```typescript
const result = await mcp.callTool('llm.transform', {
  input: {
    kind: 'text',
    data: messyText
  },
  instruction: 'Create a structured summary of the article',
  model: 'jan:llama-3.1-8b',
  preprocessRequest: 'Fix typos, normalize whitespace, remove duplicate sentences, and organize paragraphs logically'
});
```

**Table data cleaning:**
```typescript
const result = await mcp.callTool('llm.transform', {
  input: {
    kind: 'json',
    data: JSON.stringify(tableData)
  },
  instruction: 'Convert to standardized format with specific field names',
  model: 'gpt-4o-mini',
  preprocessRequest: 'Remove empty rows, merge duplicate entries, standardize date formats (YYYY-MM-DD), and normalize currency values'
});
```

### Practical Scenarios for Cursor

**Scenario 1: E-commerce product analysis**
```
@lc-browser-mcp open https://shop.example.com/catalog
Extract product information and clean data through preprocessing to remove ad blocks
```

**Scenario 2: News parsing**
```
@lc-browser-mcp:
1. Open news website
2. Extract articles with automatic cleaning from ads and navigation
3. Structure into JSON with fields: title, date, summary
```

**Scenario 3: Legal document processing**
```
@lc-browser-mcp extract process table from court portal
Use automatic preprocessing to standardize dates and case numbers
```

## Development

```bash
npm run dev          # Start in development mode
npm run dev:watch    # Start with auto-reload
npm test             # Run tests
```

## Error Codes

- `nav_timeout` - Navigation timeout
- `selector_not_found` - Element not found
- `captcha_required` - CAPTCHA detected
- `dom_too_large` - Content exceeds size limits
- `llm_failed` - LLM processing error
- `page_not_found` - Invalid page ID
- `internal_error` - General server error

## Documentation Languages

This project supports multiple languages:

- **English** (current): [README.md](README.md)
- **Russian**: [README.ru.md](README.ru.md) 
- **Portuguese**: [README.pt.md](README.pt.md)
- **Language Navigation**: [README.languages.md](README.languages.md)

### Configuration Files by Language

**English (default):**
- `example-mcp-config.json` - Claude Desktop configuration
- `cursor-mcp-config.json` - Cursor IDE configuration  
- `env.example` - Environment variables template

**Portuguese:**
- `example-mcp-config.pt.json` - Configuração Claude Desktop
- `cursor-mcp-config.pt.json` - Configuração Cursor IDE
- `env.pt.example` - Modelo de variáveis de ambiente

## Contributing

We welcome contributions to the Low Cost Browsing MCP Server! Here's how you can help:

### 🚀 How to Contribute

1. **Fork the Repository**
   ```bash
   # Click the "Fork" button on GitHub or use GitHub CLI
   gh repo fork nightweb/low_cost_browsing
   ```

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/low_cost_browsing.git
   cd low_cost_browsing
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

4. **Make Your Changes**
   - Write clean, well-documented code
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

5. **Test Your Changes**
   ```bash
   # Run local tests
   npm test
   npm run build
   
   # Run Docker tests
   make test-unit
   make test-e2e
   ```

6. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   # or
   git commit -m "fix: describe your bug fix"
   ```

7. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template with:
     - Clear description of changes
     - Link to any related issues
     - Screenshots if applicable
     - Testing instructions

### 📋 Pull Request Guidelines

**Before submitting:**
- ✅ Code builds without errors (`npm run build`)
- ✅ All tests pass (`npm test`)
- ✅ Docker tests work (`make test-unit`)
- ✅ Code follows project conventions
- ✅ Documentation is updated
- ✅ Commit messages are descriptive

**PR Requirements:**
- Clear, descriptive title
- Detailed description of changes
- Reference to related issues (`Fixes #123`)
- Add reviewers if you know who should review
- Use labels: `bug`, `feature`, `documentation`, etc.

**Review Process:**
1. Automated tests run via GitHub Actions
2. Code review by maintainers
3. Address any requested changes
4. Final approval and merge

### 🐛 Reporting Issues

Found a bug? Please create an issue with:
- **Clear title** describing the problem
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Node.js version, etc.)
- **Screenshots** if applicable
- **Error logs** if available

### 💡 Feature Requests

Have an idea? Create an issue with:
- **Clear description** of the feature
- **Use case** - why is this needed?
- **Proposed solution** if you have one
- **Alternative solutions** you've considered

### 🏗️ Development Setup

1. **Prerequisites**
   ```bash
   node --version  # >= 18
   npm --version   # >= 8
   docker --version # for testing
   ```

2. **Install Dependencies**
   ```bash
   npm install
   npm run install:browsers
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your settings
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

### 🧪 Testing

```bash
# Unit tests
npm test
npm run test:watch
npm run test:coverage

# E2E tests  
npm run test:e2e
npm run test:e2e:ui

# Docker tests
make test-unit
make test-e2e
make test-all

# CI tests
./scripts/ci-test.sh
```

### 📖 Documentation

Help improve our documentation:
- Fix typos and grammar
- Add missing examples
- Improve API documentation
- Translate to other languages
- Add tutorials and guides

### 🤝 Code of Conduct

- Be respectful and inclusive
- Help others learn and grow
- Focus on constructive feedback
- Follow GitHub's community guidelines

### 📞 Getting Help

- 📖 **Documentation**: Check existing docs first
- 🐛 **Issues**: Search existing issues
- 💬 **Discussions**: Use GitHub Discussions for questions
- 📧 **Contact**: Reach out to maintainers

Thank you for contributing to Low Cost Browsing MCP Server! 🎉

## License

MIT
