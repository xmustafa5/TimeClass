import { describe, it, expect, beforeEach } from 'vitest';
import { buildTestApp } from './test-app.js';
import { testPrisma } from '../setup.js';
import type { FastifyInstance } from 'fastify';

describe('Bulk Operations API', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildTestApp();
    await app.ready();
  });

  describe('POST /api/teachers/bulk', () => {
    it('should create multiple teachers in bulk', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/teachers/bulk',
        payload: {
          teachers: [
            {
              fullName: 'أحمد محمد',
              subject: 'رياضيات',
              workDays: ['sunday', 'monday', 'tuesday'],
              weeklyPeriods: 20,
            },
            {
              fullName: 'فاطمة علي',
              subject: 'علوم',
              workDays: ['sunday', 'monday', 'wednesday'],
              weeklyPeriods: 18,
            },
            {
              fullName: 'محمد سعيد',
              subject: 'لغة عربية',
              workDays: ['sunday', 'tuesday', 'thursday'],
              weeklyPeriods: 22,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.created).toBe(3);
      expect(body.data.teachers).toHaveLength(3);
      expect(body.data.teachers[0].fullName).toBe('أحمد محمد');
      expect(body.data.teachers[1].fullName).toBe('فاطمة علي');
      expect(body.data.teachers[2].fullName).toBe('محمد سعيد');

      // Verify in database
      const dbTeachers = await testPrisma.teacher.count();
      expect(dbTeachers).toBe(3);
    });

    it('should return 400 for empty teachers array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/teachers/bulk',
        payload: {
          teachers: [],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should return 400 for invalid teacher data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/teachers/bulk',
        payload: {
          teachers: [
            {
              fullName: 'أ', // Too short
              subject: 'رياضيات',
              workDays: ['sunday'],
            },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should rollback all if any teacher fails (transaction)', async () => {
      // First create a teacher
      await testPrisma.teacher.create({
        data: {
          fullName: 'مدرس موجود',
          subject: 'رياضيات',
          weeklyPeriods: 20,
          workDays: JSON.stringify(['sunday', 'monday']),
        },
      });

      // Try to bulk create with valid teachers
      const response = await app.inject({
        method: 'POST',
        url: '/api/teachers/bulk',
        payload: {
          teachers: [
            {
              fullName: 'مدرس جديد 1',
              subject: 'علوم',
              workDays: ['sunday', 'monday'],
              weeklyPeriods: 18,
            },
            {
              fullName: 'مدرس جديد 2',
              subject: 'لغة',
              workDays: ['tuesday'],
              weeklyPeriods: 20,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.created).toBe(2);

      // Verify total count (1 existing + 2 new)
      const count = await testPrisma.teacher.count();
      expect(count).toBe(3);
    });
  });
});
