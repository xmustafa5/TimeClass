import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';

/**
 * Rate limit configuration options
 */
export interface RateLimitConfig {
  global?: boolean;
  max?: number;
  timeWindow?: number | string;
  ban?: number;
  cache?: number;
  allowList?: string[];
}

/**
 * CORS configuration options
 */
export interface CorsConfig {
  origin: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}

/**
 * Default rate limit configuration
 */
const defaultRateLimitConfig: RateLimitConfig = {
  global: true,
  max: 100, // 100 requests per minute
  timeWindow: '1 minute',
  ban: -1, // No banning
  cache: 5000,
  allowList: ['127.0.0.1', '::1'], // Localhost
};

/**
 * Strict rate limit for sensitive endpoints
 */
export const strictRateLimit = {
  max: 10,
  timeWindow: '1 minute',
};

/**
 * Bulk operations rate limit
 */
export const bulkRateLimit = {
  max: 5,
  timeWindow: '1 minute',
};

/**
 * Register security plugins on a Fastify instance
 */
export async function registerSecurityPlugins(
  fastify: FastifyInstance,
  options?: {
    rateLimit?: RateLimitConfig;
    cors?: CorsConfig;
    isDevelopment?: boolean;
  }
): Promise<void> {
  const isDev = options?.isDevelopment ?? process.env.NODE_ENV !== 'production';

  // Register Helmet for security headers
  await fastify.register(helmet, {
    global: true,
    // Content Security Policy
    contentSecurityPolicy: isDev
      ? false // Disable CSP in development for easier debugging
      : {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        },
    // Cross-Origin settings
    crossOriginEmbedderPolicy: false, // Disable for API
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for API
    // Other security headers
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hsts: isDev ? false : { maxAge: 31536000, includeSubDomains: true },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  });

  // Register Rate Limiting
  await fastify.register(rateLimit, {
    ...defaultRateLimitConfig,
    ...options?.rateLimit,
    // Custom error response in Arabic
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        error: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً',
        statusCode: 429,
        retryAfter: context.ttl,
      };
    },
    // Add rate limit headers
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });

  // Register CORS
  const corsConfig = options?.cors ?? {
    origin: isDev
      ? ['http://localhost:3000', 'http://localhost:5173'] // Vite & Next.js dev servers
      : ['https://your-production-domain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  };

  await fastify.register(cors, corsConfig);

  // Log security setup
  fastify.log.info('Security plugins registered successfully');
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key] as string) as T[Extract<keyof T, string>];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key] as Record<string, unknown>) as T[Extract<keyof T, string>];
    }
  }

  return sanitized;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Rate limit presets for different endpoint types
 */
export const rateLimitPresets = {
  // Standard API endpoints
  standard: {
    max: 100,
    timeWindow: '1 minute',
  },
  // Read-heavy endpoints
  read: {
    max: 200,
    timeWindow: '1 minute',
  },
  // Write endpoints
  write: {
    max: 50,
    timeWindow: '1 minute',
  },
  // Bulk operations
  bulk: {
    max: 10,
    timeWindow: '1 minute',
  },
  // Export operations
  export: {
    max: 20,
    timeWindow: '1 minute',
  },
  // Auth endpoints (if added later)
  auth: {
    max: 5,
    timeWindow: '15 minutes',
  },
};
