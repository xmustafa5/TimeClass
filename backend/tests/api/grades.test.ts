import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testPrisma } from '../setup.js';
import { buildTestApp } from './test-app.js';

describe('Grades API', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeEach(async () => {
    app = await buildTestApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /api/grades', () => {
    it('should return empty list when no grades exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/grades',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.grades).toBeInstanceOf(Array);
    });

    it('should return paginated grades with section count', async () => {
      const grade = await testPrisma.grade.create({
        data: {
          name: 'الصف الأول',
          order: 1,
        },
      });

      // Create a section for this grade
      await testPrisma.section.create({
        data: {
          name: 'أ',
          gradeId: grade.id,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/grades?page=1&limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.grades.length).toBeGreaterThan(0);
      expect(body.data.grades[0]._count.sections).toBe(1);
    });
  });

  describe('GET /api/grades/:id', () => {
    it('should return 404 for non-existent grade', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/grades/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });

    it('should return grade with sections by ID', async () => {
      const grade = await testPrisma.grade.create({
        data: {
          name: 'الصف الثاني',
          order: 2,
        },
      });

      await testPrisma.section.create({
        data: {
          name: 'ب',
          gradeId: grade.id,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/grades/${grade.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('الصف الثاني');
      expect(body.data.sections).toBeInstanceOf(Array);
      expect(body.data.sections.length).toBe(1);
    });
  });

  describe('POST /api/grades', () => {
    it('should create a new grade', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/grades',
        payload: {
          name: 'الصف الثالث',
          order: 3,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('الصف الثالث');
      expect(body.data.order).toBe(3);
    });

    it('should return 400 for invalid data', async () => {
      // Send a name that's technically a string but empty - Zod should catch this
      const response = await app.inject({
        method: 'POST',
        url: '/api/grades',
        payload: {
          name: ' ', // Whitespace only - fails min length after trim
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });

    it('should return 409 for duplicate grade name', async () => {
      await testPrisma.grade.create({
        data: {
          name: 'الصف الرابع',
          order: 4,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/grades',
        payload: {
          name: 'الصف الرابع',
          order: 5,
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });
  });

  describe('PUT /api/grades/:id', () => {
    it('should update an existing grade', async () => {
      const grade = await testPrisma.grade.create({
        data: {
          name: 'الصف الخامس',
          order: 5,
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/grades/${grade.id}`,
        payload: {
          name: 'الصف الخامس - معدل',
          order: 6,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('الصف الخامس - معدل');
      expect(body.data.order).toBe(6);
    });

    it('should return 404 for non-existent grade', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/grades/00000000-0000-0000-0000-000000000000',
        payload: {
          name: 'الصف الجديد',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/grades/:id', () => {
    it('should delete an existing grade', async () => {
      const grade = await testPrisma.grade.create({
        data: {
          name: 'للحذف',
          order: 99,
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/grades/${grade.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);

      // Verify deletion
      const deleted = await testPrisma.grade.findUnique({
        where: { id: grade.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent grade', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/grades/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
