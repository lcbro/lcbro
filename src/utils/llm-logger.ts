import { Logger } from 'pino';
import { Config } from './config.js';

export interface LLMRequestLog {
  timestamp: string;
  operationId: string;
  operationType: 'main' | 'preprocessing' | 'analysis';
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  inputDataLength?: number;
  inputDataType?: string;
  instruction?: string;
  preprocessRequest?: string;
  startTime: number;
}

export interface LLMResponseLog {
  timestamp: string;
  operationId: string;
  operationType: 'main' | 'preprocessing' | 'analysis';
  model: string;
  content: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  duration: number;
  success: boolean;
  error?: string;
}

export interface LLMPerformanceMetrics {
  totalOperations: number;
  totalTokensUsed: number;
  totalCost: number;
  averageResponseTime: number;
  preprocessingStats: {
    count: number;
    avgReduction: number;
    avgTime: number;
  };
  modelStats: Record<string, {
    count: number;
    avgTokens: number;
    avgTime: number;
    totalCost: number;
  }>;
}

export class LLMLogger {
  private operationCounter = 0;
  private metrics: LLMPerformanceMetrics = {
    totalOperations: 0,
    totalTokensUsed: 0,
    totalCost: 0,
    averageResponseTime: 0,
    preprocessingStats: {
      count: 0,
      avgReduction: 0,
      avgTime: 0
    },
    modelStats: {}
  };

  constructor(
    private logger: Logger,
    private config: Config
  ) {}

  /**
   * Creates a new operation ID for tracking
   */
  private createOperationId(): string {
    return `op_${Date.now()}_${++this.operationCounter}`;
  }

  /**
   * Logs an LLM request with detailed information
   */
  logRequest(
    operationType: 'main' | 'preprocessing' | 'analysis',
    model: string,
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number,
    temperature: number,
    additionalData?: {
      inputDataLength?: number;
      inputDataType?: string;
      instruction?: string;
      preprocessRequest?: string;
    }
  ): string {
    const operationId = this.createOperationId();
    const timestamp = new Date().toISOString();

    if (!this.config.logging.llm.enabled || !this.config.logging.llm.logPrompts) {
      return operationId;
    }

    const logData: LLMRequestLog = {
      timestamp,
      operationId,
      operationType,
      model,
      systemPrompt: this.truncateText(systemPrompt, this.config.logging.llm.maxPromptLength),
      userPrompt: this.truncateText(userPrompt, this.config.logging.llm.maxPromptLength),
      maxTokens,
      temperature,
      inputDataLength: additionalData?.inputDataLength,
      inputDataType: additionalData?.inputDataType,
      instruction: additionalData?.instruction,
      preprocessRequest: additionalData?.preprocessRequest,
      startTime: Date.now()
    };

    this.logger.info(logData, `LLM Request [${operationType.toUpperCase()}]`);

    return operationId;
  }

  /**
   * Logs an LLM response with performance metrics
   */
  logResponse(
    operationId: string,
    operationType: 'main' | 'preprocessing' | 'analysis',
    model: string,
    content: string,
    tokensUsed: { prompt: number; completion: number; total: number } | undefined,
    startTime: number,
    success: boolean = true,
    error?: string
  ): void {
    const timestamp = new Date().toISOString();
    const duration = Date.now() - startTime;

    if (!this.config.logging.llm.enabled) {
      return;
    }

    const logData: LLMResponseLog = {
      timestamp,
      operationId,
      operationType,
      model,
      content: this.truncateText(content, this.config.logging.llm.maxResponseLength),
      tokensUsed,
      duration,
      success,
      error
    };

    if (success) {
      this.logger.info(logData, `LLM Response [${operationType.toUpperCase()}]`);
    } else {
      this.logger.error(logData, `LLM Error [${operationType.toUpperCase()}]`);
    }

    // Update metrics
    this.updateMetrics(operationType, model, tokensUsed, duration);

    // Log performance metrics periodically
    if (this.config.logging.llm.trackMetrics && 
        this.metrics.totalOperations % this.config.logging.llm.metricsInterval === 0) {
      this.logPerformanceMetrics();
    }
  }

  /**
   * Logs preprocessing analysis and results
   */
  logPreprocessingAnalysis(
    inputData: string,
    instruction: string,
    analysisResponse: string,
    preprocessRequest: string,
    originalLength: number,
    processedLength: number,
    analysisDuration: number,
    preprocessingDuration: number
  ): void {
    if (!this.config.logging.llm.enabled || !this.config.logging.llm.logPreprocessing) {
      return;
    }

    const logData = {
      timestamp: new Date().toISOString(),
      inputData: this.truncateText(inputData, this.config.logging.llm.maxInputDataLength),
      instruction,
      analysisResponse: this.truncateText(analysisResponse, this.config.logging.llm.maxResponseLength),
      generatedPreprocessRequest: preprocessRequest,
      originalLength,
      processedLength,
      reductionPercentage: ((originalLength - processedLength) / originalLength * 100).toFixed(2),
      analysisDuration,
      preprocessingDuration,
      totalDuration: analysisDuration + preprocessingDuration
    };

    this.logger.info(logData, 'Preprocessing Analysis & Results');

    // Update preprocessing metrics
    this.metrics.preprocessingStats.count++;
    this.metrics.preprocessingStats.avgReduction = 
      (this.metrics.preprocessingStats.avgReduction * (this.metrics.preprocessingStats.count - 1) + 
       parseFloat(logData.reductionPercentage)) / this.metrics.preprocessingStats.count;
    this.metrics.preprocessingStats.avgTime = 
      (this.metrics.preprocessingStats.avgTime * (this.metrics.preprocessingStats.count - 1) + 
       logData.totalDuration) / this.metrics.preprocessingStats.count;
  }

