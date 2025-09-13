import { z } from 'zod';

// Input data schema
export const LLMInputDataSchema = z.object({
  kind: z.enum(['text', 'html', 'json']),
  data: z.string()
});
export type LLMInputData = z.infer<typeof LLMInputDataSchema>;

// JSON Schema for output validation
export const JSONSchemaSchema = z.object({
  type: z.string(),
  properties: z.record(z.unknown()).optional(),
  required: z.array(z.string()).optional(),
  items: z.unknown().optional()
});
export type JSONSchema = z.infer<typeof JSONSchemaSchema>;

// LLM Transform Input Schema
export const LLMTransformInputSchema = z.object({
  input: LLMInputDataSchema,
  instruction: z.string().min(1),
  model: z.string().default('gpt-4o-mini'),
  maxOutputTokens: z.number().min(100).max(4000).default(2000),
  systemPrompt: z.string().default('You are a helpful assistant that processes data according to instructions and returns valid JSON.'),
  temperature: z.number().min(0).max(2).default(0),
  schema: JSONSchemaSchema.optional(),
  preprocessRequest: z.string().optional()
});
export type LLMTransformInput = z.infer<typeof LLMTransformInputSchema>;

// LLM Transform Output Schema
export const LLMTransformOutputSchema = z.object({
  status: z.literal('ok'),
  result: z.unknown(),
  raw: z.string().optional(),
  model: z.string(),
  tokensUsed: z.object({
    prompt: z.number(),
    completion: z.number(),
    total: z.number()
  }).optional()
});
export type LLMTransformOutput = z.infer<typeof LLMTransformOutputSchema>;
