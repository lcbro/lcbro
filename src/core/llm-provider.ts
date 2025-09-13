import { Logger } from 'pino';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

export interface LLMResponse {
  content: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  model: string;
}

export abstract class LLMProvider {
  constructor(protected logger: Logger) {}
  
  abstract isSupported(model: string): boolean;
  abstract generate(request: LLMRequest): Promise<LLMResponse>;
}

export class OpenAIProvider extends LLMProvider {
  private client: OpenAI;

  constructor(logger: Logger, apiKey?: string) {
    super(logger);
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    });
  }

  isSupported(model: string): boolean {
    return model.startsWith('gpt-') || model.startsWith('o1-');
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt }
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature
      });

      const content = response.choices[0]?.message?.content || '';
      const usage = response.usage;

      return {
        content,
        tokensUsed: usage ? {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens
        } : undefined
      };
    } catch (error) {
      this.logger.error({ error, model: request.model }, 'OpenAI API call failed');
      throw error;
    }
  }
}

export class AnthropicProvider extends LLMProvider {
  private client: Anthropic;

  constructor(logger: Logger, apiKey?: string) {
    super(logger);
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });
  }

  isSupported(model: string): boolean {
    return model.startsWith('claude-');
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await this.client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        system: request.systemPrompt,
        messages: [
          { role: 'user', content: request.userPrompt }
        ]
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const usage = response.usage;

      return {
        content,
        tokensUsed: usage ? {
          prompt: usage.input_tokens,
          completion: usage.output_tokens,
          total: usage.input_tokens + usage.output_tokens
        } : undefined
      };
    } catch (error) {
      this.logger.error({ error, model: request.model }, 'Anthropic API call failed');
      throw error;
    }
  }
}

export class OllamaProvider extends LLMProvider {
  private baseUrl: string;

  constructor(logger: Logger, host: string = 'localhost', port: number = 11434) {
    super(logger);
    this.baseUrl = `http://${host}:${port}`;
  }

  isSupported(model: string): boolean {
    return model.startsWith('ollama:');
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
      const modelName = request.model.replace('ollama:', '');
      
      const payload = {
        model: modelName,
        prompt: `${request.systemPrompt}\n\nUser: ${request.userPrompt}\n\nAssistant:`,
        stream: false,
        options: {
          temperature: request.temperature,
          num_predict: request.maxTokens
        }
      };

      const response = await axios.post(`${this.baseUrl}/api/generate`, payload, {
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' }
      });

      const content = response.data.response || '';

      return {
        content,
        // Ollama doesn't always provide token counts
        tokensUsed: undefined
      };
    } catch (error) {
      this.logger.error({ error, model: request.model }, 'Ollama API call failed');
      throw error;
    }
  }
}

export class JANProvider extends LLMProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(logger: Logger, host: string = 'localhost', port: number = 1337, apiKey?: string) {
    super(logger);
    this.baseUrl = `http://${host}:${port}`;
    this.apiKey = apiKey || process.env.JAN_API_KEY || '';
  }

  isSupported(model: string): boolean {
    return model.startsWith('jan:');
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
      const modelName = request.model.replace('jan:', '');
      
      const payload = {
        model: modelName,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt }
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: false
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await axios.post(`${this.baseUrl}/v1/chat/completions`, payload, {
        timeout: 60000,
        headers
      });

      const content = response.data.choices?.[0]?.message?.content || '';
      const usage = response.data.usage;

      return {
        content,
        tokensUsed: usage ? {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens
        } : undefined
      };
    } catch (error) {
      this.logger.error({ error, model: request.model }, 'JAN API call failed');
      throw error;
    }
  }
}

export class LLMProviderManager {
  private providers: LLMProvider[] = [];

  constructor(private logger: Logger, config?: { host?: string; port?: number; janPort?: number }) {
    // Initialize providers based on available API keys
    if (process.env.OPENAI_API_KEY) {
      this.providers.push(new OpenAIProvider(logger));
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.push(new AnthropicProvider(logger));
    }
    
    // Always add Ollama provider (might be running locally)
    this.providers.push(new OllamaProvider(logger, config?.host, config?.port));

    // Add JAN provider if API key is available or if custom port is specified
    if (process.env.JAN_API_KEY || config?.janPort) {
      this.providers.push(new JANProvider(logger, config?.host, config?.janPort || 1337));
    }
  }

  getProvider(model: string): LLMProvider {
    const provider = this.providers.find(p => p.isSupported(model));
    if (!provider) {
      throw new Error(`No provider available for model: ${model}`);
    }
    return provider;
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const provider = this.getProvider(request.model);
    return provider.generate(request);
  }
}
