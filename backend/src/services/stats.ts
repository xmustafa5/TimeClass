import { prisma } from '../lib/prisma.js';
import { weekDays } from '../lib/validations.js';

/**
 * Teacher statistics
 */
export interface TeacherStats {
  teacherId: string;
  teacherName: string;
  subject: string;
  weeklyPeriods: number;
  scheduledPeriods: number;
  remainingPeriods: number;
  utilizationPercentage: number;
  periodsByDay: Record<string, number>;
}

/**
 * Room statistics
 */
export interface RoomStats {
  roomId: string;
  roomName: string;
  roomType: string;
  capacity: number;
  scheduledPeriods: number;
  totalAvailablePeriods: number;
  utilizationPercentage: number;
  periodsByDay: Record<string, number>;
}

/**
 * Overview statistics
 */
export interface OverviewStats {
  totalTeachers: number;
  totalGrades: number;
  totalSections: number;
  totalRooms: number;
  totalPeriods: number;
  totalScheduleEntries: number;
  averageTeacherUtilization: number;
  averageRoomUtilization: number;
  entriesByDay: Record<string, number>;
  busyPeriods: { periodNumber: number; count: number }[];
}

/**
 * Unused time slot
 */
export interface UnusedSlot {
  day: string;
  periodNumber: number;
  periodTime: string;
  availableRooms: { id: string; name: string; type: string }[];
  availableTeachers: { id: string; name: string; subject: string }[];
}

/**
 * Statistics Service
 * Provides analytics and statistics for the schedule
 */
export class StatsService {
  /**
   * Get statistics for all teachers
   */
  async getTeacherStats(): Promise<TeacherStats[]> {
    const teachers = await prisma.teacher.findMany({
      include: {
        scheduleEntries: {
          select: { day: true },
        },
      },
    });

    return teachers.map((teacher) => {
      const periodsByDay: Record<string, number> = {};
      for (const day of weekDays) {
        periodsByDay[day] = teacher.scheduleEntries.filter((e) => e.day === day).length;
      }

      const scheduledPeriods = teacher.scheduleEntries.length;
      const utilizationPercentage =
        teacher.weeklyPeriods > 0
          ? Math.round((scheduledPeriods / teacher.weeklyPeriods) * 100)
          : 0;

      return {
        teacherId: teacher.id,
        teacherName: teacher.fullName,
        subject: teacher.subject,
        weeklyPeriods: teacher.weeklyPeriods,
        scheduledPeriods,
        remainingPeriods: Math.max(0, teacher.weeklyPeriods - scheduledPeriods),
        utilizationPercentage: Math.min(100, utilizationPercentage),
        periodsByDay,
      };
    });
  }

  /**
   * Get statistics for all rooms
   */
  async getRoomStats(): Promise<RoomStats[]> {
    const rooms = await prisma.room.findMany({
      include: {
        scheduleEntries: {
          select: { day: true },
        },
      },
    });

    const periodsCount = await prisma.period.count();
    const totalAvailablePeriods = periodsCount * weekDays.length;

    return rooms.map((room) => {
      const periodsByDay: Record<string, number> = {};
      for (const day of weekDays) {
        periodsByDay[day] = room.scheduleEntries.filter((e) => e.day === day).length;
      }

      const scheduledPeriods = room.scheduleEntries.length;
      const utilizationPercentage =
        totalAvailablePeriods > 0
          ? Math.round((scheduledPeriods / totalAvailablePeriods) * 100)
          : 0;

      return {
        roomId: room.id,
        roomName: room.name,
        roomType: room.type,
        capacity: room.capacity,
        scheduledPeriods,
        totalAvailablePeriods,
        utilizationPercentage,
        periodsByDay,
      };
    });
  }

