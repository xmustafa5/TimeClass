import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testPrisma } from '../setup.js';
import { buildTestApp } from './test-app.js';

describe('Schedule API', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;
  let testTeacherId: string;
  let testGradeId: string;
  let testSectionId: string;
  let testRoomId: string;
  let testPeriodId: string;

  // Helper to create test data
  async function createTestData() {
    const teacher = await testPrisma.teacher.create({
      data: {
        fullName: 'مدرس اختبار',
        subject: 'الرياضيات',
        weeklyPeriods: 20,
        workDays: JSON.stringify(['sunday', 'monday', 'tuesday']),
      },
    });
    testTeacherId = teacher.id;

    const grade = await testPrisma.grade.create({
      data: { name: 'الصف الأول', order: 1 },
    });
    testGradeId = grade.id;

    const section = await testPrisma.section.create({
      data: { name: 'أ', gradeId: grade.id },
    });
    testSectionId = section.id;

    const room = await testPrisma.room.create({
      data: { name: 'قاعة 101', capacity: 30, type: 'regular' },
    });
    testRoomId = room.id;

    const period = await testPrisma.period.create({
      data: { number: 1, startTime: '08:00', endTime: '08:45' },
    });
    testPeriodId = period.id;
  }

  beforeEach(async () => {
    app = await buildTestApp();
    await app.ready();
    await createTestData();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /api/schedule', () => {
    it('should return empty list when no entries exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/schedule',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.entries).toBeInstanceOf(Array);
      expect(body.data.entries.length).toBe(0);
    });

    it('should return paginated schedule entries', async () => {
      // Create a schedule entry
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/schedule?page=1&limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.entries.length).toBe(1);
      expect(body.data.page).toBe(1);
    });
  });

  describe('GET /api/schedule/:id', () => {
    it('should return 404 for non-existent entry', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/schedule/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return schedule entry by ID', async () => {
      const entry = await testPrisma.scheduleEntry.create({
        data: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/schedule/${entry.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.subject).toBe('الرياضيات');
    });
  });

  describe('POST /api/schedule', () => {
    it('should create a new schedule entry', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/schedule',
        payload: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.subject).toBe('الرياضيات');
      expect(body.data.teacher.fullName).toBe('مدرس اختبار');
    });

    it('should return 400 for invalid references', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/schedule',
        payload: {
          teacherId: '00000000-0000-0000-0000-000000000000',
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error).toContain('المدرس غير موجود');
    });

    it('should return 409 for teacher conflict', async () => {
      // Create first entry
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      // Create another section for conflict test
      const section2 = await testPrisma.section.create({
        data: { name: 'ب', gradeId: testGradeId },
      });

      const room2 = await testPrisma.room.create({
        data: { name: 'قاعة 102', capacity: 30, type: 'regular' },
      });

      // Try to assign same teacher to same day/period
      const response = await app.inject({
        method: 'POST',
        url: '/api/schedule',
        payload: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: section2.id,
          roomId: room2.id,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الفيزياء',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error).toContain('المدرس');
    });

    it('should return 409 for room conflict', async () => {
      // Create first entry
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      // Create another teacher and section
      const teacher2 = await testPrisma.teacher.create({
        data: {
          fullName: 'مدرس آخر',
          subject: 'العلوم',
          weeklyPeriods: 20,
          workDays: JSON.stringify(['sunday']),
        },
      });

      const section2 = await testPrisma.section.create({
        data: { name: 'ج', gradeId: testGradeId },
      });

      // Try to use same room at same day/period
      const response = await app.inject({
        method: 'POST',
        url: '/api/schedule',
        payload: {
          teacherId: teacher2.id,
          gradeId: testGradeId,
          sectionId: section2.id,
          roomId: testRoomId, // Same room
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'العلوم',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error).toContain('القاعة');
    });

    it('should return 409 for section conflict', async () => {
      // Create first entry
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      // Create another teacher and room
      const teacher2 = await testPrisma.teacher.create({
        data: {
          fullName: 'مدرس آخر',
          subject: 'العلوم',
          weeklyPeriods: 20,
          workDays: JSON.stringify(['sunday']),
        },
      });

      const room2 = await testPrisma.room.create({
        data: { name: 'قاعة 103', capacity: 30, type: 'regular' },
      });

      // Try to schedule same section at same day/period
      const response = await app.inject({
        method: 'POST',
        url: '/api/schedule',
        payload: {
          teacherId: teacher2.id,
          gradeId: testGradeId,
          sectionId: testSectionId, // Same section
          roomId: room2.id,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'العلوم',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error).toContain('الشعبة');
    });
  });

  describe('POST /api/schedule/check-conflicts', () => {
    it('should return no conflicts for valid entry', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/schedule/check-conflicts',
        payload: {
          teacherId: testTeacherId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.hasConflict).toBe(false);
      expect(body.data.conflicts).toHaveLength(0);
    });

    it('should detect multiple conflicts', async () => {
      // Create an entry first
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      // Check for conflicts with same teacher, room, section
      const response = await app.inject({
        method: 'POST',
        url: '/api/schedule/check-conflicts',
        payload: {
          teacherId: testTeacherId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.hasConflict).toBe(true);
      expect(body.data.conflicts.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/schedule/:id', () => {
    it('should update schedule entry', async () => {
      const entry = await testPrisma.scheduleEntry.create({
        data: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/schedule/${entry.id}`,
        payload: {
          subject: 'الجبر',
          day: 'monday',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.subject).toBe('الجبر');
      expect(body.data.day).toBe('monday');
    });

    it('should return 404 for non-existent entry', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/schedule/00000000-0000-0000-0000-000000000000',
        payload: { subject: 'الجبر' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/schedule/:id', () => {
    it('should delete schedule entry', async () => {
      const entry = await testPrisma.scheduleEntry.create({
        data: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/schedule/${entry.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);

      // Verify deletion
      const deleted = await testPrisma.scheduleEntry.findUnique({
        where: { id: entry.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent entry', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/schedule/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/schedule/by-day/:day', () => {
    it('should return schedule for specific day', async () => {
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/schedule/by-day/sunday',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(1);
      expect(body.data[0].day).toBe('sunday');
    });

    it('should return empty array for day with no entries', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/schedule/by-day/thursday',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(0);
    });
  });

  describe('GET /api/schedule/by-teacher/:teacherId', () => {
    it('should return schedule for specific teacher', async () => {
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/schedule/by-teacher/${testTeacherId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(1);
    });

    it('should return 404 for non-existent teacher', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/schedule/by-teacher/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/schedule/by-section/:sectionId', () => {
    it('should return schedule for specific section', async () => {
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/schedule/by-section/${testSectionId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(1);
    });
  });

  describe('GET /api/schedule/by-room/:roomId', () => {
    it('should return schedule for specific room', async () => {
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/schedule/by-room/${testRoomId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(1);
    });
  });

  describe('GET /api/schedule/by-grade/:gradeId', () => {
    it('should return schedule for specific grade', async () => {
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/schedule/by-grade/${testGradeId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(1);
    });
  });

  describe('GET /api/schedule/weekly', () => {
    it('should return weekly schedule grouped by day', async () => {
      await testPrisma.scheduleEntry.create({
        data: {
          teacherId: testTeacherId,
          gradeId: testGradeId,
          sectionId: testSectionId,
          roomId: testRoomId,
          periodId: testPeriodId,
          day: 'sunday',
          subject: 'الرياضيات',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/schedule/weekly',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('sunday');
      expect(body.data).toHaveProperty('monday');
      expect(body.data).toHaveProperty('tuesday');
      expect(body.data.sunday.length).toBe(1);
    });
  });
});
