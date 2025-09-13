import { z } from 'zod';
import { PageIdSchema, ViewportSchema, WaitUntilSchema, ProxySchema, BaseResponseSchema } from './index.js';

// Navigate Open Input Schema
export const NavigateOpenInputSchema = z.object({
  url: z.string().url(),
  viewport: ViewportSchema.optional(),
  userAgent: z.string().optional(),
  timeoutMs: z.number().min(1000).max(120000).default(30000),
  persistSessionKey: z.string().optional(),
  extraHeaders: z.record(z.string()).optional(),
  proxy: z.string().optional(),
  waitUntil: WaitUntilSchema.default('load')
});
export type NavigateOpenInput = z.infer<typeof NavigateOpenInputSchema>;

// Navigate Open Output Schema
export const NavigateOpenOutputSchema = z.object({
  status: z.literal('ok'),
  pageId: PageIdSchema,
  finalUrl: z.string().url(),
  cookiesStored: z.boolean()
});
export type NavigateOpenOutput = z.infer<typeof NavigateOpenOutputSchema>;

// Navigate Goto Input Schema
export const NavigateGotoInputSchema = z.object({
  pageId: PageIdSchema,
  url: z.string().url(),
  timeoutMs: z.number().min(1000).max(120000).default(30000),
  waitUntil: WaitUntilSchema.default('load')
});
export type NavigateGotoInput = z.infer<typeof NavigateGotoInputSchema>;

// Navigate Goto Output Schema
export const NavigateGotoOutputSchema = z.object({
  status: z.literal('ok'),
  finalUrl: z.string().url(),
  cookiesStored: z.boolean()
});
export type NavigateGotoOutput = z.infer<typeof NavigateGotoOutputSchema>;
