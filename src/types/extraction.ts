import { z } from 'zod';
import { PageIdSchema, PageMetaSchema } from './index.js';

// Extract Content Input Schema
export const ExtractContentInputSchema = z.object({
  pageId: PageIdSchema,
  mode: z.enum(['text', 'html', 'markdown', 'readability']).default('text'),
  scopeCss: z.string().optional(),
  maxChars: z.number().min(1000).max(1000000).default(200000)
});
export type ExtractContentInput = z.infer<typeof ExtractContentInputSchema>;

// Extract Content Output Schema
export const ExtractContentOutputSchema = z.object({
  status: z.literal('ok'),
  content: z.string(),
  meta: PageMetaSchema
});
export type ExtractContentOutput = z.infer<typeof ExtractContentOutputSchema>;

// Extract Table Input Schema
export const ExtractTableInputSchema = z.object({
  pageId: PageIdSchema,
  tableCss: z.string().optional().default('table'),
  headerStrategy: z.enum(['firstRow', 'th', 'auto']).default('auto'),
  limit: z.number().min(1).max(100).default(10)
});
export type ExtractTableInput = z.infer<typeof ExtractTableInputSchema>;

// Table data structure
export const TableSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string()))
});
export type Table = z.infer<typeof TableSchema>;

// Extract Table Output Schema
export const ExtractTableOutputSchema = z.object({
  status: z.literal('ok'),
  tables: z.array(TableSchema)
});
export type ExtractTableOutput = z.infer<typeof ExtractTableOutputSchema>;

// Extract Attributes Input Schema
export const AttributeQuerySchema = z.object({
  css: z.string(),
  attr: z.string()
});

export const ExtractAttributesInputSchema = z.object({
  pageId: PageIdSchema,
  queries: z.array(AttributeQuerySchema).min(1),
  limitPerQuery: z.number().min(1).max(1000).default(50)
});
export type ExtractAttributesInput = z.infer<typeof ExtractAttributesInputSchema>;

// Extract Attributes Output Schema
export const ExtractAttributesOutputSchema = z.object({
  status: z.literal('ok'),
  results: z.array(z.array(z.string().nullable()))
});
export type ExtractAttributesOutput = z.infer<typeof ExtractAttributesOutputSchema>;

// Extract Screenshot Input Schema
export const ExtractScreenshotInputSchema = z.object({
  pageId: PageIdSchema,
  fullPage: z.boolean().default(true),
  clip: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1),
    height: z.number().min(1)
  }).optional(),
  format: z.enum(['png', 'jpeg']).default('png'),
  quality: z.number().min(1).max(100).default(80)
});
export type ExtractScreenshotInput = z.infer<typeof ExtractScreenshotInputSchema>;

// Extract Screenshot Output Schema
export const ExtractScreenshotOutputSchema = z.object({
  status: z.literal('ok'),
  imageBase64: z.string(),
  meta: z.object({
    bytes: z.number(),
    format: z.string(),
    width: z.number().optional(),
    height: z.number().optional()
  })
});
export type ExtractScreenshotOutput = z.infer<typeof ExtractScreenshotOutputSchema>;
