import { z } from 'zod';
import { PageIdSchema } from './index.js';

// Session action schemas
export const SessionActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('type'),
    css: z.string(),
    text: z.string()
  }),
  z.object({
    action: z.literal('click'),
    css: z.string()
  }),
  z.object({
    action: z.literal('wait'),
    for: z.enum(['url', 'selector']),
    urlIncludes: z.string().optional(),
    selector: z.string().optional()
  })
]).refine((data) => {
  if (data.action === 'wait') {
    if (data.for === 'url' && !data.urlIncludes) return false;
    if (data.for === 'selector' && !data.selector) return false;
  }
  return true;
}, {
  message: "urlIncludes required when for='url', selector required when for='selector'"
});

export type SessionAction = z.infer<typeof SessionActionSchema>;

// Session Auth Input Schema
export const SessionAuthInputSchema = z.object({
  pageId: PageIdSchema,
  steps: z.array(SessionActionSchema).min(1),
  timeoutMs: z.number().min(1000).max(300000).default(60000)
});
export type SessionAuthInput = z.infer<typeof SessionAuthInputSchema>;

// Session Auth Output Schema
export const SessionAuthOutputSchema = z.object({
  status: z.literal('ok'),
  stepsCompleted: z.number(),
  totalSteps: z.number()
});
export type SessionAuthOutput = z.infer<typeof SessionAuthOutputSchema>;
