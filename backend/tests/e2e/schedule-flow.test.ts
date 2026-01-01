import { describe, it, expect, beforeEach } from 'vitest';
import { buildTestApp } from '../api/test-app.js';
import { testPrisma } from '../setup.js';
import type { FastifyInstance } from 'fastify';

/**
 * End-to-End Tests for Critical Schedule Flows
 * These tests simulate real-world scenarios and user interactions
 */
describe('E2E: Schedule Management Flow', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildTestApp();
    await app.ready();
  });

  describe('Complete Schedule Setup Flow', () => {
    it('should successfully set up a complete schedule from scratch', async () => {
      // Step 1: Create a teacher
      const teacherResponse = await app.inject({
        method: 'POST',
        url: '/api/teachers',
        payload: {
          fullName: 'أحمد محمد الخالد',
          subject: 'رياضيات',
          weeklyPeriods: 20,
          workDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        },
      });

      expect(teacherResponse.statusCode).toBe(201);
      const teacher = JSON.parse(teacherResponse.body).data;
      expect(teacher.id).toBeDefined();

      // Step 2: Create a grade
      const gradeResponse = await app.inject({
        method: 'POST',
        url: '/api/grades',
        payload: {
          name: 'الصف الأول الابتدائي',
          order: 1,
        },
      });

      expect(gradeResponse.statusCode).toBe(201);
      const grade = JSON.parse(gradeResponse.body).data;

      // Step 3: Create a section
      const sectionResponse = await app.inject({
        method: 'POST',
        url: '/api/sections',
        payload: {
          name: 'أ',
          gradeId: grade.id,
        },
      });

      expect(sectionResponse.statusCode).toBe(201);
      const section = JSON.parse(sectionResponse.body).data;

      // Step 4: Create a room
      const roomResponse = await app.inject({
        method: 'POST',
        url: '/api/rooms',
        payload: {
          name: 'قاعة 101',
          capacity: 30,
          type: 'regular',
        },
      });

      expect(roomResponse.statusCode).toBe(201);
      const room = JSON.parse(roomResponse.body).data;

      // Step 5: Create a period
      const periodResponse = await app.inject({
        method: 'POST',
        url: '/api/periods',
        payload: {
          number: 1,
          startTime: '08:00',
          endTime: '08:45',
        },
      });

      expect(periodResponse.statusCode).toBe(201);
      const period = JSON.parse(periodResponse.body).data;

      // Step 6: Create a schedule entry
      const scheduleResponse = await app.inject({
        method: 'POST',
        url: '/api/schedule',
        payload: {
          teacherId: teacher.id,
          gradeId: grade.id,
          sectionId: section.id,
          roomId: room.id,
          periodId: period.id,
          day: 'sunday',
          subject: 'رياضيات',
        },
      });

      expect(scheduleResponse.statusCode).toBe(201);
      const scheduleEntry = JSON.parse(scheduleResponse.body).data;
      expect(scheduleEntry.teacher.fullName).toBe('أحمد محمد الخالد');

      // Step 7: Verify schedule appears in teacher's schedule
      const teacherScheduleResponse = await app.inject({
        method: 'GET',
        url: `/api/schedule/by-teacher/${teacher.id}`,
      });

      expect(teacherScheduleResponse.statusCode).toBe(200);
      const teacherSchedule = JSON.parse(teacherScheduleResponse.body).data;
      expect(teacherSchedule).toHaveLength(1);
      expect(teacherSchedule[0].id).toBe(scheduleEntry.id);

      // Step 8: Verify statistics are updated
      const statsResponse = await app.inject({
        method: 'GET',
        url: '/api/stats/overview',
      });

      expect(statsResponse.statusCode).toBe(200);
      const stats = JSON.parse(statsResponse.body).data;
      expect(stats.totalTeachers).toBe(1);
      expect(stats.totalScheduleEntries).toBe(1);
    });
  });

  describe('Conflict Prevention Flow', () => {
    it('should prevent scheduling conflicts in real scenarios', async () => {
      // Setup base data
      const teacher1 = await testPrisma.teacher.create({
        data: {
          fullName: 'مدرس أول',
          subject: 'رياضيات',
          weeklyPeriods: 20,
          workDays: JSON.stringify(['sunday', 'monday', 'tuesday']),
        },
      });

      const teacher2 = await testPrisma.teacher.create({
        data: {
          fullName: 'مدرس ثاني',
          subject: 'علوم',
          weeklyPeriods: 18,
          workDays: JSON.stringify(['sunday', 'monday', 'tuesday']),
        },
      });

      const grade = await testPrisma.grade.create({
        data: { name: 'الصف الأول', order: 1 },
      });

      const section = await testPrisma.section.create({
        data: { name: 'أ', gradeId: grade.id },
      });

      const room = await testPrisma.room.create({
        data: { name: 'قاعة 101', capacity: 30, type: 'regular' },
      });

      const period = await testPrisma.period.create({
        data: { number: 1, startTime: '08:00', endTime: '08:45' },
      });

      // Create first schedule entry
      const firstEntryResponse = await app.inject({
        method: 'POST',
        url: '/api/schedule',
        payload: {
          teacherId: teacher1.id,
          gradeId: grade.id,
          sectionId: section.id,
          roomId: room.id,
          periodId: period.id,
          day: 'sunday',
          subject: 'رياضيات',
        },
      });

      expect(firstEntryResponse.statusCode).toBe(201);

      // Try to create conflicting entry (same room, same time)
      const conflictResponse = await app.inject({
        method: 'POST',
        url: '/api/schedule',
        payload: {
          teacherId: teacher2.id,
          gradeId: grade.id,
          sectionId: section.id,
          roomId: room.id, // Same room
          periodId: period.id, // Same period
          day: 'sunday', // Same day
          subject: 'علوم',
        },
      });

      expect(conflictResponse.statusCode).toBe(409);
      const conflictBody = JSON.parse(conflictResponse.body);
      expect(conflictBody.success).toBe(false);

      // Verify only one entry exists
      const scheduleResponse = await app.inject({
        method: 'GET',
        url: '/api/schedule',
      });

      const schedule = JSON.parse(scheduleResponse.body).data;
      expect(schedule.total).toBe(1);
    });
  });

  describe('Bulk Operations Flow', () => {
    it('should handle bulk teacher creation successfully', async () => {
      const bulkResponse = await app.inject({
        method: 'POST',
        url: '/api/teachers/bulk',
        payload: {
          teachers: [
            {
              fullName: 'مدرس رياضيات',
              subject: 'رياضيات',
              weeklyPeriods: 20,
              workDays: ['sunday', 'monday', 'tuesday'],
            },
            {
              fullName: 'مدرس علوم',
              subject: 'علوم',
              weeklyPeriods: 18,
              workDays: ['sunday', 'wednesday', 'thursday'],
            },
            {
              fullName: 'مدرس لغة عربية',
              subject: 'لغة عربية',
              weeklyPeriods: 22,
              workDays: ['monday', 'tuesday', 'thursday'],
            },
          ],
        },
      });

      expect(bulkResponse.statusCode).toBe(201);
      const result = JSON.parse(bulkResponse.body);
      expect(result.data.created).toBe(3);

      // Verify teachers exist
      const teachersResponse = await app.inject({
        method: 'GET',
        url: '/api/teachers',
      });

      const teachers = JSON.parse(teachersResponse.body).data;
      expect(teachers.total).toBe(3);
    });
  });

  describe('Export Flow', () => {
    it('should export schedule data in multiple formats', async () => {
      // Setup data
      const teacher = await testPrisma.teacher.create({
        data: {
          fullName: 'مدرس الرياضيات',
          subject: 'رياضيات',
          weeklyPeriods: 20,
          workDays: JSON.stringify(['sunday', 'monday']),
        },
      });

      const grade = await testPrisma.grade.create({
        data: { name: 'الصف الأول', order: 1 },
      });

      const section = await testPrisma.section.create({
        data: { name: 'أ', gradeId: grade.id },
      });

      const room = await testPrisma.room.create({
        data: { name: 'قاعة 101', capacity: 30, type: 'regular' },
      });

      const period = await testPrisma.period.create({
        data: { number: 1, startTime: '08:00', endTime: '08:45' },
      });

      await testPrisma.scheduleEntry.create({
        data: {
          teacherId: teacher.id,
          gradeId: grade.id,
          sectionId: section.id,
          roomId: room.id,
          periodId: period.id,
          day: 'sunday',
          subject: 'رياضيات',
        },
      });

      // Test JSON export
      const jsonExportResponse = await app.inject({
        method: 'GET',
        url: '/api/schedule/export/json',
      });

      expect(jsonExportResponse.statusCode).toBe(200);
      const jsonExport = JSON.parse(jsonExportResponse.body).data;
      expect(jsonExport.count).toBe(1);
      expect(jsonExport.data[0].teacherName).toBe('مدرس الرياضيات');

      // Test CSV export
      const csvExportResponse = await app.inject({
        method: 'GET',
        url: '/api/schedule/export/csv',
      });

      expect(csvExportResponse.statusCode).toBe(200);
      expect(csvExportResponse.headers['content-type']).toContain('text/csv');

      // Test weekly export
      const weeklyExportResponse = await app.inject({
        method: 'GET',
        url: '/api/schedule/export/weekly',
      });

      expect(weeklyExportResponse.statusCode).toBe(200);
      const weeklyExport = JSON.parse(weeklyExportResponse.body).data;
      expect(weeklyExport.schedule.sunday).toHaveLength(1);
    });
  });

  describe('Statistics Flow', () => {
    it('should provide accurate statistics for school administrators', async () => {
      // Create comprehensive test data
      const teachers = await Promise.all([
        testPrisma.teacher.create({
          data: {
            fullName: 'مدرس 1',
            subject: 'رياضيات',
            weeklyPeriods: 20,
            workDays: JSON.stringify(['sunday', 'monday', 'tuesday']),
          },
        }),
        testPrisma.teacher.create({
          data: {
            fullName: 'مدرس 2',
            subject: 'علوم',
            weeklyPeriods: 18,
            workDays: JSON.stringify(['sunday', 'wednesday', 'thursday']),
          },
        }),
      ]);

      const grade = await testPrisma.grade.create({
        data: { name: 'الصف الأول', order: 1 },
      });

      const sections = await Promise.all([
        testPrisma.section.create({ data: { name: 'أ', gradeId: grade.id } }),
        testPrisma.section.create({ data: { name: 'ب', gradeId: grade.id } }),
      ]);

      const rooms = await Promise.all([
        testPrisma.room.create({ data: { name: 'قاعة 101', capacity: 30, type: 'regular' } }),
        testPrisma.room.create({ data: { name: 'معمل العلوم', capacity: 25, type: 'lab' } }),
      ]);

      const period = await testPrisma.period.create({
        data: { number: 1, startTime: '08:00', endTime: '08:45' },
      });

      // Create schedule entries
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId: teachers[0].id,
          gradeId: grade.id,
          sectionId: sections[0].id,
          roomId: rooms[0].id,
          periodId: period.id,
          day: 'sunday',
          subject: 'رياضيات',
        },
      });

      // Get overview stats
      const overviewResponse = await app.inject({
        method: 'GET',
        url: '/api/stats/overview',
      });

      expect(overviewResponse.statusCode).toBe(200);
      const overview = JSON.parse(overviewResponse.body).data;
      expect(overview.totalTeachers).toBe(2);
      expect(overview.totalSections).toBe(2);
      expect(overview.totalRooms).toBe(2);
      expect(overview.totalScheduleEntries).toBe(1);

      // Get teacher stats
      const teacherStatsResponse = await app.inject({
        method: 'GET',
        url: '/api/stats/teachers',
      });

      expect(teacherStatsResponse.statusCode).toBe(200);
      const teacherStats = JSON.parse(teacherStatsResponse.body).data;
      expect(teacherStats).toHaveLength(2);

      // First teacher should have 1 scheduled period
      const teacher1Stats = teacherStats.find(
        (t: { teacherId: string }) => t.teacherId === teachers[0].id
      );
      expect(teacher1Stats.scheduledPeriods).toBe(1);

      // Get unused slots
      const unusedSlotsResponse = await app.inject({
        method: 'GET',
        url: '/api/stats/unused-slots',
      });

      expect(unusedSlotsResponse.statusCode).toBe(200);
      const unusedSlots = JSON.parse(unusedSlotsResponse.body).data;
      expect(unusedSlots.length).toBeGreaterThan(0);
    });
  });
});
