import { describe, it, expect } from 'vitest';
import { testPrisma } from '../setup.js';

describe('Room Model', () => {
  const createRoom = async (data?: Partial<{
    name: string;
    capacity: number;
    type: string;
  }>) => {
    return testPrisma.room.create({
      data: {
        id: crypto.randomUUID(),
        name: data?.name ?? `قاعة ${crypto.randomUUID().slice(0, 4)}`,
        capacity: data?.capacity ?? 30,
        type: data?.type ?? 'regular',
      },
    });
  };

  describe('Create', () => {
    it('should create a regular room', async () => {
      const room = await createRoom({
        name: 'قاعة 101',
        capacity: 30,
        type: 'regular',
      });

      expect(room).toBeDefined();
      expect(room.name).toBe('قاعة 101');
      expect(room.capacity).toBe(30);
      expect(room.type).toBe('regular');
    });

    it('should create a lab room', async () => {
      const room = await createRoom({
        name: 'مختبر العلوم',
        capacity: 20,
        type: 'lab',
      });

      expect(room.type).toBe('lab');
      expect(room.capacity).toBe(20);
    });

    it('should create a computer room', async () => {
      const room = await createRoom({
        name: 'معمل الحاسب',
        capacity: 25,
        type: 'computer',
      });

      expect(room.type).toBe('computer');
    });

    it('should enforce unique room names', async () => {
      await createRoom({ name: 'قاعة 101' });

      await expect(createRoom({ name: 'قاعة 101' })).rejects.toThrow();
    });

    it('should default capacity to 30', async () => {
      const room = await testPrisma.room.create({
        data: {
          id: crypto.randomUUID(),
          name: 'قاعة جديدة',
        },
      });

      expect(room.capacity).toBe(30);
    });

    it('should default type to regular', async () => {
      const room = await testPrisma.room.create({
        data: {
          id: crypto.randomUUID(),
          name: 'قاعة أخرى',
        },
      });

      expect(room.type).toBe('regular');
    });
  });

  describe('Read', () => {
    it('should filter rooms by type', async () => {
      await createRoom({ name: 'قاعة 101', type: 'regular' });
      await createRoom({ name: 'قاعة 102', type: 'regular' });
      await createRoom({ name: 'مختبر', type: 'lab' });
      await createRoom({ name: 'معمل حاسب', type: 'computer' });

      const regularRooms = await testPrisma.room.findMany({
        where: { type: 'regular' },
      });

      const labRooms = await testPrisma.room.findMany({
        where: { type: 'lab' },
      });

      expect(regularRooms).toHaveLength(2);
      expect(labRooms).toHaveLength(1);
    });

    it('should filter rooms by minimum capacity', async () => {
      await createRoom({ name: 'Small', capacity: 15 });
      await createRoom({ name: 'Medium', capacity: 25 });
      await createRoom({ name: 'Large', capacity: 40 });

      const largeRooms = await testPrisma.room.findMany({
        where: { capacity: { gte: 25 } },
      });

      expect(largeRooms).toHaveLength(2);
    });
  });

  describe('Update', () => {
    it('should update room capacity', async () => {
      const room = await createRoom({ name: 'قاعة 101', capacity: 30 });

      const updated = await testPrisma.room.update({
        where: { id: room.id },
        data: { capacity: 35 },
      });

      expect(updated.capacity).toBe(35);
    });

    it('should update room type', async () => {
      const room = await createRoom({ name: 'قاعة 101', type: 'regular' });

      const updated = await testPrisma.room.update({
        where: { id: room.id },
        data: { type: 'lab' },
      });

      expect(updated.type).toBe('lab');
    });
  });

  describe('Delete', () => {
    it('should delete a room', async () => {
      const room = await createRoom({ name: 'قاعة للحذف' });

      await testPrisma.room.delete({ where: { id: room.id } });

      const found = await testPrisma.room.findUnique({ where: { id: room.id } });
      expect(found).toBeNull();
    });
  });
});
