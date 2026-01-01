import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testPrisma } from '../setup.js';
import { buildTestApp } from './test-app.js';

describe('Sections API', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;
  let testGradeId: string;

  beforeEach(async () => {
    app = await buildTestApp();
    await app.ready();

    // Create a test grade for sections
    const grade = await testPrisma.grade.create({
      data: {
        name: `صف اختبار ${Date.now()}`,
        order: 1,
      },
    });
    testGradeId = grade.id;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /api/sections', () => {
    it('should return paginated sections with grade info', async () => {
      await testPrisma.section.create({
        data: {
          name: 'أ',
          gradeId: testGradeId,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/sections?page=1&limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.sections).toBeInstanceOf(Array);
      expect(body.data.sections.length).toBeGreaterThan(0);
      expect(body.data.sections[0].grade).toBeDefined();
    });
  });

  describe('GET /api/sections/by-grade/:gradeId', () => {
    it('should return sections for a specific grade', async () => {
      await testPrisma.section.create({
        data: {
          name: 'ب',
          gradeId: testGradeId,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/sections/by-grade/${testGradeId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent grade', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/sections/by-grade/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/sections/:id', () => {
    it('should return section with grade info by ID', async () => {
      const section = await testPrisma.section.create({
        data: {
          name: 'ج',
          gradeId: testGradeId,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/sections/${section.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('ج');
      expect(body.data.grade).toBeDefined();
    });

    it('should return 404 for non-existent section', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/sections/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/sections', () => {
    it('should create a new section', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/sections',
        payload: {
          name: 'د',
          gradeId: testGradeId,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('د');
      expect(body.data.grade).toBeDefined();
    });

    it('should return 404 for non-existent grade', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/sections',
        payload: {
          name: 'هـ',
          gradeId: '00000000-0000-0000-0000-000000000000',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 409 for duplicate section name in same grade', async () => {
      await testPrisma.section.create({
        data: {
          name: 'و',
          gradeId: testGradeId,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/sections',
        payload: {
          name: 'و',
          gradeId: testGradeId,
        },
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('PUT /api/sections/:id', () => {
    it('should update an existing section', async () => {
      const section = await testPrisma.section.create({
        data: {
          name: 'ز',
          gradeId: testGradeId,
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/sections/${section.id}`,
        payload: {
          name: 'ز - معدل',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('ز - معدل');
    });

    it('should return 404 for non-existent section', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/sections/00000000-0000-0000-0000-000000000000',
        payload: {
          name: 'جديد',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/sections/:id', () => {
    it('should delete an existing section', async () => {
      const section = await testPrisma.section.create({
        data: {
          name: 'للحذف',
          gradeId: testGradeId,
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/sections/${section.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);

      // Verify deletion
      const deleted = await testPrisma.section.findUnique({
        where: { id: section.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent section', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/sections/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
