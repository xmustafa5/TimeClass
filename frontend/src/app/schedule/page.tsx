'use client';

import { useState, useMemo, useCallback } from 'react';
import { Calendar, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CardSkeleton } from '@/components/shared/PageSkeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  ScheduleGrid,
  TeacherLegend,
  ScheduleFiltersPanel,
  ScheduleEntryFormDialog,
  type ScheduleFilters,
} from '@/components/schedule';
import {
  useSchedule,
  useCreateScheduleEntry,
  useUpdateScheduleEntry,
  useDeleteScheduleEntry,
} from '@/hooks/use-schedule';
import { useTeachers } from '@/hooks/use-teachers';
import { useGrades } from '@/hooks/use-grades';
import { useSections } from '@/hooks/use-sections';
import { usePeriods } from '@/hooks/use-periods';
import type { ScheduleEntry, WeekDay } from '@/types';
import type { ScheduleEntryFormData } from '@/lib/validations';

export default function SchedulePage() {
  // View state
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDay, setSelectedDay] = useState<WeekDay>('sunday');
  const [filters, setFilters] = useState<ScheduleFilters>({});

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: WeekDay; periodId: string } | null>(null);

  // Data fetching
  const { data: entries = [], isLoading: entriesLoading } = useSchedule();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();
  const { data: sections = [], isLoading: sectionsLoading } = useSections();
  const { data: periods = [], isLoading: periodsLoading } = usePeriods();

  // Mutations
  const createEntry = useCreateScheduleEntry();
  const updateEntry = useUpdateScheduleEntry();
  const deleteEntry = useDeleteScheduleEntry();

  const isLoading = entriesLoading || teachersLoading || gradesLoading ||
                    sectionsLoading || periodsLoading;

  // Filter entries based on active filters
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filters.teacherId && entry.teacherId !== filters.teacherId) return false;
      if (filters.gradeId && entry.gradeId !== filters.gradeId) return false;
      if (filters.sectionId && entry.sectionId !== filters.sectionId) return false;
      return true;
    });
  }, [entries, filters]);

  // Handlers
  const handleSlotClick = useCallback((day: WeekDay, periodId: string) => {
    setSelectedEntry(null);
    setSelectedSlot({ day, periodId });
    setIsFormOpen(true);
  }, []);

  const handleEntryClick = useCallback((entry: ScheduleEntry) => {
    setSelectedEntry(entry);
    setSelectedSlot({ day: entry.day, periodId: entry.periodId });
    setIsFormOpen(true);
  }, []);

  const handleFormSubmit = useCallback((data: ScheduleEntryFormData) => {
    if (selectedEntry) {
      updateEntry.mutate(
        { id: selectedEntry.id, data },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setSelectedEntry(null);
            setSelectedSlot(null);
          },
        }
      );
    } else {
      createEntry.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false);
          setSelectedSlot(null);
        },
      });
    }
  }, [selectedEntry, createEntry, updateEntry]);

  const handleDeleteClick = useCallback(() => {
    if (selectedEntry) {
      setIsFormOpen(false);
      setIsDeleteOpen(true);
    }
  }, [selectedEntry]);

  const handleConfirmDelete = useCallback(() => {
    if (selectedEntry) {
      deleteEntry.mutate(selectedEntry.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedEntry(null);
          setSelectedSlot(null);
        },
      });
    }
  }, [selectedEntry, deleteEntry]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const isSubmitting = createEntry.isPending || updateEntry.isPending;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold">الجدول الدراسي</h1>
          <p className="text-muted-foreground mt-1">
            عرض وإدارة الجدول الأسبوعي للمدرسين والشعب
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                تصدير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                تصدير PDF (قريباً)
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                تصدير Excel (قريباً)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Print header (visible only when printing) */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">الجدول الدراسي الأسبوعي</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Filters */}
      <div className="print:hidden">
        <ScheduleFiltersPanel
          filters={filters}
          onFiltersChange={setFilters}
          teachers={teachers}
          grades={grades}
          sections={sections}
          viewMode={viewMode}
          selectedDay={selectedDay}
          onViewModeChange={setViewMode}
          onSelectedDayChange={setSelectedDay}
        />
      </div>

      {/* Schedule Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <ScheduleGrid
            entries={filteredEntries}
            periods={periods}
            teachers={teachers}
            sections={sections}
            viewMode={viewMode}
            selectedDay={selectedDay}
            onSlotClick={handleSlotClick}
            onEntryClick={handleEntryClick}
          />

          {/* Teacher Legend */}
          <div className="print:hidden">
            <TeacherLegend teachers={teachers} entries={filteredEntries} />
          </div>
        </>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 print:hidden">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">إجمالي الحصص</p>
          <p className="text-2xl font-bold">{entries.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">الحصص المعروضة</p>
          <p className="text-2xl font-bold">{filteredEntries.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">المدرسون النشطون</p>
          <p className="text-2xl font-bold">
            {new Set(entries.map((e) => e.teacherId)).size}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">الخانات الفارغة</p>
          <p className="text-2xl font-bold">
            {periods.length * 5 - entries.length}
          </p>
        </div>
      </div>

      {/* Form Dialog */}
      {selectedSlot && (
        <ScheduleEntryFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) {
              setSelectedEntry(null);
              setSelectedSlot(null);
            }
          }}
          onSubmit={handleFormSubmit}
          entry={selectedEntry}
          day={selectedSlot.day}
          periodId={selectedSlot.periodId}
          teachers={teachers}
          grades={grades}
          sections={sections}
          periods={periods}
          existingEntries={entries}
          isLoading={isSubmitting}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="حذف الحصة"
        description="هل أنت متأكد من حذف هذه الحصة من الجدول؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        onConfirm={handleConfirmDelete}
        variant="destructive"
        loading={deleteEntry.isPending}
      />
    </div>
  );
}
