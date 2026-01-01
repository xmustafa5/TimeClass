import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testPrisma } from '../setup.js';
import { buildTestApp } from './test-app.js';

describe('Periods API', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeEach(async () => {
    app = await buildTestApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /api/periods', () => {
    it('should return empty list when no periods exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/periods',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
    });

    it('should return periods sorted by number', async () => {
      await testPrisma.period.create({
        data: {
          number: 2,
          startTime: '09:00',
          endTime: '09:45',
        },
      });

      await testPrisma.period.create({
        data: {
          number: 1,
          startTime: '08:00',
          endTime: '08:45',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/periods',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(2);
      expect(body.data[0].number).toBe(1);
      expect(body.data[1].number).toBe(2);
    });
  });

  describe('GET /api/periods/:id', () => {
    it('should return period by ID', async () => {
      const period = await testPrisma.period.create({
        data: {
          number: 3,
          startTime: '10:00',
          endTime: '10:45',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/periods/${period.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.number).toBe(3);
    });

    it('should return 404 for non-existent period', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/periods/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/periods', () => {
    it('should create a new period', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/periods',
        payload: {
          number: 4,
          startTime: '11:00',
          endTime: '11:45',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.number).toBe(4);
      expect(body.data.startTime).toBe('11:00');
      expect(body.data.endTime).toBe('11:45');
    });

    it('should return 400 for invalid time format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/periods',
        payload: {
          number: 5,
          startTime: '25:00', // Invalid hour
          endTime: '11:45',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for start time after end time', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/periods',
        payload: {
          number: 5,
          startTime: '12:00',
          endTime: '11:00', // End before start
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 409 for duplicate period number', async () => {
      await testPrisma.period.create({
        data: {
          number: 6,
          startTime: '13:00',
          endTime: '13:45',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/periods',
        payload: {
          number: 6,
          startTime: '14:00',
          endTime: '14:45',
        },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return 409 for overlapping time', async () => {
      await testPrisma.period.create({
        data: {
          number: 7,
          startTime: '15:00',
          endTime: '15:45',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/periods',
        payload: {
          number: 8,
          startTime: '15:30', // Overlaps with period 7
          endTime: '16:15',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.payload);
      expect(body.error).toContain('يتعارض');
    });
  });

  describe('PUT /api/periods/:id', () => {
    it('should update an existing period', async () => {
      const period = await testPrisma.period.create({
        data: {
          number: 9,
          startTime: '16:00',
          endTime: '16:45',
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/periods/${period.id}`,
        payload: {
          startTime: '16:15',
          endTime: '17:00',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.startTime).toBe('16:15');
      expect(body.data.endTime).toBe('17:00');
    });

    it('should return 404 for non-existent period', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/periods/00000000-0000-0000-0000-000000000000',
        payload: {
          startTime: '08:00',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 for invalid time update', async () => {
      const period = await testPrisma.period.create({
        data: {
          number: 10,
          startTime: '17:00',
          endTime: '17:45',
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/periods/${period.id}`,
        payload: {
          startTime: '18:00', // Will be after existing endTime
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/periods/:id', () => {
    it('should delete an existing period', async () => {
      const period = await testPrisma.period.create({
        data: {
          number: 99,
          startTime: '20:00',
          endTime: '20:45',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/periods/${period.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);

      // Verify deletion
      const deleted = await testPrisma.period.findUnique({
        where: { id: period.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent period', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/periods/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
