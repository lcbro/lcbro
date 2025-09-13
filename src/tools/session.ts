import { Logger } from 'pino';
import { BrowserManager } from '../core/browser-manager.js';
import { SessionAuthInput, SessionAuthOutput, SessionAction } from '../types/session.js';
import { ErrorResponse } from '../types/index.js';

export class SessionTools {
  constructor(
    private browserManager: BrowserManager,
    private logger: Logger
  ) {}

  async auth(params: SessionAuthInput): Promise<SessionAuthOutput | ErrorResponse> {
    const startTime = Date.now();
    this.logger.info({ 
      pageId: params.pageId, 
      totalSteps: params.steps.length 
    }, 'Starting authentication process');

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
      let stepsCompleted = 0;

      for (let i = 0; i < params.steps.length; i++) {
        const step = params.steps[i];
        const stepStartTime = Date.now();
        
        this.logger.info({ 
          pageId: params.pageId, 
          stepIndex: i, 
          action: step.action 
        }, `Executing step ${i + 1}/${params.steps.length}`);

        try {
          await this.executeStep(page, step, params.timeoutMs);
          stepsCompleted++;
          
          const stepDuration = Date.now() - stepStartTime;
          this.logger.info({ 
            pageId: params.pageId, 
            stepIndex: i, 
            action: step.action,
            duration: stepDuration 
          }, `Step ${i + 1} completed`);

        } catch (stepError) {
          const stepDuration = Date.now() - stepStartTime;
          this.logger.error({ 
            pageId: params.pageId, 
            stepIndex: i, 
            action: step.action,
            error: stepError instanceof Error ? stepError.message : String(stepError),
            duration: stepDuration 
          }, `Step ${i + 1} failed`);

          // Return error with progress information
          return {
            status: 'error',
            code: this.getStepErrorCode(stepError),
            message: `Authentication failed at step ${i + 1}: ${stepError instanceof Error ? stepError.message : String(stepError)}`,
            details: { 
              pageId: params.pageId, 
              stepIndex: i, 
              stepsCompleted,
              totalSteps: params.steps.length,
              failedStep: step
            }
          };
        }
      }

      const duration = Date.now() - startTime;
      this.logger.info({ 
        pageId: params.pageId, 
        stepsCompleted,
        duration 
      }, 'Authentication process completed successfully');

      return {
        status: 'ok',
        stepsCompleted,
        totalSteps: params.steps.length
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error({ 
        pageId: params.pageId,
        error: error instanceof Error ? error.message : String(error),
        duration 
      }, 'Authentication process failed');

      return {
        status: 'error',
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error during authentication',
        details: { pageId: params.pageId }
      };
    }
  }

  private async executeStep(page: any, step: SessionAction, timeoutMs: number): Promise<void> {
    switch (step.action) {
      case 'type':
        const inputLocator = page.locator(step.css);
        await inputLocator.waitFor({ state: 'visible', timeout: timeoutMs });
        await inputLocator.clear();
        await inputLocator.type(step.text, { timeout: timeoutMs });
        break;

      case 'click':
        const clickLocator = page.locator(step.css);
        await clickLocator.waitFor({ state: 'visible', timeout: timeoutMs });
        await clickLocator.click({ timeout: timeoutMs });
        break;

      case 'wait':
        if (step.for === 'url' && step.urlIncludes) {
          await page.waitForURL((url: string) => url.includes(step.urlIncludes!), {
            timeout: timeoutMs
          });
        } else if (step.for === 'selector' && step.selector) {
          await page.waitForSelector(step.selector, { timeout: timeoutMs });
        }
        break;

      default:
        throw new Error(`Unknown action: ${(step as any).action}`);
    }

    // Small delay between steps to allow for page updates
    await page.waitForTimeout(500);
  }

  private getStepErrorCode(error: unknown): 'selector_not_found' | 'nav_timeout' | 'captcha_required' | 'internal_error' {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('timeout')) {
        return 'nav_timeout';
      }
      
      if (message.includes('not found') || message.includes('selector')) {
        return 'selector_not_found';
      }
      
      if (message.includes('captcha') || message.includes('verification')) {
        return 'captcha_required';
      }
    }
    
    return 'internal_error';
  }
}
