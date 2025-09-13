import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { z } from 'zod';

// Configuration schema
const ConfigSchema = z.object({
  browser: z.object({
    engine: z.enum(['playwright', 'cdp']).default('playwright'),
    headless: z.boolean().default(true),
    defaultTimeoutMs: z.number().default(30000),
    storageDir: z.string().default('/data/profiles'),
    maxContexts: z.number().default(8),
    cdp: z.object({
      enabled: z.boolean().default(false),
      host: z.string().default('localhost'),
      port: z.number().default(9222),
      autoDetect: z.boolean().default(true),
      maxRetries: z.number().default(3),
      retryDelay: z.number().default(1000),
      remote: z.object({
        enabled: z.boolean().default(false),
        url: z.string().nullable().default(null),
        sslMode: z.enum(['auto', 'enabled', 'disabled', 'insecure']).default('auto'),
        apiKey: z.string().nullable().default(null),
        headers: z.record(z.string()).default({})
      }).default({}),
      detection: z.object({
        enabled: z.boolean().default(true),
        ports: z.array(z.number()).default([9222, 9223, 9224, 9225, 9226]),
        timeout: z.number().default(5000),
        useRemote: z.boolean().default(false)
      }).default({}),
      launch: z.object({
        autoLaunch: z.boolean().default(false),
        browserPath: z.string().nullable().default(null),
        userDataDir: z.string().nullable().default(null),
        additionalArgs: z.array(z.string()).default([])
      }).default({}),
      connection: z.object({
        timeout: z.number().default(30000),
        keepAlive: z.boolean().default(true),
        reconnect: z.boolean().default(true),
        maxReconnects: z.number().default(5)
      }).default({})
    }).default({})
  }),
  network: z.object({
    proxyDefault: z.string().nullable().default(null)
  }),
  security: z.object({
    allowDomains: z.array(z.string()).default([]),
    blockPrivateNetworks: z.boolean().default(true)
  }),
  llm: z.object({
    defaultModel: z.string().default('gpt-4o-mini'),
    maxOutputTokens: z.number().default(2000),
    temperature: z.number().default(0),
    host: z.string().default('localhost'),
    port: z.number().default(11434),
    janPort: z.number().default(1337),
    autoPreprocess: z.boolean().default(true),
    preprocessing: z.object({
      enabled: z.boolean().default(true),
      intelligentMode: z.boolean().default(true),
      fallbackToTemplates: z.boolean().default(true),
      thresholds: z.object({
        html: z.number().default(3000),
        text: z.number().default(5000),
        json: z.number().default(1000)
      }),
      preferredModels: z.array(z.string()).default([
        'ollama:qwen2.5:7b',
        'ollama:llama3.2:3b', 
        'ollama:mistral:7b',
        'ollama:llama3.1:8b',
        'jan:llama-3.2-3b',
        'jan:mistral-7b'
      ]),
      analysis: z.object({
        maxContentSample: z.number().default(1000),
        maxAnalysisTokens: z.number().default(300),
        analysisTemperature: z.number().default(0.1)
      })
    }).default({})
  }),
  limits: z.object({
    maxChars: z.number().default(300000),
    maxScreenshotBytes: z.number().default(8000000)
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    llm: z.object({
      enabled: z.boolean().default(true),
      logPrompts: z.boolean().default(true),
      logResponses: z.boolean().default(true),
      logTokens: z.boolean().default(true),
      logPerformance: z.boolean().default(true),
      logPreprocessing: z.boolean().default(true),
      maxPromptLength: z.number().default(2000),
      maxResponseLength: z.number().default(1000),
      maxInputDataLength: z.number().default(5000),
      trackMetrics: z.boolean().default(true),
      metricsInterval: z.number().default(100)
    }).default({})
  })
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(configPath?: string): Config {
  const defaultConfig = ConfigSchema.parse({
    browser: {},
    network: {},
    security: {},
    llm: {},
    limits: {},
    logging: {}
  });
  
  if (!configPath) {
    return defaultConfig;
  }

  try {
    const configFile = readFileSync(configPath, 'utf8');
    const yamlConfig = parse(configFile);
    return ConfigSchema.parse({ ...defaultConfig, ...yamlConfig });
  } catch (error) {
    console.warn(`Failed to load config from ${configPath}:`, error);
    return defaultConfig;
  }
}
