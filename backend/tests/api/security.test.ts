import { describe, it, expect, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { sanitizeString, sanitizeObject, isValidUUID } from '../../src/lib/security.js';

describe('Security Features', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify({ logger: false });

    // Register helmet for security headers
    await app.register(helmet, {
      global: true,
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hsts: false,
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    });

    // Register rate limiting with test-friendly settings
    await app.register(rateLimit, {
      global: true,
      max: 5,
      timeWindow: '1 minute',
      // Important: keyGenerator to track by custom key for testing
      keyGenerator: (request) => {
        return request.headers['x-test-client'] as string || 'test-client';
      },
      errorResponseBuilder: () => ({
        success: false,
        error: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً',
        statusCode: 429,
      }),
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
    await app.register(cors, {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    });

    await app.register(sensible);

    // Test route
    app.get('/test', async () => {
      return { message: 'ok' };
    });

    await app.ready();
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers in response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
        headers: {
          'x-test-client': 'client-1',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('should decrement remaining count with each request', async () => {
      const response1 = await app.inject({
        method: 'GET',
        url: '/test',
        headers: {
          'x-test-client': 'client-2',
        },
      });

      const response2 = await app.inject({
        method: 'GET',
        url: '/test',
        headers: {
          'x-test-client': 'client-2',
        },
      });

      const remaining1 = parseInt(response1.headers['x-ratelimit-remaining'] as string, 10);
      const remaining2 = parseInt(response2.headers['x-ratelimit-remaining'] as string, 10);

      expect(remaining2).toBe(remaining1 - 1);
    });

    it('should return 429 when rate limit exceeded', async () => {
      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        await app.inject({
          method: 'GET',
          url: '/test',
          headers: {
            'x-test-client': 'client-3',
          },
        });
      }

      // This request should be rate limited
      const response = await app.inject({
        method: 'GET',
        url: '/test',
        headers: {
          'x-test-client': 'client-3',
        },
      });

      expect(response.statusCode).toBe(429);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('تم تجاوز الحد المسموح');
    });
  });

  describe('Security Headers (Helmet)', () => {
    it('should include X-Content-Type-Options header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should include X-XSS-Protection header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
      });

      // X-XSS-Protection should be set
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should include Referrer-Policy header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.headers['referrer-policy']).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('should include CORS headers for allowed origins', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/test',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});

describe('Input Sanitization', () => {
  describe('sanitizeString', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(sanitizeString('foo & bar')).toBe('foo &amp; bar');
    });

    it('should escape quotes', () => {
      expect(sanitizeString("it's \"quoted\"")).toBe('it&#x27;s &quot;quoted&quot;');
    });

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('should handle normal text without changes', () => {
      const text = 'مرحبا بالعالم - Hello World 123';
      // Normal text should remain unchanged (no special chars)
      expect(sanitizeString(text)).toBe(text);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string values in object', () => {
      const input = {
        name: '<script>xss</script>',
        count: 5,
        nested: {
          value: 'test & value',
        },
      };

      const result = sanitizeObject(input);

      expect(result.name).toBe('&lt;script&gt;xss&lt;&#x2F;script&gt;');
      expect(result.count).toBe(5);
      expect(result.nested.value).toBe('test &amp; value');
    });

    it('should handle null values', () => {
      const input = {
        name: 'test',
        value: null,
      };

      const result = sanitizeObject(input as Record<string, unknown>);
      expect(result.value).toBeNull();
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should return false for invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
    });
  });
});
