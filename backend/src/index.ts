import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { registerSecurityPlugins } from './lib/security.js';
import { teachersRoutes } from './routes/teachers.js';
import { gradesRoutes } from './routes/grades.js';
import { sectionsRoutes } from './routes/sections.js';
import { roomsRoutes } from './routes/rooms.js';
import { periodsRoutes } from './routes/periods.js';
import { scheduleRoutes } from './routes/schedule.js';
import { statsRoutes } from './routes/stats.js';
import { disconnectPrisma } from './lib/prisma.js';

const isDevelopment = process.env.NODE_ENV !== 'production';

const server = Fastify({
  logger: {
    level: isDevelopment ? 'info' : 'warn',
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  },
  // Trust proxy for proper IP detection behind reverse proxy
  trustProxy: true,
});

// Register Swagger for API documentation
await server.register(swagger, {
  openapi: {
    info: {
      title: 'نظام توزيع المدرسين والحصص API',
      description: 'School Schedule Management System - Backend API',
      version: '1.0.0',
    },
    servers: [
      {
        url: isDevelopment ? 'http://localhost:8080' : 'https://api.your-domain.com',
        description: isDevelopment ? 'Development server' : 'Production server',
      },
    ],
    tags: [
      { name: 'teachers', description: 'المدرسون - Teachers management' },
      { name: 'grades', description: 'الصفوف - Grades management' },
      { name: 'sections', description: 'الشُعَب - Sections management' },
      { name: 'rooms', description: 'القاعات - Rooms management' },
      { name: 'periods', description: 'الحصص - Periods management' },
      { name: 'schedule', description: 'الجدول الدراسي - Schedule management' },
      { name: 'export', description: 'التصدير - Data export' },
      { name: 'statistics', description: 'الإحصائيات - Statistics and analytics' },
    ],
  },
});

await server.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
});

// Register security plugins (helmet, rate-limit, cors)
await registerSecurityPlugins(server, {
  isDevelopment,
  cors: {
    origin: isDevelopment
      ? ['http://localhost:3000', 'http://localhost:5173']
      : ['https://your-production-domain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  },
  rateLimit: {
    global: true,
    max: isDevelopment ? 1000 : 100, // More lenient in development
    timeWindow: '1 minute',
  },
});

// Register sensible plugin for better error handling
await server.register(sensible);

// Register routes
await server.register(teachersRoutes, { prefix: '/api/teachers' });
await server.register(gradesRoutes, { prefix: '/api/grades' });
await server.register(sectionsRoutes, { prefix: '/api/sections' });
await server.register(roomsRoutes, { prefix: '/api/rooms' });
await server.register(periodsRoutes, { prefix: '/api/periods' });
await server.register(scheduleRoutes, { prefix: '/api/schedule' });
await server.register(statsRoutes, { prefix: '/api/stats' });

// Health check route (excluded from rate limiting)
server.get(
  '/api/health',
  {
    config: {
      rateLimit: false, // Disable rate limiting for health checks
    },
  },
  async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: isDevelopment ? 'development' : 'production',
    };
  }
);

// Graceful shutdown
const gracefulShutdown = async () => {
  server.log.info('Shutting down gracefully...');
  await server.close();
  await disconnectPrisma();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '8080', 10);
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${port}`);
    console.log(`API Documentation at http://localhost:${port}/docs`);
    console.log(`Environment: ${isDevelopment ? 'development' : 'production'}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
