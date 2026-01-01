import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testPrisma } from '../setup.js';
import { buildTestApp } from './test-app.js';

describe('Rooms API', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeEach(async () => {
    app = await buildTestApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /api/rooms', () => {
    it('should return empty list when no rooms exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/rooms',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.rooms).toBeInstanceOf(Array);
    });

    it('should return paginated rooms', async () => {
      await testPrisma.room.create({
        data: {
          name: 'قاعة 101',
          capacity: 30,
          type: 'regular',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/rooms?page=1&limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.rooms.length).toBeGreaterThan(0);
    });

    it('should filter rooms by type', async () => {
      await testPrisma.room.create({
        data: {
          name: 'معمل حاسوب 1',
          capacity: 25,
          type: 'computer',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/rooms?type=computer',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.rooms.every((r: { type: string }) => r.type === 'computer')).toBe(true);
    });
  });

  describe('GET /api/rooms/by-type/:type', () => {
    it('should return rooms of specific type', async () => {
      await testPrisma.room.create({
        data: {
          name: 'معمل علوم 1',
          capacity: 20,
          type: 'lab',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/rooms/by-type/lab',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.every((r: { type: string }) => r.type === 'lab')).toBe(true);
    });

    it('should return 400 for invalid room type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/rooms/by-type/invalid',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/rooms/:id', () => {
    it('should return room by ID', async () => {
      const room = await testPrisma.room.create({
        data: {
          name: 'قاعة 102',
          capacity: 35,
          type: 'regular',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/rooms/${room.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('قاعة 102');
    });

    it('should return 404 for non-existent room', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/rooms/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/rooms', () => {
    it('should create a new room', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/rooms',
        payload: {
          name: 'قاعة 103',
          capacity: 40,
          type: 'regular',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('قاعة 103');
      expect(body.data.capacity).toBe(40);
    });

    it('should create room with default values', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/rooms',
        payload: {
          name: 'قاعة افتراضية',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.capacity).toBe(30); // Default capacity
      expect(body.data.type).toBe('regular'); // Default type
    });

    it('should return 400 for invalid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/rooms',
        payload: {
          name: '', // Empty name
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 409 for duplicate room name', async () => {
      await testPrisma.room.create({
        data: {
          name: 'قاعة مكررة',
          capacity: 30,
          type: 'regular',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/rooms',
        payload: {
          name: 'قاعة مكررة',
        },
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('PUT /api/rooms/:id', () => {
    it('should update an existing room', async () => {
      const room = await testPrisma.room.create({
        data: {
          name: 'قاعة للتحديث',
          capacity: 30,
          type: 'regular',
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/rooms/${room.id}`,
        payload: {
          name: 'قاعة محدثة',
          capacity: 50,
          type: 'lab',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('قاعة محدثة');
      expect(body.data.capacity).toBe(50);
      expect(body.data.type).toBe('lab');
    });

    it('should return 404 for non-existent room', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/rooms/00000000-0000-0000-0000-000000000000',
        payload: {
          name: 'قاعة جديدة',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/rooms/:id', () => {
    it('should delete an existing room', async () => {
      const room = await testPrisma.room.create({
        data: {
          name: 'للحذف',
          capacity: 30,
          type: 'regular',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/rooms/${room.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);

      // Verify deletion
      const deleted = await testPrisma.room.findUnique({
        where: { id: room.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent room', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/rooms/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
