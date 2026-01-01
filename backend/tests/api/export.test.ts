import { describe, it, expect, beforeEach } from 'vitest';
import { buildTestApp } from './test-app.js';
import { testPrisma } from '../setup.js';
import type { FastifyInstance } from 'fastify';

describe('Export API', () => {
  let app: FastifyInstance;
  let teacherId: string;
  let gradeId: string;
  let sectionId: string;
  let periodId: string;

  beforeEach(async () => {
    app = await buildTestApp();
    await app.ready();

    // Create test data
    const teacher = await testPrisma.teacher.create({
      data: {
        fullName: 'أحمد محمد',
        subject: 'رياضيات',
        weeklyPeriods: 20,
        workDays: JSON.stringify(['sunday', 'monday', 'tuesday']),
      },
    });
    teacherId = teacher.id;

    const grade = await testPrisma.grade.create({
      data: { name: 'الصف الأول', order: 1 },
    });
    gradeId = grade.id;

    const section = await testPrisma.section.create({
      data: { name: 'أ', gradeId: grade.id },
    });
    sectionId = section.id;

    const period = await testPrisma.period.create({
      data: { number: 1, startTime: '08:00', endTime: '08:45' },
    });
    periodId = period.id;

    // Create a schedule entry
    await testPrisma.scheduleEntry.create({
      data: {
        teacherId,
        gradeId,
        sectionId,
        periodId,
        day: 'sunday',
        subject: 'رياضيات',
      },
    });
  });

  describe('GET /api/schedule/export/json', () => {
    it('should export schedule as JSON', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/schedule/export/json',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.data).toHaveLength(1);
      expect(body.data.count).toBe(1);
      expect(body.data.exportedAt).toBeDefined();
      expect(body.data.data[0].teacherName).toBe('أحمد محمد');
      expect(body.data.data[0].dayArabic).toBe('الأحد');
    });

    it('should filter export by day', async () => {
      // Add entry for another day
      const period2 = await testPrisma.period.create({
        data: { number: 2, startTime: '09:00', endTime: '09:45' },
      });

      await testPrisma.scheduleEntry.create({
        data: {
          teacherId,
          gradeId,
          sectionId,
          periodId: period2.id,
          day: 'monday',
          subject: 'رياضيات',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/schedule/export/json?day=sunday',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.count).toBe(1);
      expect(body.data.data[0].day).toBe('sunday');
    });

    it('should filter export by teacher', async () => {
      // Create another teacher and entry
      const teacher2 = await testPrisma.teacher.create({
        data: {
          fullName: 'فاطمة علي',
          subject: 'علوم',
          weeklyPeriods: 18,
          workDays: JSON.stringify(['sunday', 'monday']),
        },
      });

      const period2 = await testPrisma.period.create({
        data: { number: 2, startTime: '09:00', endTime: '09:45' },
      });

      await testPrisma.scheduleEntry.create({
        data: {
          teacherId: teacher2.id,
          gradeId,
          sectionId,
          periodId: period2.id,
          day: 'sunday',
          subject: 'علوم',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/schedule/export/json?teacherId=${teacherId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.count).toBe(1);
      expect(body.data.data[0].teacherName).toBe('أحمد محمد');
    });
  });

  describe('GET /api/schedule/export/csv', () => {
    it('should export schedule as CSV', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/schedule/export/csv',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.csv');

      // CSV should contain Arabic headers
      const csv = response.body;
      expect(csv).toContain('اليوم');
      expect(csv).toContain('الحصة');
      expect(csv).toContain('المدرس');
      expect(csv).toContain('أحمد محمد');
    });

    it('should return empty CSV with headers when no data', async () => {
      // Clear all schedule entries
      await testPrisma.scheduleEntry.deleteMany();

      const response = await app.inject({
        method: 'GET',
        url: '/api/schedule/export/csv',
      });

      expect(response.statusCode).toBe(200);
      const csv = response.body;
      expect(csv).toContain('اليوم');
      expect(csv).toContain('الحصة');
    });
  });

  describe('GET /api/schedule/export/weekly', () => {
    it('should export weekly schedule grouped by day', async () => {
      // Add entries for different days
      const period2 = await testPrisma.period.create({
        data: { number: 2, startTime: '09:00', endTime: '09:45' },
      });

      await testPrisma.scheduleEntry.create({
        data: {
          teacherId,
          gradeId,
          sectionId,
          periodId: period2.id,
          day: 'monday',
          subject: 'رياضيات',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/schedule/export/weekly',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.schedule).toBeDefined();
      expect(body.data.schedule.sunday).toHaveLength(1);
      expect(body.data.schedule.monday).toHaveLength(1);
      expect(body.data.schedule.tuesday).toHaveLength(0);
      expect(body.data.exportedAt).toBeDefined();
    });
  });
});
