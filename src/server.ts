import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Logger } from 'pino';

import { BrowserManager } from './core/browser-manager.js';
import { LLMProviderManager } from './core/llm-provider.js';
import { NavigationTools } from './tools/navigation.js';
import { InteractionTools } from './tools/interaction.js';
import { ExtractionTools } from './tools/extraction.js';
import { SessionTools } from './tools/session.js';
import { LLMTools } from './tools/llm.js';
import { Config } from './utils/config.js';
import { createLogger, createAdvancedLogger } from './utils/logger.js';

// Input validation schemas
import { NavigateOpenInputSchema, NavigateGotoInputSchema } from './types/navigation.js';
import { InteractClickInputSchema, InteractTypeInputSchema, InteractWaitInputSchema } from './types/interaction.js';
import { ExtractContentInputSchema, ExtractTableInputSchema, ExtractAttributesInputSchema, ExtractScreenshotInputSchema } from './types/extraction.js';
import { SessionAuthInputSchema } from './types/session.js';
import { LLMTransformInputSchema } from './types/llm.js';

// Graceful shutdown handling for performance logging
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, logging final performance summary...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, logging final performance summary...');
  process.exit(0);
});

export class MCPBrowserServer {
  private server: Server;
  private logger: Logger;
  private browserManager: BrowserManager;
  private llmManager: LLMProviderManager;
  
  // Tool instances
  private navigationTools: NavigationTools;
  private interactionTools: InteractionTools;
  private extractionTools: ExtractionTools;
  private sessionTools: SessionTools;
  private llmTools: LLMTools;

