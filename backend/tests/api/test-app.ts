import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { teachersRoutes } from '../../src/routes/teachers.js';
import { gradesRoutes } from '../../src/routes/grades.js';
import { sectionsRoutes } from '../../src/routes/sections.js';
import { periodsRoutes } from '../../src/routes/periods.js';
import { scheduleRoutes } from '../../src/routes/schedule.js';
import { statsRoutes } from '../../src/routes/stats.js';

export async function buildTestApp() {
  const app = Fastify({
    logger: false,
  });

  await app.register(cors);
  await app.register(sensible);

  await app.register(teachersRoutes, { prefix: '/api/teachers' });
  await app.register(gradesRoutes, { prefix: '/api/grades' });
  await app.register(sectionsRoutes, { prefix: '/api/sections' });
  await app.register(periodsRoutes, { prefix: '/api/periods' });
  await app.register(scheduleRoutes, { prefix: '/api/schedule' });
  await app.register(statsRoutes, { prefix: '/api/stats' });

  return app;
}