  /**
   * Logs detailed preprocessing comparison
   */
  logPreprocessingComparison(
    operationId: string,
    originalInput: string,
    processedInput: string,
    preprocessRequest: string,
    originalTokens: number,
    processedTokens: number,
    costSaved: number
  ): void {
    if (!this.config.logging.llm.enabled || !this.config.logging.llm.logPreprocessing) {
      return;
    }

    const logData = {
      timestamp: new Date().toISOString(),
      operationId,
      originalInput: this.truncateText(originalInput, this.config.logging.llm.maxInputDataLength),
      processedInput: this.truncateText(processedInput, this.config.logging.llm.maxInputDataLength),
      preprocessRequest,
      originalTokens,
      processedTokens,
      tokenReduction: originalTokens - processedTokens,
      tokenReductionPercentage: ((originalTokens - processedTokens) / originalTokens * 100).toFixed(2),
      estimatedCostSaved: costSaved.toFixed(4)
    };

    this.logger.info(logData, 'Preprocessing Cost Analysis');
  }

  /**
   * Updates internal performance metrics
   */
  private updateMetrics(
    operationType: 'main' | 'preprocessing' | 'analysis',
    model: string,
    tokensUsed: { prompt: number; completion: number; total: number } | undefined,
    duration: number
  ): void {
    this.metrics.totalOperations++;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalOperations - 1) + duration) / this.metrics.totalOperations;

    if (tokensUsed) {
      this.metrics.totalTokensUsed += tokensUsed.total;
      
      // Estimate cost (rough approximation for different models)
      const estimatedCost = this.estimateCost(model, tokensUsed);
      this.metrics.totalCost += estimatedCost;

      // Update model-specific stats
      if (!this.metrics.modelStats[model]) {
        this.metrics.modelStats[model] = {
          count: 0,
          avgTokens: 0,
          avgTime: 0,
          totalCost: 0
        };
      }

      const modelStats = this.metrics.modelStats[model];
      modelStats.count++;
      modelStats.avgTokens = (modelStats.avgTokens * (modelStats.count - 1) + tokensUsed.total) / modelStats.count;
      modelStats.avgTime = (modelStats.avgTime * (modelStats.count - 1) + duration) / modelStats.count;
      modelStats.totalCost += estimatedCost;
    }
  }

  /**
   * Estimates cost based on model and token usage
   */
  private estimateCost(model: string, tokensUsed: { prompt: number; completion: number; total: number }): number {
    // Rough cost estimates per 1K tokens (as of 2024)
    const costs: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
      'default': { input: 0.002, output: 0.002 } // Default for local models
    };

    const modelKey = Object.keys(costs).find(key => model.includes(key)) || 'default';
    const cost = costs[modelKey];
    
    const inputCost = (tokensUsed.prompt / 1000) * cost.input;
    const outputCost = (tokensUsed.completion / 1000) * cost.output;
    
    return inputCost + outputCost;
  }

  /**
   * Logs current performance metrics
   */
  private logPerformanceMetrics(): void {
    if (!this.config.logging.llm.logPerformance) {
      return;
    }

    this.logger.info({
      timestamp: new Date().toISOString(),
      metrics: this.metrics
    }, 'LLM Performance Metrics Summary');
  }

  /**
   * Logs final performance summary
   */
  logPerformanceSummary(): void {
    if (!this.config.logging.llm.logPerformance) {
      return;
    }

    this.logger.info({
      timestamp: new Date().toISOString(),
      finalMetrics: this.metrics,
      summary: {
        totalOperations: this.metrics.totalOperations,
        totalTokensUsed: this.metrics.totalTokensUsed,
        estimatedTotalCost: this.metrics.totalCost.toFixed(4),
        averageResponseTime: Math.round(this.metrics.averageResponseTime),
        preprocessingEffectiveness: {
          operations: this.metrics.preprocessingStats.count,
          avgReduction: `${this.metrics.preprocessingStats.avgReduction.toFixed(2)}%`,
          avgTime: Math.round(this.metrics.preprocessingStats.avgTime)
        },
        modelUsage: Object.entries(this.metrics.modelStats).map(([model, stats]) => ({
          model,
          operations: stats.count,
          avgTokens: Math.round(stats.avgTokens),
          avgTime: Math.round(stats.avgTime),
          totalCost: stats.totalCost.toFixed(4)
        }))
      }
    }, 'Final LLM Performance Summary');
  }

  /**
   * Truncates text to specified length for logging
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength) + `... [truncated, original length: ${text.length}]`;
  }

  /**
   * Gets current metrics for external access
   */
  getMetrics(): LLMPerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Resets metrics (useful for testing or periodic resets)
   */
  resetMetrics(): void {
    this.metrics = {
      totalOperations: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      averageResponseTime: 0,
      preprocessingStats: {
        count: 0,
        avgReduction: 0,
        avgTime: 0
      },
      modelStats: {}
    };
    this.operationCounter = 0;
  }
}
