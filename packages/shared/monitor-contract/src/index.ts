import { z } from 'zod';

export { redactMonitorText } from './privacy';
export const MAX_REPORT_BYTES = 4 * 1024 * 1024;
const timestamp = z.number().finite().nonnegative();
const shortText = z.string().max(500);

export const reportIdSchema = z.uuid();

export const authenticationSchema = z
  .object({
    status: z.enum(['anonymous', 'verified', 'unverified', 'invalid']),
    userId: z.string().max(100).optional(),
    username: z.string().max(100).optional(),
    token: z.string().max(16000).optional(),
    cookie: z.string().max(24000).optional()
  })
  .strict();

export const replayEventSchema = z
  .object({
    type: z.number().int().min(0).max(6),
    timestamp,
    data: z.json()
  })
  .strict();

export const contextSchema = z
  .object({
    app: z.literal('web-h5'),
    sessionId: reportIdSchema,
    pageId: reportIdSchema,
    path: z
      .string()
      .max(1000)
      .startsWith('/')
      .refine(value => !/[?#]/.test(value)),
    release: z.string().max(100),
    userAgent: shortText,
    language: z.string().max(50),
    device: z
      .object({
        platform: z.string().max(100).optional(),
        mobile: z.boolean().optional(),
        timezone: z.string().max(100).optional()
      })
      .strict()
      .optional(),
    authentication: authenticationSchema.optional(),
    request: z
      .object({
        method: z.string().max(20),
        routePath: z.string().max(1000).optional(),
        routeType: z.enum(['render', 'route', 'action', 'proxy']).optional()
      })
      .strict()
      .optional(),
    viewport: z
      .object({ width: z.number().int().min(0).max(100000), height: z.number().int().min(0).max(100000) })
      .strict()
  })
  .strict();

const metricSchema = z
  .object({
    id: z.string().max(100),
    name: z.enum(['LCP', 'INP', 'CLS', 'FCP', 'TTFB']),
    value: z.number().finite().nonnegative(),
    rating: z.enum(['good', 'needs-improvement', 'poor']),
    navigationType: z.string().max(50)
  })
  .strict();

const breadcrumbSchema = z
  .object({
    timestamp,
    category: z.enum(['navigation', 'request']),
    message: shortText
  })
  .strict();

const common = {
  schemaVersion: z.literal(1),
  id: reportIdSchema,
  timestamp,
  timeSource: z.enum(['client', 'server']).optional(),
  context: contextSchema,
  metrics: z.array(metricSchema).max(20)
};

export const errorSchema = z
  .object({
    kind: z.enum([
      'javascript',
      'unhandled-rejection',
      'react',
      'react-client',
      'next-server',
      'resource',
      'business',
      'http',
      'network'
    ]),
    name: z.string().max(100),
    message: z.string().max(1000),
    stack: z.string().max(12000).optional(),
    componentStack: z.string().max(12000).optional(),
    businessCode: z.union([z.number().finite(), z.string().max(100)]).optional(),
    status: z.number().int().min(100).max(599).optional(),
    digest: z.string().max(100).optional()
  })
  .strict();

export const reportSchema = z.discriminatedUnion('kind', [
  z
    .object({
      ...common,
      kind: z.literal('error'),
      error: errorSchema,
      breadcrumbs: z.array(breadcrumbSchema).max(50),
      replay: z
        .object({
          events: z.array(replayEventSchema).max(30000),
          unavailableReason: z.enum(['not-ready', 'recording-failed', 'buffer-limit', 'server-error']).optional()
        })
        .strict()
        .superRefine((replay, ctx) => {
          if (replay.events.length > 0 && !replay.events.some(event => event.type === 2)) {
            ctx.addIssue({ code: 'custom', message: 'Replay requires a full snapshot' });
          }
          if (replay.events.length === 0 && !replay.unavailableReason) {
            ctx.addIssue({ code: 'custom', message: 'Missing replay availability reason' });
          }
        })
    })
    .strict(),
  z.object({ ...common, kind: z.literal('performance'), hasError: z.boolean() }).strict()
]);
export type MonitorReport = z.infer<typeof reportSchema>;
export type ErrorReport = Extract<MonitorReport, { kind: 'error' }>;
export type MonitorError = z.infer<typeof errorSchema>;
export type MonitorContext = z.infer<typeof contextSchema>;
export type MonitorAuthentication = z.infer<typeof authenticationSchema>;
export type MonitorMetric = z.infer<typeof metricSchema>;
export type Breadcrumb = z.infer<typeof breadcrumbSchema>;

const storedMetadata = { receivedAt: timestamp, replayEventCount: z.number().int().nonnegative() };
// Credentials are available only in the protected detail response, never in list summaries.
const summaryContext = contextSchema.extend({
  authentication: authenticationSchema.omit({ token: true, cookie: true }).optional()
});
export type ReplayEvent = z.infer<typeof replayEventSchema>;
export const reportSummarySchema = z.discriminatedUnion('kind', [
  reportSchema.options[0].omit({ replay: true }).extend({ ...storedMetadata, context: summaryContext }),
  reportSchema.options[1].extend({ ...storedMetadata, context: summaryContext })
]);
export const reportListResponseSchema = z.object({
  code: z.literal(200),
  data: z.object({ items: z.array(reportSummarySchema), nextCursor: reportIdSchema.nullable() })
});

export type ReportSummary = z.infer<typeof reportSummarySchema>;
