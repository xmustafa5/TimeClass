'use client';

import { memo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import type { Teacher, Grade, Section, Room, WeekDay } from '@/types';
import { weekDaysArabic } from '@/types';

export interface ScheduleFilters {
  teacherId?: string;
  gradeId?: string;
  sectionId?: string;
  roomId?: string;
}

interface ScheduleFiltersProps {
  filters: ScheduleFilters;
  onFiltersChange: (filters: ScheduleFilters) => void;
  teachers: Teacher[];
  grades: Grade[];
  sections: Section[];
  rooms: Room[];
  viewMode: 'weekly' | 'daily';
  selectedDay: WeekDay;
  onViewModeChange: (mode: 'weekly' | 'daily') => void;
  onSelectedDayChange: (day: WeekDay) => void;
}

const weekDays: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

export const ScheduleFiltersPanel = memo(function ScheduleFiltersPanel({
  filters,
  onFiltersChange,
  teachers,
  grades,
  sections,
  rooms,
  viewMode,
  selectedDay,
  onViewModeChange,
  onSelectedDayChange,
}: ScheduleFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((v) => v);

  const clearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = (key: keyof ScheduleFilters, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value };

    // Clear section if grade changes
    if (key === 'gradeId' && value !== filters.gradeId) {
      newFilters.sectionId = undefined;
    }

    onFiltersChange(newFilters);
  };

  // Filter sections by selected grade
  const filteredSections = filters.gradeId
    ? sections.filter((s) => s.gradeId === filters.gradeId)
    : sections;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* View mode and day selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'weekly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('weekly')}
              >
                أسبوعي
              </Button>
              <Button
                variant={viewMode === 'daily' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('daily')}
              >
                يومي
              </Button>
            </div>

            {viewMode === 'daily' && (
              <div className="flex gap-1 flex-wrap">
                {weekDays.map((day) => (
                  <Button
                    key={day}
                    variant={selectedDay === day ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSelectedDayChange(day)}
                  >
                    {weekDaysArabic[day]}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">تصفية حسب:</span>
            </div>

            {/* Teacher filter */}
            <Select
              value={filters.teacherId || 'all'}
              onValueChange={(v) => updateFilter('teacherId', v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="المدرس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المدرسين</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Grade filter */}
            <Select
              value={filters.gradeId || 'all'}
              onValueChange={(v) => updateFilter('gradeId', v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الصف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصفوف</SelectItem>
                {grades.map((grade) => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Section filter */}
            <Select
              value={filters.sectionId || 'all'}
              onValueChange={(v) => updateFilter('sectionId', v === 'all' ? undefined : v)}
              disabled={!filters.gradeId && sections.length > 10}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الشعبة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الشعب</SelectItem>
                {filteredSections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Room filter */}
            <Select
              value={filters.roomId || 'all'}
              onValueChange={(v) => updateFilter('roomId', v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="القاعة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع القاعات</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                مسح الفلاتر
              </Button>
            )}
          </div>

          {/* Active filters badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {filters.teacherId && (
                <Badge variant="secondary" className="gap-1">
                  المدرس: {teachers.find((t) => t.id === filters.teacherId)?.fullName}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('teacherId', undefined)}
                  />
                </Badge>
              )}
              {filters.gradeId && (
                <Badge variant="secondary" className="gap-1">
                  الصف: {grades.find((g) => g.id === filters.gradeId)?.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('gradeId', undefined)}
                  />
                </Badge>
              )}
              {filters.sectionId && (
                <Badge variant="secondary" className="gap-1">
                  الشعبة: {sections.find((s) => s.id === filters.sectionId)?.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('sectionId', undefined)}
                  />
                </Badge>
              )}
              {filters.roomId && (
                <Badge variant="secondary" className="gap-1">
                  القاعة: {rooms.find((r) => r.id === filters.roomId)?.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('roomId', undefined)}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
