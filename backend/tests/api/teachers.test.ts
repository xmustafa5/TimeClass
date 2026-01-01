import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testPrisma } from '../setup.js';
import { buildTestApp } from './test-app.js';

describe('Teachers API', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;
  let createdTeacherId: string;

  beforeEach(async () => {
    app = await buildTestApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /api/teachers', () => {
    it('should return empty list when no teachers exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/teachers',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.teachers).toBeInstanceOf(Array);
    });

    it('should return paginated teachers', async () => {
      // Create a teacher first
      const teacher = await testPrisma.teacher.create({
        data: {
          fullName: 'أحمد محمد',
          subject: 'الرياضيات',
          weeklyPeriods: 20,
          workDays: JSON.stringify(['sunday', 'monday']),
        },
      });
      createdTeacherId = teacher.id;

      const response = await app.inject({
        method: 'GET',
        url: '/api/teachers?page=1&limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.teachers.length).toBeGreaterThan(0);
      expect(body.data.page).toBe(1);
      expect(body.data.limit).toBe(10);
    });
  });

  describe('GET /api/teachers/:id', () => {
    it('should return 404 for non-existent teacher', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/teachers/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });

    it('should return teacher by ID', async () => {
      const teacher = await testPrisma.teacher.create({
        data: {
          fullName: 'سارة خالد',
          subject: 'العلوم',
          weeklyPeriods: 18,
          workDays: JSON.stringify(['sunday', 'monday', 'tuesday']),
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/teachers/${teacher.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.fullName).toBe('سارة خالد');
    });
  });

  describe('POST /api/teachers', () => {
    it('should create a new teacher', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/teachers',
        payload: {
          fullName: 'محمد علي',
          subject: 'اللغة العربية',
          weeklyPeriods: 22,
          workDays: ['sunday', 'monday', 'tuesday'],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.fullName).toBe('محمد علي');
      expect(body.data.subject).toBe('اللغة العربية');
    });

    it('should return 400 for invalid data', async () => {
      // Missing required fields triggers JSON schema validation error
      const response = await app.inject({
        method: 'POST',
        url: '/api/teachers',
        payload: {
          fullName: 'أحمد',
          // missing subject, workDays (required fields)
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for empty workDays array', async () => {
      // Empty workDays array triggers Zod validation
      const response = await app.inject({
        method: 'POST',
        url: '/api/teachers',
        payload: {
          fullName: 'أحمد محمد',
          subject: 'الرياضيات',
          weeklyPeriods: 20,
          workDays: [], // Empty array - fails Zod min(1)
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });
  });

  describe('PUT /api/teachers/:id', () => {
    it('should update an existing teacher', async () => {
      const teacher = await testPrisma.teacher.create({
        data: {
          fullName: 'فاطمة أحمد',
          subject: 'التاريخ',
          weeklyPeriods: 16,
          workDays: JSON.stringify(['sunday']),
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/teachers/${teacher.id}`,
        payload: {
          subject: 'الجغرافيا',
          weeklyPeriods: 18,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.subject).toBe('الجغرافيا');
      expect(body.data.weeklyPeriods).toBe(18);
    });

    it('should return 404 for non-existent teacher', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/teachers/00000000-0000-0000-0000-000000000000',
        payload: {
          subject: 'الرياضيات',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/teachers/:id', () => {
    it('should delete an existing teacher', async () => {
      const teacher = await testPrisma.teacher.create({
        data: {
          fullName: 'للحذف',
          subject: 'مادة',
          weeklyPeriods: 10,
          workDays: JSON.stringify(['sunday']),
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/teachers/${teacher.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);

      // Verify deletion
      const deleted = await testPrisma.teacher.findUnique({
        where: { id: teacher.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent teacher', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/teachers/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
