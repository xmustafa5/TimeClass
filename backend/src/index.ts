import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { teachersRoutes } from './routes/teachers.js';
import { gradesRoutes } from './routes/grades.js';
import { sectionsRoutes } from './routes/sections.js';
import { roomsRoutes } from './routes/rooms.js';
import { periodsRoutes } from './routes/periods.js';
import { scheduleRoutes } from './routes/schedule.js';
import { disconnectPrisma } from './lib/prisma.js';

const server = Fastify({
  logger: true,
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
        url: 'http://localhost:8080',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'teachers', description: 'المدرسون - Teachers management' },
      { name: 'grades', description: 'الصفوف - Grades management' },
      { name: 'sections', description: 'الشُعَب - Sections management' },
      { name: 'rooms', description: 'القاعات - Rooms management' },
      { name: 'periods', description: 'الحصص - Periods management' },
      { name: 'schedule', description: 'الجدول الدراسي - Schedule management' },
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

// Register plugins
await server.register(cors, {
  origin: ['http://localhost:3000'], // Next.js frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
});

await server.register(sensible);

// Register routes
await server.register(teachersRoutes, { prefix: '/api/teachers' });
await server.register(gradesRoutes, { prefix: '/api/grades' });
await server.register(sectionsRoutes, { prefix: '/api/sections' });
await server.register(roomsRoutes, { prefix: '/api/rooms' });
await server.register(periodsRoutes, { prefix: '/api/periods' });
await server.register(scheduleRoutes, { prefix: '/api/schedule' });

// Health check route
server.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Graceful shutdown
const gracefulShutdown = async () => {
  await server.close();
  await disconnectPrisma();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async () => {
  try {
    await server.listen({ port: 8080, host: '0.0.0.0' });
    console.log('Server running at http://localhost:8080');
    console.log('API Documentation at http://localhost:8080/docs');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
