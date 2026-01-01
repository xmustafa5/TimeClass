import { describe, it, expect, beforeEach } from 'vitest';
import { testPrisma } from '../setup.js';

describe('Teacher Model', () => {
  const createTeacher = async (data?: Partial<{
    fullName: string;
    subject: string;
    weeklyPeriods: number;
    workDays: string;
    notes: string | null;
  }>) => {
    return testPrisma.teacher.create({
      data: {
        id: crypto.randomUUID(),
        fullName: data?.fullName ?? 'أحمد محمد',
        subject: data?.subject ?? 'الرياضيات',
        weeklyPeriods: data?.weeklyPeriods ?? 20,
        workDays: data?.workDays ?? JSON.stringify(['sunday', 'monday', 'tuesday']),
        notes: data?.notes ?? null,
      },
    });
  };

  describe('Create', () => {
    it('should create a teacher with required fields', async () => {
      const teacher = await createTeacher();

      expect(teacher).toBeDefined();
      expect(teacher.id).toBeDefined();
      expect(teacher.fullName).toBe('أحمد محمد');
      expect(teacher.subject).toBe('الرياضيات');
      expect(teacher.weeklyPeriods).toBe(20);
    });

    it('should create a teacher with all fields', async () => {
      const teacher = await createTeacher({
        fullName: 'سارة خالد',
        subject: 'العلوم',
        weeklyPeriods: 24,
        workDays: JSON.stringify(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']),
        notes: 'مدرسة متميزة',
      });

      expect(teacher.fullName).toBe('سارة خالد');
      expect(teacher.subject).toBe('العلوم');
      expect(teacher.weeklyPeriods).toBe(24);
      expect(teacher.notes).toBe('مدرسة متميزة');
      expect(JSON.parse(teacher.workDays)).toHaveLength(5);
    });

    it('should default weeklyPeriods to 20', async () => {
      const teacher = await testPrisma.teacher.create({
        data: {
          id: crypto.randomUUID(),
          fullName: 'Test',
          subject: 'Test Subject',
          workDays: JSON.stringify(['sunday']),
        },
      });

      expect(teacher.weeklyPeriods).toBe(20);
    });
  });

  describe('Read', () => {
    it('should find a teacher by id', async () => {
      const created = await createTeacher();
      const found = await testPrisma.teacher.findUnique({
        where: { id: created.id },
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.fullName).toBe(created.fullName);
    });

    it('should return null for non-existent teacher', async () => {
      const found = await testPrisma.teacher.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(found).toBeNull();
    });

    it('should find all teachers', async () => {
      await createTeacher({ fullName: 'Teacher 1' });
      await createTeacher({ fullName: 'Teacher 2' });
      await createTeacher({ fullName: 'Teacher 3' });

      const teachers = await testPrisma.teacher.findMany();

      expect(teachers).toHaveLength(3);
    });

    it('should filter teachers by subject', async () => {
      await createTeacher({ fullName: 'Teacher 1', subject: 'الرياضيات' });
      await createTeacher({ fullName: 'Teacher 2', subject: 'العلوم' });
      await createTeacher({ fullName: 'Teacher 3', subject: 'الرياضيات' });

      const mathTeachers = await testPrisma.teacher.findMany({
        where: { subject: 'الرياضيات' },
      });

      expect(mathTeachers).toHaveLength(2);
    });
  });

  describe('Update', () => {
    it('should update a teacher', async () => {
      const created = await createTeacher();

      const updated = await testPrisma.teacher.update({
        where: { id: created.id },
        data: { fullName: 'محمود أحمد', weeklyPeriods: 25 },
      });

      expect(updated.fullName).toBe('محمود أحمد');
      expect(updated.weeklyPeriods).toBe(25);
      expect(updated.subject).toBe(created.subject); // unchanged
    });

    it('should update workDays', async () => {
      const created = await createTeacher();
      const newWorkDays = ['monday', 'wednesday', 'thursday'];

      const updated = await testPrisma.teacher.update({
        where: { id: created.id },
        data: { workDays: JSON.stringify(newWorkDays) },
      });

      expect(JSON.parse(updated.workDays)).toEqual(newWorkDays);
    });
  });

  describe('Delete', () => {
    it('should delete a teacher', async () => {
      const created = await createTeacher();

      await testPrisma.teacher.delete({
        where: { id: created.id },
      });

      const found = await testPrisma.teacher.findUnique({
        where: { id: created.id },
      });

      expect(found).toBeNull();
    });

    it('should delete all teachers', async () => {
      await createTeacher({ fullName: 'Teacher 1' });
      await createTeacher({ fullName: 'Teacher 2' });

      await testPrisma.teacher.deleteMany();

      const teachers = await testPrisma.teacher.findMany();
      expect(teachers).toHaveLength(0);
    });
  });
});
