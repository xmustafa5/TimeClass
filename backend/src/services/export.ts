import { Parser } from '@json2csv/plainjs';
import { prisma } from '../lib/prisma.js';
import type { ExportFilterInput } from '../lib/validations.js';

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv';

/**
 * Flattened schedule entry for export
 */
export interface FlatScheduleEntry {
  id: string;
  day: string;
  dayArabic: string;
  periodNumber: number;
  periodTime: string;
  teacherName: string;
  teacherSubject: string;
  gradeName: string;
  sectionName: string;
  subject: string;
}

/**
 * Day names in Arabic
 */
const dayNamesArabic: Record<string, string> = {
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
};

/**
 * Export Service
 * Handles schedule data export in various formats
 */
export class ExportService {
  /**
   * Get schedule entries with optional filtering
   */
  async getScheduleEntries(filters?: ExportFilterInput): Promise<FlatScheduleEntry[]> {
    const where: Record<string, unknown> = {};

    if (filters?.day) where.day = filters.day;
    if (filters?.teacherId) where.teacherId = filters.teacherId;
    if (filters?.gradeId) where.gradeId = filters.gradeId;
    if (filters?.sectionId) where.sectionId = filters.sectionId;

    const entries = await prisma.scheduleEntry.findMany({
      where,
      include: {
        teacher: true,
        grade: true,
        section: true,
        period: true,
      },
      orderBy: [
        { day: 'asc' },
        { period: { number: 'asc' } },
      ],
    });

    return entries.map((entry) => ({
      id: entry.id,
      day: entry.day,
      dayArabic: dayNamesArabic[entry.day] || entry.day,
      periodNumber: entry.period.number,
      periodTime: `${entry.period.startTime} - ${entry.period.endTime}`,
      teacherName: entry.teacher.fullName,
      teacherSubject: entry.teacher.subject,
      gradeName: entry.grade.name,
      sectionName: entry.section.name,
      subject: entry.subject,
    }));
  }

  /**
   * Export schedule as JSON
   */
  async exportAsJson(filters?: ExportFilterInput): Promise<{
    data: FlatScheduleEntry[];
    count: number;
    exportedAt: string;
  }> {
    const entries = await this.getScheduleEntries(filters);

    return {
      data: entries,
      count: entries.length,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Export schedule as CSV
   */
  async exportAsCsv(filters?: ExportFilterInput): Promise<string> {
    const entries = await this.getScheduleEntries(filters);

    if (entries.length === 0) {
      return 'اليوم,الحصة,الوقت,المدرس,المادة,الصف,الشعبة\n';
    }

    const parser = new Parser({
      fields: [
        { label: 'اليوم', value: 'dayArabic' },
        { label: 'الحصة', value: 'periodNumber' },
        { label: 'الوقت', value: 'periodTime' },
        { label: 'المدرس', value: 'teacherName' },
        { label: 'المادة', value: 'subject' },
        { label: 'الصف', value: 'gradeName' },
        { label: 'الشعبة', value: 'sectionName' },
      ],
      withBOM: true, // Add BOM for proper Arabic encoding in Excel
    });

    return parser.parse(entries);
  }

  /**
   * Get schedule grouped by day for weekly view export
   */
  async exportWeeklySchedule(filters?: Omit<ExportFilterInput, 'day'>): Promise<{
    schedule: Record<string, FlatScheduleEntry[]>;
    exportedAt: string;
  }> {
    const entries = await this.getScheduleEntries(filters);

    const grouped: Record<string, FlatScheduleEntry[]> = {
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
    };

    for (const entry of entries) {
      if (grouped[entry.day]) {
        grouped[entry.day].push(entry);
      }
    }

    return {
      schedule: grouped,
      exportedAt: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const exportService = new ExportService();
