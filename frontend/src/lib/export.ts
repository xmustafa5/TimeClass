import type { Teacher, WeekDay } from '@/types';
import { weekDaysArabic } from '@/types';

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string; format?: (value: unknown) => string }[],
  filename: string
) {
  if (data.length === 0) return;

  // Create header row
  const headers = columns.map((col) => col.header).join(',');

  // Create data rows
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key];
        const formatted = col.format ? col.format(value) : String(value ?? '');
        // Escape quotes and wrap in quotes if contains comma or newline
        const escaped = formatted.replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')
          ? `"${escaped}"`
          : escaped;
      })
      .join(',')
  );

  // Combine with BOM for Arabic support in Excel
  const BOM = '\uFEFF';
  const csv = BOM + [headers, ...rows].join('\n');

  // Download
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Export data to JSON file
 */
export function exportToJSON<T>(data: T[], filename: string) {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, 'application/json');
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export teachers to CSV
 */
export function exportTeachersToCSV(teachers: Teacher[]) {
  exportToCSV(
    teachers,
    [
      { key: 'fullName', header: 'الاسم' },
      { key: 'subject', header: 'المادة' },
      { key: 'weeklyPeriods', header: 'الحصص الأسبوعية' },
      {
        key: 'workDays',
        header: 'أيام الدوام',
        format: (value) =>
          (value as WeekDay[]).map((day) => weekDaysArabic[day]).join(' - '),
      },
      { key: 'notes', header: 'ملاحظات' },
    ],
    `teachers-${new Date().toISOString().split('T')[0]}`
  );
}

/**
 * Export teachers to JSON
 */
export function exportTeachersToJSON(teachers: Teacher[]) {
  exportToJSON(
    teachers.map((t) => ({
      الاسم: t.fullName,
      المادة: t.subject,
      'الحصص الأسبوعية': t.weeklyPeriods,
      'أيام الدوام': (t.workDays as WeekDay[]).map((day) => weekDaysArabic[day]),
      ملاحظات: t.notes || '',
    })),
    `teachers-${new Date().toISOString().split('T')[0]}`
  );
}
