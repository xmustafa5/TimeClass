import { prisma } from '../lib/prisma.js';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { CheckConflictInput } from '../lib/validations.js';

/**
 * Conflict types that can occur in schedule entries
 */
export type ConflictType = 'teacher' | 'room' | 'section';

/**
 * Represents a detected schedule conflict
 */
export interface ScheduleConflict {
  type: ConflictType;
  message: string;
  conflictingEntryId: string;
  details: {
    day: string;
    periodNumber: number;
    teacherName?: string;
    roomName?: string;
    sectionName?: string;
    gradeName?: string;
  };
}

/**
 * Result of conflict checking operation
 */
export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: ScheduleConflict[];
}

/**
 * Conflict Detection Service
 * Handles all conflict checking logic for schedule entries
 * Uses Prisma's unique constraints as primary defense, with explicit checks for detailed error messages
 */
export class ConflictService {
  private prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prismaClient = prismaClient;
  }

  /**
   * Check for all types of conflicts before creating/updating a schedule entry
   * @param input - The schedule entry data to check
   * @returns ConflictCheckResult with details of any conflicts found
   */
  async checkConflicts(input: CheckConflictInput): Promise<ConflictCheckResult> {
    const conflicts: ScheduleConflict[] = [];

    // Run all conflict checks in parallel for better performance
    const [teacherConflict, roomConflict, sectionConflict] = await Promise.all([
      this.checkTeacherConflict(input),
      this.checkRoomConflict(input),
      this.checkSectionConflict(input),
    ]);

    if (teacherConflict) conflicts.push(teacherConflict);
    if (roomConflict) conflicts.push(roomConflict);
    if (sectionConflict) conflicts.push(sectionConflict);

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  /**
   * Check if teacher is already assigned to another class at the same time
   * Same teacher, same day, same period = CONFLICT
   */
  async checkTeacherConflict(input: CheckConflictInput): Promise<ScheduleConflict | null> {
    const existingEntry = await this.prismaClient.scheduleEntry.findFirst({
      where: {
        teacherId: input.teacherId,
        day: input.day,
        periodId: input.periodId,
        ...(input.excludeEntryId && { NOT: { id: input.excludeEntryId } }),
      },
      include: {
        teacher: true,
        period: true,
        section: true,
        grade: true,
      },
    });

    if (existingEntry) {
      return {
        type: 'teacher',
        message: `المدرس "${existingEntry.teacher.fullName}" لديه حصة أخرى في نفس الوقت (${existingEntry.grade.name} - ${existingEntry.section.name})`,
        conflictingEntryId: existingEntry.id,
        details: {
          day: existingEntry.day,
          periodNumber: existingEntry.period.number,
          teacherName: existingEntry.teacher.fullName,
          sectionName: existingEntry.section.name,
          gradeName: existingEntry.grade.name,
        },
      };
    }

    return null;
  }

  /**
   * Check if room is already in use at the same time
   * Same room, same day, same period = CONFLICT
   */
  async checkRoomConflict(input: CheckConflictInput): Promise<ScheduleConflict | null> {
    const existingEntry = await this.prismaClient.scheduleEntry.findFirst({
      where: {
        roomId: input.roomId,
        day: input.day,
        periodId: input.periodId,
        ...(input.excludeEntryId && { NOT: { id: input.excludeEntryId } }),
      },
      include: {
        room: true,
        period: true,
        section: true,
        grade: true,
        teacher: true,
      },
    });

    if (existingEntry) {
      return {
        type: 'room',
        message: `القاعة "${existingEntry.room.name}" مستخدمة في نفس الوقت من قبل (${existingEntry.teacher.fullName} - ${existingEntry.grade.name} ${existingEntry.section.name})`,
        conflictingEntryId: existingEntry.id,
        details: {
          day: existingEntry.day,
          periodNumber: existingEntry.period.number,
          roomName: existingEntry.room.name,
          teacherName: existingEntry.teacher.fullName,
          sectionName: existingEntry.section.name,
          gradeName: existingEntry.grade.name,
        },
      };
    }

    return null;
  }

  /**
   * Check if section already has a class at the same time
   * Same section, same day, same period = CONFLICT
   */
  async checkSectionConflict(input: CheckConflictInput): Promise<ScheduleConflict | null> {
    const existingEntry = await this.prismaClient.scheduleEntry.findFirst({
      where: {
        sectionId: input.sectionId,
        day: input.day,
        periodId: input.periodId,
        ...(input.excludeEntryId && { NOT: { id: input.excludeEntryId } }),
      },
      include: {
        section: true,
        grade: true,
        period: true,
        teacher: true,
        room: true,
      },
    });

    if (existingEntry) {
      return {
        type: 'section',
        message: `الشعبة "${existingEntry.grade.name} - ${existingEntry.section.name}" لديها حصة أخرى في نفس الوقت (${existingEntry.teacher.fullName} في ${existingEntry.room.name})`,
        conflictingEntryId: existingEntry.id,
        details: {
          day: existingEntry.day,
          periodNumber: existingEntry.period.number,
          sectionName: existingEntry.section.name,
          gradeName: existingEntry.grade.name,
          teacherName: existingEntry.teacher.fullName,
          roomName: existingEntry.room.name,
        },
      };
    }

    return null;
  }

  /**
   * Validate that all referenced entities exist before creating a schedule entry
   * @param input - The schedule entry data to validate
   * @returns Object with validation result and any missing entities
   */
  async validateReferences(input: {
    teacherId: string;
    gradeId: string;
    sectionId: string;
    periodId: string;
    roomId: string;
  }): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check all references in parallel
    const [teacher, grade, section, period, room] = await Promise.all([
      this.prismaClient.teacher.findUnique({ where: { id: input.teacherId } }),
      this.prismaClient.grade.findUnique({ where: { id: input.gradeId } }),
      this.prismaClient.section.findUnique({ where: { id: input.sectionId } }),
      this.prismaClient.period.findUnique({ where: { id: input.periodId } }),
      this.prismaClient.room.findUnique({ where: { id: input.roomId } }),
    ]);

    if (!teacher) errors.push('المدرس غير موجود');
    if (!grade) errors.push('الصف غير موجود');
    if (!section) errors.push('الشعبة غير موجودة');
    if (!period) errors.push('الحصة غير موجودة');
    if (!room) errors.push('القاعة غير موجودة');

    // Validate section belongs to the grade
    if (section && grade && section.gradeId !== grade.id) {
      errors.push('الشعبة لا تنتمي للصف المحدد');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance for convenience
export const conflictService = new ConflictService();
