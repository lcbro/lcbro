import { z } from 'zod';

// Base types
export const PageIdSchema = z.string().uuid();
export type PageId = z.infer<typeof PageIdSchema>;

// Viewport configuration
export const ViewportSchema = z.object({
  width: z.number().min(320).max(3840).default(1280),
  height: z.number().min(240).max(2160).default(800)
});
export type Viewport = z.infer<typeof ViewportSchema>;

// Wait until strategies
export const WaitUntilSchema = z.enum(['load', 'domcontentloaded', 'networkidle']);
export type WaitUntil = z.infer<typeof WaitUntilSchema>;

// Proxy configuration
export const ProxySchema = z.object({
  server: z.string(),
  username: z.string().optional(),
  password: z.string().optional()
});
export type ProxyConfig = z.infer<typeof ProxySchema>;

// Base response schema
export const BaseResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  message: z.string().optional()
});

// Error response schema
export const ErrorResponseSchema = z.object({
  status: z.literal('error'),
  code: z.enum([
    'nav_timeout',
    'selector_not_found', 
    'captcha_required',
    'dom_too_large',
    'llm_failed',
    'internal_error',
    'invalid_params',
    'page_not_found'
  ]),
  message: z.string(),
  details: z.record(z.unknown()).optional()
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Success response with data
export const SuccessResponseSchema = <T extends z.ZodRawShape>(dataSchema: T) => 
  z.object({
    status: z.literal('ok'),
    ...dataSchema
  });

// Page metadata
export const PageMetaSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  ts: z.string().datetime()
});
export type PageMeta = z.infer<typeof PageMetaSchema>;
