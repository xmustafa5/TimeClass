import { describe, it, expect } from 'vitest';
import { testPrisma } from '../setup.js';

describe('Period Model', () => {
  const createPeriod = async (number: number, startTime: string, endTime: string) => {
    return testPrisma.period.create({
      data: {
        id: crypto.randomUUID(),
        number,
        startTime,
        endTime,
      },
    });
  };

  describe('Create', () => {
    it('should create a period', async () => {
      const period = await createPeriod(1, '07:30', '08:15');

      expect(period).toBeDefined();
      expect(period.number).toBe(1);
      expect(period.startTime).toBe('07:30');
      expect(period.endTime).toBe('08:15');
    });

    it('should enforce unique period numbers', async () => {
      await createPeriod(1, '07:30', '08:15');

      await expect(createPeriod(1, '08:00', '08:45')).rejects.toThrow();
    });

    it('should allow different period numbers', async () => {
      const period1 = await createPeriod(1, '07:30', '08:15');
      const period2 = await createPeriod(2, '08:20', '09:05');
      const period3 = await createPeriod(3, '09:10', '09:55');

      expect(period1.number).toBe(1);
      expect(period2.number).toBe(2);
      expect(period3.number).toBe(3);
    });
  });

  describe('Read', () => {
    it('should return periods ordered by number', async () => {
      await createPeriod(3, '09:10', '09:55');
      await createPeriod(1, '07:30', '08:15');
      await createPeriod(2, '08:20', '09:05');

      const periods = await testPrisma.period.findMany({
        orderBy: { number: 'asc' },
      });

      expect(periods).toHaveLength(3);
      expect(periods[0].number).toBe(1);
      expect(periods[1].number).toBe(2);
      expect(periods[2].number).toBe(3);
    });

    it('should find period by number', async () => {
      await createPeriod(1, '07:30', '08:15');
      await createPeriod(2, '08:20', '09:05');

      const period = await testPrisma.period.findUnique({
        where: { number: 2 },
      });

      expect(period).toBeDefined();
      expect(period?.startTime).toBe('08:20');
    });
  });

  describe('Update', () => {
    it('should update period times', async () => {
      const period = await createPeriod(1, '07:30', '08:15');

      const updated = await testPrisma.period.update({
        where: { id: period.id },
        data: {
          startTime: '08:00',
          endTime: '08:45',
        },
      });

      expect(updated.startTime).toBe('08:00');
      expect(updated.endTime).toBe('08:45');
    });
  });

  describe('Delete', () => {
    it('should delete a period', async () => {
      const period = await createPeriod(1, '07:30', '08:15');

      await testPrisma.period.delete({ where: { id: period.id } });

      const found = await testPrisma.period.findUnique({ where: { id: period.id } });
      expect(found).toBeNull();
    });
  });

  describe('Full Day Schedule', () => {
    it('should create a complete 7-period day', async () => {
      const periods = [
        { number: 1, startTime: '07:30', endTime: '08:15' },
        { number: 2, startTime: '08:20', endTime: '09:05' },
        { number: 3, startTime: '09:10', endTime: '09:55' },
        { number: 4, startTime: '10:15', endTime: '11:00' }, // After break
        { number: 5, startTime: '11:05', endTime: '11:50' },
        { number: 6, startTime: '11:55', endTime: '12:40' },
        { number: 7, startTime: '12:45', endTime: '13:30' },
      ];

      for (const p of periods) {
        await createPeriod(p.number, p.startTime, p.endTime);
      }

      const allPeriods = await testPrisma.period.findMany({
        orderBy: { number: 'asc' },
      });

      expect(allPeriods).toHaveLength(7);
      expect(allPeriods[0].startTime).toBe('07:30');
      expect(allPeriods[6].endTime).toBe('13:30');
    });
  });
});