  constructor(private config: Config) {
    // Use advanced logger if file logging is enabled
    if (config.logging.files.enabled) {
      this.logger = createLogger(config);
    } else {
      this.logger = createLogger({ level: config.logging.level });
    }
    this.server = new Server(
      {
        name: 'lc-browser-mcp-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize core components
    this.browserManager = new BrowserManager(
      {
        headless: config.browser.headless,
        maxContexts: config.browser.maxContexts,
        storageDir: config.browser.storageDir,
        defaultTimeoutMs: config.browser.defaultTimeoutMs,
        cdp: config.browser.cdp
      },
      this.logger
    );

    this.llmManager = new LLMProviderManager(this.logger, {
      host: config.llm.host,
      port: config.llm.port,
      janPort: config.llm.janPort
    });

    // Initialize tool instances
    this.navigationTools = new NavigationTools(this.browserManager, this.logger);
    this.interactionTools = new InteractionTools(this.browserManager, this.logger);
    this.extractionTools = new ExtractionTools(this.browserManager, this.logger);
    this.sessionTools = new SessionTools(this.browserManager, this.logger);
    this.llmTools = new LLMTools(this.llmManager, this.logger, { 
      autoPreprocess: config.llm.autoPreprocess,
      preprocessing: config.llm.preprocessing,
      logging: config.logging
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'navigate.open',
            description: 'Open a URL and create a new page context',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to open' },
                timeoutMs: { type: 'number', description: 'Timeout in milliseconds (optional)' }
              },
              required: ['url']
            }
          },
          {
            name: 'navigate.goto',
            description: 'Navigate to a URL in an existing page context',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to navigate to' },
                pageId: { type: 'string', description: 'Page context ID' },
                timeoutMs: { type: 'number', description: 'Timeout in milliseconds (optional)' }
              },
              required: ['url', 'pageId']
            }
          },
          {
            name: 'interact.click',
            description: 'Click on an element using CSS selector, text, or role',
            inputSchema: {
              type: 'object',
              properties: {
                pageId: { type: 'string', description: 'Page context ID' },
                selector: { type: 'string', description: 'CSS selector (optional)' },
                text: { type: 'string', description: 'Text content to find (optional)' },
                role: { type: 'string', description: 'ARIA role to find (optional)' },
                timeout: { type: 'number', description: 'Timeout in milliseconds (optional)' }
              },
              required: ['pageId']
            }
          },
          {
            name: 'interact.type',
            description: 'Type text into an input field',
            inputSchema: {
              type: 'object',
              properties: {
                pageId: { type: 'string', description: 'Page context ID' },
                selector: { type: 'string', description: 'CSS selector for input field' },
                text: { type: 'string', description: 'Text to type' },
                delay: { type: 'number', description: 'Delay between keystrokes in ms (optional)' }
              },
              required: ['pageId', 'selector', 'text']
            }
          },
          {
            name: 'interact.wait',
            description: 'Wait for a condition (selector, network idle, or URL change)',
            inputSchema: {
              type: 'object',
              properties: {
                pageId: { type: 'string', description: 'Page context ID' },
                condition: { 
                  type: 'string', 
                  enum: ['selector', 'networkidle', 'url'],
                  description: 'Wait condition type' 
                },
                selector: { type: 'string', description: 'CSS selector to wait for (if condition is selector)' },
                url: { type: 'string', description: 'URL pattern to wait for (if condition is url)' },
                timeout: { type: 'number', description: 'Timeout in milliseconds (optional)' }
              },
              required: ['pageId', 'condition']
            }
          },
          {
            name: 'extract.content',
            description: 'Extract page content in various formats (text, html, markdown, readability)',
            inputSchema: {
              type: 'object',
              properties: {
                pageId: { type: 'string', description: 'Page context ID' },
                format: { 
                  type: 'string', 
                  enum: ['text', 'html', 'markdown', 'readability'],
                  description: 'Output format' 
                },
                selector: { type: 'string', description: 'CSS selector to extract from (optional)' }
              },
              required: ['pageId', 'format']
            }
          },
          {
            name: 'extract.table',
            description: 'Extract table data as JSON',
            inputSchema: {
              type: 'object',
              properties: {
                pageId: { type: 'string', description: 'Page context ID' },
                selector: { type: 'string', description: 'CSS selector for table (optional)' },
                includeHeaders: { type: 'boolean', description: 'Include table headers (optional)' }
              },
              required: ['pageId']
            }
          },
          {
            name: 'extract.attributes',
            description: 'Extract attributes from elements matching CSS selectors',
            inputSchema: {
              type: 'object',
              properties: {
                pageId: { type: 'string', description: 'Page context ID' },
                selector: { type: 'string', description: 'CSS selector' },
                attributes: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'List of attributes to extract' 
                }
              },
              required: ['pageId', 'selector', 'attributes']
            }
          },
          {
            name: 'extract.screenshot',
            description: 'Take a screenshot of the page or a specific area',
            inputSchema: {
              type: 'object',
              properties: {
                pageId: { type: 'string', description: 'Page context ID' },
                selector: { type: 'string', description: 'CSS selector for specific area (optional)' },
                fullPage: { type: 'boolean', description: 'Take full page screenshot (optional)' },
                format: { 
                  type: 'string', 
                  enum: ['png', 'jpeg'],
                  description: 'Image format (optional)' 
                }
              },
              required: ['pageId']
            }
          },
          {
            name: 'session.auth',
            description: 'Perform authentication by executing a sequence of actions',
            inputSchema: {
              type: 'object',
              properties: {
                pageId: { type: 'string', description: 'Page context ID' },
                actions: { 
                  type: 'array',
                  items: { type: 'object' },
                  description: 'Sequence of authentication actions' 
                }
              },
              required: ['pageId', 'actions']
            }
          },
          {
            name: 'llm.transform',
            description: 'Transform data using LLM with custom instructions and JSON schema validation',
            inputSchema: {
              type: 'object',
              properties: {
                input: { 
                  type: 'object',
                  properties: {
                    kind: { type: 'string', enum: ['text', 'html', 'json'], description: 'Type of input data' },
                    data: { type: 'string', description: 'Input data content' }
                  },
                  required: ['kind', 'data'],
                  description: 'Input data to transform'
                },
                instruction: { type: 'string', description: 'Transformation instructions' },
                outputSchema: { type: 'object', description: 'Expected output JSON schema (optional)' },
                model: { type: 'string', description: 'LLM model to use (optional)' },
                preprocessRequest: { type: 'string', description: 'Preprocessing instructions (optional)' }
              },
              required: ['input', 'instruction']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        this.logger.info({ tool: name, args }, 'Tool call received');

        switch (name) {
          case 'navigate.open': {
            const params = NavigateOpenInputSchema.parse(args);
            const result = await this.navigationTools.open(params);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          case 'navigate.goto': {
            const params = NavigateGotoInputSchema.parse(args);
            const result = await this.navigationTools.goto(params);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          case 'interact.click': {
            const params = InteractClickInputSchema.parse(args);
            const result = await this.interactionTools.click(params);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          case 'interact.type': {
            const params = InteractTypeInputSchema.parse(args);
            const result = await this.interactionTools.type(params);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          case 'interact.wait': {
            const params = InteractWaitInputSchema.parse(args);
            const result = await this.interactionTools.wait(params);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          case 'extract.content': {
            const params = ExtractContentInputSchema.parse(args);
            const result = await this.extractionTools.content(params);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          case 'extract.table': {
            const params = ExtractTableInputSchema.parse(args);
            const result = await this.extractionTools.table(params);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          case 'extract.attributes': {
            const params = ExtractAttributesInputSchema.parse(args);
            const result = await this.extractionTools.attributes(params);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          case 'extract.screenshot': {
            const params = ExtractScreenshotInputSchema.parse(args);
            const result = await this.extractionTools.screenshot(params);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          case 'session.auth': {
            const params = SessionAuthInputSchema.parse(args);
            const result = await this.sessionTools.auth(params);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          case 'llm.transform': {
            const params = LLMTransformInputSchema.parse(args);
            const result = await this.llmTools.transform(params);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error({ tool: name, error }, 'Tool call failed');
        
        const errorResponse = {
          status: 'error',
          code: 'internal_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: { tool: name }
        };
        
        return { content: [{ type: 'text', text: JSON.stringify(errorResponse) }] };
      }
    });
  }

  async start() {
    // Initialize browser
    await this.browserManager.initialize();
    
    // Start MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    this.logger.info('MCP Browser Server started');

    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  async stop(): Promise<void> {
    await this.browserManager.cleanup();
    // MCP server cleanup is handled by the SDK
  }

  private async shutdown() {
    this.logger.info('Shutting down server...');
    
    try {
      await this.browserManager.cleanup();
    } catch (error) {
      this.logger.error({ error }, 'Error during browser cleanup');
    }
    
    process.exit(0);
  }
}
