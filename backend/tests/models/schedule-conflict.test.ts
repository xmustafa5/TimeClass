import { describe, it, expect, beforeEach } from 'vitest';
import { testPrisma } from '../setup.js';

describe('Schedule Entry - Conflict Prevention', () => {
  // Test data holders
  let teacher1Id: string;
  let teacher2Id: string;
  let gradeId: string;
  let section1Id: string;
  let section2Id: string;
  let period1Id: string;
  let period2Id: string;

  // Set up test data before each test
  beforeEach(async () => {
    // Create teachers
    const teacher1 = await testPrisma.teacher.create({
      data: {
        id: crypto.randomUUID(),
        fullName: 'أحمد محمد',
        subject: 'الرياضيات',
        workDays: JSON.stringify(['sunday', 'monday']),
      },
    });
    teacher1Id = teacher1.id;

    const teacher2 = await testPrisma.teacher.create({
      data: {
        id: crypto.randomUUID(),
        fullName: 'سارة خالد',
        subject: 'العلوم',
        workDays: JSON.stringify(['sunday', 'monday']),
      },
    });
    teacher2Id = teacher2.id;

    // Create grade
    const grade = await testPrisma.grade.create({
      data: {
        id: crypto.randomUUID(),
        name: 'الصف الأول',
        order: 1,
      },
    });
    gradeId = grade.id;

    // Create sections
    const section1 = await testPrisma.section.create({
      data: {
        id: crypto.randomUUID(),
        name: 'أ',
        gradeId: grade.id,
      },
    });
    section1Id = section1.id;

    const section2 = await testPrisma.section.create({
      data: {
        id: crypto.randomUUID(),
        name: 'ب',
        gradeId: grade.id,
      },
    });
    section2Id = section2.id;

    // Create periods
    const period1 = await testPrisma.period.create({
      data: {
        id: crypto.randomUUID(),
        number: 1,
        startTime: '07:30',
        endTime: '08:15',
      },
    });
    period1Id = period1.id;

    const period2 = await testPrisma.period.create({
      data: {
        id: crypto.randomUUID(),
        number: 2,
        startTime: '08:20',
        endTime: '09:05',
      },
    });
    period2Id = period2.id;
  });

  const createScheduleEntry = async (data: {
    teacherId: string;
    sectionId: string;
    periodId: string;
    day: string;
  }) => {
    return testPrisma.scheduleEntry.create({
      data: {
        id: crypto.randomUUID(),
        subject: 'Test Subject',
        gradeId,
        ...data,
      },
    });
  };

  describe('Valid Schedule Entries', () => {
    it('should create a schedule entry successfully', async () => {
      const entry = await createScheduleEntry({
        teacherId: teacher1Id,
        sectionId: section1Id,
        periodId: period1Id,
        day: 'sunday',
      });

      expect(entry).toBeDefined();
      expect(entry.day).toBe('sunday');
    });

    it('should allow same teacher in different periods', async () => {
      // Teacher in period 1
      await createScheduleEntry({
        teacherId: teacher1Id,
        sectionId: section1Id,
        periodId: period1Id,
        day: 'sunday',
      });

      // Same teacher in period 2 - should work
      const entry2 = await createScheduleEntry({
        teacherId: teacher1Id,
        sectionId: section2Id,
        periodId: period2Id,
        day: 'sunday',
      });

      expect(entry2).toBeDefined();
    });

    it('should allow same teacher in same period on different days', async () => {
      // Teacher on Sunday
      await createScheduleEntry({
        teacherId: teacher1Id,
        sectionId: section1Id,
        periodId: period1Id,
        day: 'sunday',
      });

      // Same teacher, same period on Monday - should work
      const entry2 = await createScheduleEntry({
        teacherId: teacher1Id,
        sectionId: section2Id,
        periodId: period1Id,
        day: 'monday',
      });

      expect(entry2).toBeDefined();
    });

    it('should allow same section in different periods', async () => {
      // Section in period 1
      await createScheduleEntry({
        teacherId: teacher1Id,
        sectionId: section1Id,
        periodId: period1Id,
        day: 'sunday',
      });

      // Same section in period 2 - should work
      const entry2 = await createScheduleEntry({
        teacherId: teacher2Id,
        sectionId: section1Id,
        periodId: period2Id,
        day: 'sunday',
      });

      expect(entry2).toBeDefined();
    });
  });

  describe('Teacher Conflict (Same teacher, same day, same period)', () => {
    it('should prevent same teacher teaching two classes at the same time', async () => {
      // First entry
      await createScheduleEntry({
        teacherId: teacher1Id,
        sectionId: section1Id,
        periodId: period1Id,
        day: 'sunday',
      });

      // Same teacher, same day, same period - CONFLICT!
      await expect(
        createScheduleEntry({
          teacherId: teacher1Id, // Same teacher
          sectionId: section2Id, // Different section
          periodId: period1Id, // Same period
          day: 'sunday', // Same day
        })
      ).rejects.toThrow();
    });
  });

  describe('Section Conflict (Same section, same day, same period)', () => {
    it('should prevent same section having two classes at the same time', async () => {
      // First entry
      await createScheduleEntry({
        teacherId: teacher1Id,
        sectionId: section1Id,
        periodId: period1Id,
        day: 'sunday',
      });

      // Same section, same day, same period - CONFLICT!
      await expect(
        createScheduleEntry({
          teacherId: teacher2Id, // Different teacher
          sectionId: section1Id, // Same section
          periodId: period1Id, // Same period
          day: 'sunday', // Same day
        })
      ).rejects.toThrow();
    });
  });

  describe('Schedule Queries', () => {
    it('should fetch schedule by day', async () => {
      await createScheduleEntry({
        teacherId: teacher1Id,
        sectionId: section1Id,
        periodId: period1Id,
        day: 'sunday',
      });

      await createScheduleEntry({
        teacherId: teacher2Id,
        sectionId: section2Id,
        periodId: period2Id,
        day: 'sunday',
      });

      await createScheduleEntry({
        teacherId: teacher1Id,
        sectionId: section2Id,
        periodId: period1Id,
        day: 'monday',
      });

      const sundaySchedule = await testPrisma.scheduleEntry.findMany({
        where: { day: 'sunday' },
      });

      expect(sundaySchedule).toHaveLength(2);
    });

    it('should fetch schedule by teacher', async () => {
      await createScheduleEntry({
        teacherId: teacher1Id,
        sectionId: section1Id,
        periodId: period1Id,
        day: 'sunday',
      });

      await createScheduleEntry({
        teacherId: teacher1Id,
        sectionId: section2Id,
        periodId: period2Id,
        day: 'sunday',
      });

      await createScheduleEntry({
        teacherId: teacher2Id,
        sectionId: section1Id,
        periodId: period1Id,
        day: 'monday',
      });

      const teacher1Schedule = await testPrisma.scheduleEntry.findMany({
        where: { teacherId: teacher1Id },
      });

      expect(teacher1Schedule).toHaveLength(2);
    });

    it('should fetch schedule with all relations', async () => {
      await createScheduleEntry({
        teacherId: teacher1Id,
        sectionId: section1Id,
        periodId: period1Id,
        day: 'sunday',
      });

      const entries = await testPrisma.scheduleEntry.findMany({
        include: {
          teacher: true,
          grade: true,
          section: true,
          period: true,
        },
      });

      expect(entries).toHaveLength(1);
      expect(entries[0].teacher.fullName).toBe('أحمد محمد');
      expect(entries[0].section.name).toBe('أ');
      expect(entries[0].period.number).toBe(1);
    });
  });

  describe('Cascade Delete', () => {
    it('should delete schedule entries when teacher is deleted', async () => {
      await createScheduleEntry({
        teacherId: teacher1Id,
        sectionId: section1Id,
        periodId: period1Id,
        day: 'sunday',
      });

      // Delete teacher
      await testPrisma.teacher.delete({ where: { id: teacher1Id } });

      // Schedule entry should be deleted
      const entries = await testPrisma.scheduleEntry.findMany({
        where: { teacherId: teacher1Id },
      });

      expect(entries).toHaveLength(0);
    });
  });
});