  /**
   * Get overview statistics
   */
  async getOverviewStats(): Promise<OverviewStats> {
    const [
      totalTeachers,
      totalGrades,
      totalSections,
      totalRooms,
      totalPeriods,
      totalScheduleEntries,
      scheduleEntries,
      periods,
    ] = await Promise.all([
      prisma.teacher.count(),
      prisma.grade.count(),
      prisma.section.count(),
      prisma.room.count(),
      prisma.period.count(),
      prisma.scheduleEntry.count(),
      prisma.scheduleEntry.findMany({
        select: { day: true, periodId: true },
      }),
      prisma.period.findMany({
        select: { id: true, number: true },
      }),
    ]);

    // Calculate entries by day
    const entriesByDay: Record<string, number> = {};
    for (const day of weekDays) {
      entriesByDay[day] = scheduleEntries.filter((e) => e.day === day).length;
    }

    // Calculate busy periods
    const periodCounts = new Map<string, number>();
    for (const entry of scheduleEntries) {
      periodCounts.set(entry.periodId, (periodCounts.get(entry.periodId) || 0) + 1);
    }

    const busyPeriods = periods
      .map((p) => ({
        periodNumber: p.number,
        count: periodCounts.get(p.id) || 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate average teacher utilization
    const teacherStats = await this.getTeacherStats();
    const averageTeacherUtilization =
      teacherStats.length > 0
        ? Math.round(
            teacherStats.reduce((sum, t) => sum + t.utilizationPercentage, 0) /
              teacherStats.length
          )
        : 0;

    // Calculate average room utilization
    const roomStats = await this.getRoomStats();
    const averageRoomUtilization =
      roomStats.length > 0
        ? Math.round(
            roomStats.reduce((sum, r) => sum + r.utilizationPercentage, 0) /
              roomStats.length
          )
        : 0;

    return {
      totalTeachers,
      totalGrades,
      totalSections,
      totalRooms,
      totalPeriods,
      totalScheduleEntries,
      averageTeacherUtilization,
      averageRoomUtilization,
      entriesByDay,
      busyPeriods,
    };
  }

  /**
   * Find unused time slots (available rooms and teachers)
   */
  async getUnusedSlots(): Promise<UnusedSlot[]> {
    const [periods, rooms, teachers, scheduleEntries] = await Promise.all([
      prisma.period.findMany({ orderBy: { number: 'asc' } }),
      prisma.room.findMany(),
      prisma.teacher.findMany(),
      prisma.scheduleEntry.findMany({
        select: { day: true, periodId: true, roomId: true, teacherId: true },
      }),
    ]);

    const unusedSlots: UnusedSlot[] = [];

    for (const day of weekDays) {
      for (const period of periods) {
        // Find which rooms are busy at this slot
        const busyRoomIds = new Set(
          scheduleEntries
            .filter((e) => e.day === day && e.periodId === period.id)
            .map((e) => e.roomId)
        );

        // Find which teachers are busy at this slot
        const busyTeacherIds = new Set(
          scheduleEntries
            .filter((e) => e.day === day && e.periodId === period.id)
            .map((e) => e.teacherId)
        );

        // Get available rooms and teachers
        const availableRooms = rooms
          .filter((r) => !busyRoomIds.has(r.id))
          .map((r) => ({ id: r.id, name: r.name, type: r.type }));

        const availableTeachers = teachers
          .filter((t) => {
            // Check if teacher is not busy and works on this day
            if (busyTeacherIds.has(t.id)) return false;
            const workDays = JSON.parse(t.workDays) as string[];
            return workDays.includes(day);
          })
          .map((t) => ({ id: t.id, name: t.fullName, subject: t.subject }));

        // Only include slots that have some availability
        if (availableRooms.length > 0 && availableTeachers.length > 0) {
          unusedSlots.push({
            day,
            periodNumber: period.number,
            periodTime: `${period.startTime} - ${period.endTime}`,
            availableRooms,
            availableTeachers,
          });
        }
      }
    }

    return unusedSlots;
  }
}

// Export singleton instance
export const statsService = new StatsService();
