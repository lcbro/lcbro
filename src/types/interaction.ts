import { z } from 'zod';
import { PageIdSchema, BaseResponseSchema } from './index.js';

// Target selector schema
export const TargetSchema = z.object({
  css: z.string().optional(),
  text: z.string().optional(),
  role: z.string().optional()
}).refine(data => data.css || data.text || data.role, {
  message: "At least one of css, text, or role must be provided"
});
export type Target = z.infer<typeof TargetSchema>;

// Interact Click Input Schema
export const InteractClickInputSchema = z.object({
  pageId: PageIdSchema,
  target: TargetSchema,
  nth: z.number().min(0).default(0),
  timeoutMs: z.number().min(1000).max(60000).default(15000)
});
export type InteractClickInput = z.infer<typeof InteractClickInputSchema>;

// Interact Type Input Schema
export const InteractTypeInputSchema = z.object({
  pageId: PageIdSchema,
  css: z.string(),
  text: z.string(),
  clear: z.boolean().default(true),
  pressEnter: z.boolean().default(false),
  timeoutMs: z.number().min(1000).max(60000).default(15000)
});
export type InteractTypeInput = z.infer<typeof InteractTypeInputSchema>;

// Interact Wait Input Schema
export const InteractWaitInputSchema = z.object({
  pageId: PageIdSchema,
  for: z.enum(['selector', 'idle', 'url']),
  selector: z.string().optional(),
  timeoutMs: z.number().min(1000).max(120000).default(20000),
  urlIncludes: z.string().optional()
}).refine(data => {
  if (data.for === 'selector' && !data.selector) {
    return false;
  }
  if (data.for === 'url' && !data.urlIncludes) {
    return false;
  }
  return true;
}, {
  message: "selector is required when for='selector', urlIncludes is required when for='url'"
});
export type InteractWaitInput = z.infer<typeof InteractWaitInputSchema>;

// Standard success response
export const InteractSuccessResponseSchema = z.object({
  status: z.literal('ok')
});
export type InteractSuccessResponse = z.infer<typeof InteractSuccessResponseSchema>;
