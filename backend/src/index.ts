import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { teachersRoutes } from './routes/teachers.js';
import { gradesRoutes } from './routes/grades.js';
import { sectionsRoutes } from './routes/sections.js';
import { roomsRoutes } from './routes/rooms.js';
import { periodsRoutes } from './routes/periods.js';
import { scheduleRoutes } from './routes/schedule.js';

const server = Fastify({
  logger: true,
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

// Start server
const start = async () => {
  try {
    await server.listen({ port: 8080, host: '0.0.0.0' });
    console.log('Server running at http://localhost:8080');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
