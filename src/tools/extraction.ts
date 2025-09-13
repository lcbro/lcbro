import { Logger } from 'pino';
import { BrowserManager } from '../core/browser-manager.js';
import {
  ExtractContentInput,
  ExtractContentOutput,
  ExtractTableInput,
  ExtractTableOutput,
  ExtractAttributesInput,
  ExtractAttributesOutput,
  ExtractScreenshotInput,
  ExtractScreenshotOutput,
  Table
} from '../types/extraction.js';
import { ErrorResponse } from '../types/index.js';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export class ExtractionTools {
  constructor(
    private browserManager: BrowserManager,
    private logger: Logger
  ) {}

  async content(params: ExtractContentInput): Promise<ExtractContentOutput | ErrorResponse> {
    const startTime = Date.now();
    this.logger.info({ pageId: params.pageId, mode: params.mode }, 'Extracting content');

    try {
      const pageInfo = this.browserManager.getPage(params.pageId);
      if (!pageInfo) {
        return {
          status: 'error',
          code: 'page_not_found',
          message: 'Page not found',
          details: { pageId: params.pageId }
        };
      }

      const page = pageInfo.page;
      let content: string;

      switch (params.mode) {
        case 'text':
          if (params.scopeCss) {
            const element = await page.locator(params.scopeCss).first();
            content = await element.textContent() || '';
          } else {
            content = await page.textContent('body') || '';
          }
          break;

        case 'html':
          if (params.scopeCss) {
            const element = await page.locator(params.scopeCss).first();
            content = await element.innerHTML() || '';
          } else {
            content = await page.innerHTML('body') || '';
          }
          break;

        case 'markdown':
          // Simple HTML to Markdown conversion
          let htmlContent: string;
          if (params.scopeCss) {
            const element = await page.locator(params.scopeCss).first();
            htmlContent = await element.innerHTML() || '';
          } else {
            htmlContent = await page.innerHTML('body') || '';
          }
          content = this.htmlToMarkdown(htmlContent);
          break;

        case 'readability':
          const fullHTML = await page.content();
          content = this.extractWithReadability(fullHTML, page.url());
          break;

        default:
          return {
            status: 'error',
            code: 'invalid_params',
            message: `Unsupported mode: ${params.mode}`,
            details: { mode: params.mode }
          };
      }

      // Apply character limit
      if (content.length > params.maxChars) {
        content = content.substring(0, params.maxChars);
        this.logger.warn({ 
          pageId: params.pageId, 
          originalLength: content.length,
          truncatedTo: params.maxChars 
        }, 'Content truncated due to size limit');
      }

      const meta = {
        url: page.url(),
        title: await page.title(),
        ts: new Date().toISOString()
      };

      const duration = Date.now() - startTime;
      this.logger.info({ 
        pageId: params.pageId, 
        mode: params.mode,
        contentLength: content.length,
        duration 
      }, 'Content extracted');

      return {
        status: 'ok',
        content,
        meta
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error({ 
        pageId: params.pageId,
        mode: params.mode,
        error: error instanceof Error ? error.message : String(error),
        duration 
      }, 'Content extraction failed');

      return {
        status: 'error',
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error during content extraction',
        details: { pageId: params.pageId, mode: params.mode }
      };
    }
  }

  async table(params: ExtractTableInput): Promise<ExtractTableOutput | ErrorResponse> {
    const startTime = Date.now();
    this.logger.info({ pageId: params.pageId, tableCss: params.tableCss }, 'Extracting tables');

    try {
      const pageInfo = this.browserManager.getPage(params.pageId);
      if (!pageInfo) {
        return {
          status: 'error',
          code: 'page_not_found',
          message: 'Page not found',
          details: { pageId: params.pageId }
        };
      }

      const page = pageInfo.page;
      const tables: Table[] = [];

      // Find all table elements matching the CSS selector
      const tableElements = await page.locator(params.tableCss).all();
      
      for (let i = 0; i < Math.min(tableElements.length, params.limit); i++) {
        const tableElement = tableElements[i];
        
        try {
          const table = await this.extractTableData(tableElement, params.headerStrategy);
          if (table.headers.length > 0 || table.rows.length > 0) {
            tables.push(table);
          }
        } catch (tableError) {
          this.logger.warn({ 
            pageId: params.pageId, 
            tableIndex: i,
            error: tableError instanceof Error ? tableError.message : String(tableError)
          }, 'Failed to extract table data');
        }
      }

      const duration = Date.now() - startTime;
      this.logger.info({ 
        pageId: params.pageId, 
        tablesFound: tables.length,
        duration 
      }, 'Tables extracted');

      return {
        status: 'ok',
        tables
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error({ 
        pageId: params.pageId,
        error: error instanceof Error ? error.message : String(error),
        duration 
      }, 'Table extraction failed');

      return {
        status: 'error',
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error during table extraction',
        details: { pageId: params.pageId }
      };
    }
  }

  async attributes(params: ExtractAttributesInput): Promise<ExtractAttributesOutput | ErrorResponse> {
    const startTime = Date.now();
    this.logger.info({ pageId: params.pageId, queries: params.queries.length }, 'Extracting attributes');

    try {
      const pageInfo = this.browserManager.getPage(params.pageId);
      if (!pageInfo) {
        return {
          status: 'error',
          code: 'page_not_found',
          message: 'Page not found',
          details: { pageId: params.pageId }
        };
      }

      const page = pageInfo.page;
      const results: Array<Array<string | null>> = [];

      for (const query of params.queries) {
        try {
          const elements = await page.locator(query.css).all();
          const values: Array<string | null> = [];

          for (let i = 0; i < Math.min(elements.length, params.limitPerQuery); i++) {
            const element = elements[i];
            const value = await element.getAttribute(query.attr);
            values.push(value);
          }

          results.push(values);
        } catch (queryError) {
          this.logger.warn({ 
            pageId: params.pageId, 
            query,
            error: queryError instanceof Error ? queryError.message : String(queryError)
          }, 'Failed to extract attribute');
          results.push([]);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.info({ 
        pageId: params.pageId, 
        queriesProcessed: params.queries.length,
        duration 
      }, 'Attributes extracted');

      return {
        status: 'ok',
        results
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error({ 
        pageId: params.pageId,
        error: error instanceof Error ? error.message : String(error),
        duration 
      }, 'Attribute extraction failed');

      return {
        status: 'error',
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error during attribute extraction',
        details: { pageId: params.pageId }
      };
    }
  }

  async screenshot(params: ExtractScreenshotInput): Promise<ExtractScreenshotOutput | ErrorResponse> {
    const startTime = Date.now();
    this.logger.info({ pageId: params.pageId, fullPage: params.fullPage }, 'Taking screenshot');

    try {
      const pageInfo = this.browserManager.getPage(params.pageId);
      if (!pageInfo) {
        return {
          status: 'error',
          code: 'page_not_found',
          message: 'Page not found',
          details: { pageId: params.pageId }
        };
      }

      const page = pageInfo.page;
      const screenshotOptions: any = {
        type: params.format,
        fullPage: params.fullPage
      };

      if (params.format === 'jpeg') {
        screenshotOptions.quality = params.quality;
      }

      if (params.clip) {
        screenshotOptions.clip = params.clip;
        screenshotOptions.fullPage = false;
      }

      const buffer = await page.screenshot(screenshotOptions);
      const imageBase64 = buffer.toString('base64');

      // Check size limit (8MB default)
      const maxBytes = 8 * 1024 * 1024; // 8MB
      if (buffer.length > maxBytes) {
        return {
          status: 'error',
          code: 'dom_too_large',
          message: `Screenshot size (${buffer.length} bytes) exceeds limit (${maxBytes} bytes)`,
          details: { pageId: params.pageId, size: buffer.length, limit: maxBytes }
        };
      }

      const meta = {
        bytes: buffer.length,
        format: params.format,
        width: params.clip?.width,
        height: params.clip?.height
      };

      const duration = Date.now() - startTime;
      this.logger.info({ 
        pageId: params.pageId, 
        size: buffer.length,
        format: params.format,
        duration 
      }, 'Screenshot taken');

      return {
        status: 'ok',
        imageBase64,
        meta
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error({ 
        pageId: params.pageId,
        error: error instanceof Error ? error.message : String(error),
        duration 
      }, 'Screenshot failed');

      return {
        status: 'error',
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error during screenshot',
        details: { pageId: params.pageId }
      };
    }
  }

  private async extractTableData(tableElement: any, headerStrategy: string): Promise<Table> {
    const headers: string[] = [];
    const rows: string[][] = [];

    // Extract headers based on strategy
    switch (headerStrategy) {
      case 'th':
        const thElements = await tableElement.locator('th').all();
        for (const th of thElements) {
          const text = await th.textContent();
          headers.push(text?.trim() || '');
        }
        break;

      case 'firstRow':
        const firstRowCells = await tableElement.locator('tr').first().locator('td, th').all();
        for (const cell of firstRowCells) {
          const text = await cell.textContent();
          headers.push(text?.trim() || '');
        }
        break;

      case 'auto':
        // Try th first, then first row
        const thCount = await tableElement.locator('th').count();
        if (thCount > 0) {
          const thElements = await tableElement.locator('th').all();
          for (const th of thElements) {
            const text = await th.textContent();
            headers.push(text?.trim() || '');
          }
        } else {
          const firstRowCells = await tableElement.locator('tr').first().locator('td').all();
          for (const cell of firstRowCells) {
            const text = await cell.textContent();
            headers.push(text?.trim() || '');
          }
        }
        break;
    }

    // Extract data rows
    const dataRows = headerStrategy === 'firstRow' ? 
      await tableElement.locator('tr').nth(1).locator('xpath=following-sibling::tr').all() :
      await tableElement.locator('tr').all();

    for (const row of dataRows) {
      const cells = await row.locator('td').all();
      const rowData: string[] = [];
      
      for (const cell of cells) {
        const text = await cell.textContent();
        rowData.push(text?.trim() || '');
      }
      
      if (rowData.length > 0) {
        rows.push(rowData);
      }
    }

    return { headers, rows };
  }

  private htmlToMarkdown(html: string): string {
    // Basic HTML to Markdown conversion
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple newlines
      .trim();
  }

  private extractWithReadability(html: string, url: string): string {
    try {
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      return article?.textContent || '';
    } catch (error) {
      // Fallback to simple text extraction if Readability fails
      const dom = new JSDOM(html);
      return dom.window.document.body?.textContent || '';
    }
  }
}
