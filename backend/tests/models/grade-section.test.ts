import { describe, it, expect } from 'vitest';
import { testPrisma } from '../setup.js';

describe('Grade Model', () => {
  const createGrade = async (name: string, order: number = 0) => {
    return testPrisma.grade.create({
      data: {
        id: crypto.randomUUID(),
        name,
        order,
      },
    });
  };

  describe('Create', () => {
    it('should create a grade', async () => {
      const grade = await createGrade('الصف الأول', 1);

      expect(grade).toBeDefined();
      expect(grade.name).toBe('الصف الأول');
      expect(grade.order).toBe(1);
    });

    it('should enforce unique grade names', async () => {
      await createGrade('الصف الأول');

      await expect(createGrade('الصف الأول')).rejects.toThrow();
    });
  });

  describe('Read', () => {
    it('should find grades ordered by order field', async () => {
      await createGrade('الصف الثالث', 3);
      await createGrade('الصف الأول', 1);
      await createGrade('الصف الثاني', 2);

      const grades = await testPrisma.grade.findMany({
        orderBy: { order: 'asc' },
      });

      expect(grades).toHaveLength(3);
      expect(grades[0].name).toBe('الصف الأول');
      expect(grades[1].name).toBe('الصف الثاني');
      expect(grades[2].name).toBe('الصف الثالث');
    });
  });
});

describe('Section Model', () => {
  const createGrade = async (name: string) => {
    return testPrisma.grade.create({
      data: {
        id: crypto.randomUUID(),
        name,
        order: 1,
      },
    });
  };

  const createSection = async (name: string, gradeId: string) => {
    return testPrisma.section.create({
      data: {
        id: crypto.randomUUID(),
        name,
        gradeId,
      },
    });
  };

  describe('Create', () => {
    it('should create a section linked to a grade', async () => {
      const grade = await createGrade('الصف الأول');
      const section = await createSection('أ', grade.id);

      expect(section).toBeDefined();
      expect(section.name).toBe('أ');
      expect(section.gradeId).toBe(grade.id);
    });

    it('should allow same section name in different grades', async () => {
      const grade1 = await createGrade('الصف الأول');
      const grade2 = await createGrade('الصف الثاني');

      const section1 = await createSection('أ', grade1.id);
      const section2 = await createSection('أ', grade2.id);

      expect(section1.name).toBe('أ');
      expect(section2.name).toBe('أ');
      expect(section1.gradeId).not.toBe(section2.gradeId);
    });

    it('should prevent duplicate section names within same grade', async () => {
      const grade = await createGrade('الصف الأول');
      await createSection('أ', grade.id);

      await expect(createSection('أ', grade.id)).rejects.toThrow();
    });
  });

  describe('Relationships', () => {
    it('should fetch section with grade', async () => {
      const grade = await createGrade('الصف الأول');
      const section = await createSection('أ', grade.id);

      const sectionWithGrade = await testPrisma.section.findUnique({
        where: { id: section.id },
        include: { grade: true },
      });

      expect(sectionWithGrade?.grade).toBeDefined();
      expect(sectionWithGrade?.grade.name).toBe('الصف الأول');
    });

    it('should fetch grade with sections', async () => {
      const grade = await createGrade('الصف الأول');
      await createSection('أ', grade.id);
      await createSection('ب', grade.id);
      await createSection('ج', grade.id);

      const gradeWithSections = await testPrisma.grade.findUnique({
        where: { id: grade.id },
        include: { sections: true },
      });

      expect(gradeWithSections?.sections).toHaveLength(3);
    });

    it('should cascade delete sections when grade is deleted', async () => {
      const grade = await createGrade('الصف الأول');
      await createSection('أ', grade.id);
      await createSection('ب', grade.id);

      // Delete grade
      await testPrisma.grade.delete({ where: { id: grade.id } });

      // Sections should be deleted
      const sections = await testPrisma.section.findMany({
        where: { gradeId: grade.id },
      });

      expect(sections).toHaveLength(0);
    });
  });
});
