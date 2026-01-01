import { describe, it, expect, beforeEach } from 'vitest';
import { buildTestApp } from './test-app.js';
import { testPrisma } from '../setup.js';
import type { FastifyInstance } from 'fastify';

describe('Statistics API', () => {
  let app: FastifyInstance;
  let teacherId: string;
  let gradeId: string;
  let sectionId: string;
  let roomId: string;
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
        workDays: JSON.stringify(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']),
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

    const room = await testPrisma.room.create({
      data: { name: 'قاعة 101', capacity: 30, type: 'regular' },
    });
    roomId = room.id;

    const period = await testPrisma.period.create({
      data: { number: 1, startTime: '08:00', endTime: '08:45' },
    });
    periodId = period.id;
  });

  describe('GET /api/stats/overview', () => {
    it('should return overview statistics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/overview',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.totalTeachers).toBe(1);
      expect(body.data.totalGrades).toBe(1);
      expect(body.data.totalSections).toBe(1);
      expect(body.data.totalRooms).toBe(1);
      expect(body.data.totalPeriods).toBe(1);
      expect(body.data.totalScheduleEntries).toBe(0);
      expect(body.data.entriesByDay).toBeDefined();
      expect(body.data.busyPeriods).toBeDefined();
    });

    it('should update stats when schedule entries exist', async () => {
      // Create schedule entries
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId,
          gradeId,
          sectionId,
          roomId,
          periodId,
          day: 'sunday',
          subject: 'رياضيات',
        },
      });

      await testPrisma.scheduleEntry.create({
        data: {
          teacherId,
          gradeId,
          sectionId,
          roomId,
          periodId,
          day: 'monday',
          subject: 'رياضيات',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/overview',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.totalScheduleEntries).toBe(2);
      expect(body.data.entriesByDay.sunday).toBe(1);
      expect(body.data.entriesByDay.monday).toBe(1);
      expect(body.data.averageTeacherUtilization).toBeGreaterThan(0);
    });
  });

  describe('GET /api/stats/teachers', () => {
    it('should return teacher statistics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/teachers',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].teacherName).toBe('أحمد محمد');
      expect(body.data[0].weeklyPeriods).toBe(20);
      expect(body.data[0].scheduledPeriods).toBe(0);
      expect(body.data[0].remainingPeriods).toBe(20);
      expect(body.data[0].utilizationPercentage).toBe(0);
    });

    it('should calculate teacher utilization correctly', async () => {
      // Create 5 schedule entries for the teacher
      const period2 = await testPrisma.period.create({
        data: { number: 2, startTime: '09:00', endTime: '09:45' },
      });

      for (const day of ['sunday', 'monday'] as const) {
        await testPrisma.scheduleEntry.create({
          data: {
            teacherId,
            gradeId,
            sectionId,
            roomId,
            periodId,
            day,
            subject: 'رياضيات',
          },
        });
        await testPrisma.scheduleEntry.create({
          data: {
            teacherId,
            gradeId,
            sectionId,
            roomId,
            periodId: period2.id,
            day,
            subject: 'رياضيات',
          },
        });
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/teachers',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].scheduledPeriods).toBe(4);
      expect(body.data[0].remainingPeriods).toBe(16);
      expect(body.data[0].utilizationPercentage).toBe(20); // 4/20 = 20%
      expect(body.data[0].periodsByDay.sunday).toBe(2);
      expect(body.data[0].periodsByDay.monday).toBe(2);
    });
  });

  describe('GET /api/stats/rooms', () => {
    it('should return room statistics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/rooms',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].roomName).toBe('قاعة 101');
      expect(body.data[0].capacity).toBe(30);
      expect(body.data[0].scheduledPeriods).toBe(0);
    });

    it('should calculate room utilization', async () => {
      // Create schedule entries
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId,
          gradeId,
          sectionId,
          roomId,
          periodId,
          day: 'sunday',
          subject: 'رياضيات',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/rooms',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].scheduledPeriods).toBe(1);
      expect(body.data[0].periodsByDay.sunday).toBe(1);
    });
  });

  describe('GET /api/stats/unused-slots', () => {
    it('should return unused time slots', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/unused-slots',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
      // Should have slots for all 5 days x 1 period = 5 slots
      // (all available since no entries exist and teacher works all days)
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('should show reduced availability when slots are used', async () => {
      // Create a schedule entry for sunday period 1
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId,
          gradeId,
          sectionId,
          roomId,
          periodId,
          day: 'sunday',
          subject: 'رياضيات',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/unused-slots',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Sunday period 1 should not be in unused slots (or have fewer available)
      const sundaySlot = body.data.find(
        (s: { day: string; periodNumber: number }) => s.day === 'sunday' && s.periodNumber === 1
      );

      // If the slot exists, the room and teacher should NOT be available
      if (sundaySlot) {
        expect(sundaySlot.availableRooms.find((r: { id: string }) => r.id === roomId)).toBeUndefined();
        expect(sundaySlot.availableTeachers.find((t: { id: string }) => t.id === teacherId)).toBeUndefined();
      }
    });
  });
});
