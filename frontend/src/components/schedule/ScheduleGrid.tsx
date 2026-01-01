'use client';

import { useMemo, memo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ScheduleEntryCard,
  EmptySlot,
  getTeacherColor,
} from './ScheduleEntryCard';
import type { ScheduleEntry, Teacher, Section, Period, WeekDay } from '@/types';
import { weekDaysArabic } from '@/types';

const weekDays: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

interface ScheduleGridProps {
  entries: ScheduleEntry[];
  periods: Period[];
  teachers: Teacher[];
  sections: Section[];
  viewMode: 'weekly' | 'daily';
  selectedDay: WeekDay;
  onSlotClick: (day: WeekDay, periodId: string) => void;
  onEntryClick: (entry: ScheduleEntry) => void;
  isCompact?: boolean;
}

// Memoized cell component for better performance
const ScheduleCell = memo(function ScheduleCell({
  entry,
  day,
  periodId,
  teacher,
  section,
  colorClass,
  isCompact,
  onSlotClick,
  onEntryClick,
}: {
  entry?: ScheduleEntry;
  day: WeekDay;
  periodId: string;
  teacher?: Teacher;
  section?: Section;
  colorClass: string;
  isCompact: boolean;
  onSlotClick: (day: WeekDay, periodId: string) => void;
  onEntryClick: (entry: ScheduleEntry) => void;
}) {
  if (entry && teacher && section) {
    return (
      <ScheduleEntryCard
        teacherName={teacher.fullName}
        subject={entry.subject}
        sectionName={section.name}
        colorClass={colorClass}
        onClick={() => onEntryClick(entry)}
        isCompact={isCompact}
      />
    );
  }

  return <EmptySlot onClick={() => onSlotClick(day, periodId)} isCompact={isCompact} />;
});

export const ScheduleGrid = memo(function ScheduleGrid({
  entries,
  periods,
  teachers,
  sections,
  viewMode,
  selectedDay,
  onSlotClick,
  onEntryClick,
  isCompact = false,
}: ScheduleGridProps) {
  // Sort periods by number
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => a.number - b.number);
  }, [periods]);

  // Get all teacher IDs for color assignment
  const teacherIds = useMemo(() => teachers.map((t) => t.id), [teachers]);

  // Create a lookup map for quick access
  const entriesMap = useMemo(() => {
    const map = new Map<string, ScheduleEntry>();
    entries.forEach((entry) => {
      const key = `${entry.day}-${entry.periodId}`;
      map.set(key, entry);
    });
    return map;
  }, [entries]);

  // Create lookup maps for entities
  const teachersMap = useMemo(
    () => new Map(teachers.map((t) => [t.id, t])),
    [teachers]
  );
  const sectionsMap = useMemo(
    () => new Map(sections.map((s) => [s.id, s])),
    [sections]
  );

  const getEntry = (day: WeekDay, periodId: string) => {
    return entriesMap.get(`${day}-${periodId}`);
  };

  const daysToShow = viewMode === 'weekly' ? weekDays : [selectedDay];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-3 py-3 text-right text-sm font-medium text-muted-foreground w-24 sticky right-0 bg-muted/50 z-10">
                  الحصة
                </th>
                {daysToShow.map((day) => (
                  <th
                    key={day}
                    className={cn(
                      'px-3 py-3 text-center text-sm font-medium text-muted-foreground',
                      viewMode === 'daily' && 'min-w-[200px]'
                    )}
                  >
                    <Badge variant="outline" className="font-medium">
                      {weekDaysArabic[day]}
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedPeriods.map((period) => (
                <tr key={period.id} className="hover:bg-muted/30 transition-colors">
                  {/* Period number cell */}
                  <td className="px-3 py-2 sticky right-0 bg-background z-10 border-l">
                    <div className="flex flex-col items-center gap-1">
                      <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                        {period.number}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {period.startTime}
                      </span>
                    </div>
                  </td>

                  {/* Day cells */}
                  {daysToShow.map((day) => {
                    const entry = getEntry(day, period.id);
                    const teacher = entry ? teachersMap.get(entry.teacherId) : undefined;
                    const section = entry ? sectionsMap.get(entry.sectionId) : undefined;
                    const colorClass = entry
                      ? getTeacherColor(entry.teacherId, teacherIds)
                      : '';

                    return (
                      <td
                        key={day}
                        className={cn(
                          'px-2 py-2',
                          viewMode === 'daily' && 'min-w-[200px]'
                        )}
                      >
                        <ScheduleCell
                          entry={entry}
                          day={day}
                          periodId={period.id}
                          teacher={teacher}
                          section={section}
                          colorClass={colorClass}
                          isCompact={isCompact || viewMode === 'weekly'}
                          onSlotClick={onSlotClick}
                          onEntryClick={onEntryClick}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {sortedPeriods.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            لا توجد حصص مسجلة. يرجى إضافة الحصص أولاً من صفحة الحصص.
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Teacher legend component
interface TeacherLegendProps {
  teachers: Teacher[];
  entries: ScheduleEntry[];
}

export const TeacherLegend = memo(function TeacherLegend({
  teachers,
  entries,
}: TeacherLegendProps) {
  const teacherIds = useMemo(() => teachers.map((t) => t.id), [teachers]);

  // Only show teachers that have entries
  const activeTeachers = useMemo(() => {
    const activeIds = new Set(entries.map((e) => e.teacherId));
    return teachers.filter((t) => activeIds.has(t.id));
  }, [teachers, entries]);

  if (activeTeachers.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-medium mb-3">المدرسون في الجدول</h3>
        <div className="flex flex-wrap gap-2">
          {activeTeachers.map((teacher) => (
            <Badge
              key={teacher.id}
              variant="outline"
              className={cn(
                'px-3 py-1',
                getTeacherColor(teacher.id, teacherIds)
              )}
            >
              {teacher.fullName} - {teacher.subject}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
