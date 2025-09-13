import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { z } from 'zod';

// Configuration schema
const ConfigSchema = z.object({
  browser: z.object({
    engine: z.literal('playwright').default('playwright'),
    headless: z.boolean().default(true),
    defaultTimeoutMs: z.number().default(30000),
    storageDir: z.string().default('/data/profiles'),
    maxContexts: z.number().default(8)
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
    autoPreprocess: z.boolean().default(true)
  }),
  limits: z.object({
    maxChars: z.number().default(300000),
    maxScreenshotBytes: z.number().default(8000000)
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info')
  })
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(configPath?: string): Config {
  const defaultConfig = ConfigSchema.parse({});
  
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
