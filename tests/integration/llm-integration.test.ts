import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { LLMTools } from '../../src/tools/llm.js';
import { LLMProviderManager } from '../../src/core/llm-provider.js';

// These tests require actual LLM providers to be configured
// They should be run with real API keys or local models

describe('LLM Integration Tests', () => {
  let llmTools: LLMTools;
  let llmManager: LLMProviderManager;

  beforeEach(() => {
    llmManager = new LLMProviderManager('localhost', 11434, 1337);
    llmTools = new LLMTools(llmManager, { autoPreprocess: true });
  });

  // Skip if no LLM providers available
  const skipIfNoProviders = () => {
    const hasOllama = process.env.OLLAMA_AVAILABLE === 'true';
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    
    if (!hasOllama && !hasOpenAI && !hasAnthropic) {
      return it.skip;
    }
    return it;
  };

  describe('Text Processing', () => {
    skipIfNoProviders()('should extract structured data from text', async () => {
      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'John Doe is 30 years old and works as a Software Engineer at Tech Corp. His email is john@techcorp.com.'
        },
        instruction: 'Extract person information in JSON format with fields: name, age, job_title, company, email',
        model: 'ollama:llama3.1', // Use available model
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            job_title: { type: 'string' },
            company: { type: 'string' },
            email: { type: 'string' }
          },
          required: ['name', 'age', 'job_title', 'company', 'email']
        }
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toMatchObject({
          name: expect.stringContaining('John'),
          age: expect.any(Number),
          job_title: expect.stringContaining('Engineer'),
          company: expect.stringContaining('Tech'),
          email: expect.stringContaining('@')
        });
      }
    }, 30000);

    skipIfNoProviders()('should clean and process HTML content', async () => {
      const htmlContent = `
        <html>
          <head><title>Test Page</title></head>
          <body>
            <nav>Navigation menu</nav>
            <div class="ads">Advertisement</div>
            <main>
              <h1>Important Article</h1>
              <p>This is the main content that we want to extract.</p>
              <p>It contains valuable information.</p>
            </main>
            <footer>Footer content</footer>
          </body>
        </html>
      `;

      const result = await llmTools.llmTransform({
        input: {
          kind: 'html',
          data: htmlContent
        },
        instruction: 'Extract the main article content as clean text, removing navigation, ads, and footer',
        model: 'ollama:llama3.1'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const output = typeof result.data.output === 'string' 
          ? result.data.output 
          : JSON.stringify(result.data.output);
        
        expect(output).toContain('Important Article');
        expect(output).toContain('main content');
        expect(output).not.toContain('Navigation menu');
        expect(output).not.toContain('Advertisement');
      }
    }, 30000);
  });

  describe('Preprocessing Integration', () => {
    skipIfNoProviders()('should automatically preprocess large content', async () => {
      const largeHtmlContent = `
        <html><body>
          ${'<div class="ad">Advertisement</div>'.repeat(50)}
          <article>
            <h1>Main Article Title</h1>
            <p>This is the important content we want to keep.</p>
          </article>
          ${'<div class="sidebar">Sidebar content</div>'.repeat(30)}
        </body></html>
      `;

      const result = await llmTools.llmTransform({
        input: {
          kind: 'html',
          data: largeHtmlContent
        },
        instruction: 'Extract the article title and content',
        model: 'ollama:llama3.1'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const output = typeof result.data.output === 'string' 
          ? result.data.output 
          : JSON.stringify(result.data.output);
        
        expect(output).toContain('Main Article');
        expect(output).toContain('important content');
      }
    }, 45000);

    skipIfNoProviders()('should use explicit preprocessing', async () => {
      const result = await llmTools.llmTransform({
        input: {
          kind: 'text',
          data: 'This   has   multiple   spaces    and\n\n\nextra\n\nlinebreaks.'
        },
        instruction: 'Convert to proper formatted text',
        model: 'ollama:llama3.1',
        preprocessRequest: 'Clean up extra spaces and normalize line breaks'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const output = typeof result.data.output === 'string' 
          ? result.data.output 
          : JSON.stringify(result.data.output);
        
        expect(output).not.toContain('   '); // Multiple spaces should be cleaned
      }
    }, 30000);
  });

  describe('JSON Data Processing', () => {
    skipIfNoProviders()('should structure and validate JSON output', async () => {
      const messyData = {
        items: [
          { name: 'Product 1', price: '19.99', category: 'electronics' },
          { name: '', price: null, category: 'books' }, // Empty/null values
          { name: 'Product 3', price: '29.99', category: 'electronics' }
        ]
      };

      const result = await llmTools.llmTransform({
        input: {
          kind: 'json',
          data: JSON.stringify(messyData)
        },
        instruction: 'Clean the data: remove items with empty names or null prices, standardize price format',
        model: 'ollama:llama3.1',
        schema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                  category: { type: 'string' }
                },
                required: ['name', 'price', 'category']
              }
            }
          }
        }
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toHaveProperty('items');
        const items = (result.data.output as any).items;
        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBe(2); // Should have removed the invalid item
        items.forEach((item: any) => {
          expect(item.name).toBeTruthy();
          expect(typeof item.price).toBe('number');
          expect(item.category).toBeTruthy();
        });
      }
    }, 30000);
  });
});
