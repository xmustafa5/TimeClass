'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { scheduleEntrySchema, ScheduleEntryFormData } from '@/lib/validations';
import type { Teacher, Section, Period, ScheduleEntry, WeekDay, Grade } from '@/types';
import { weekDaysArabic } from '@/types';
import { Loader2, AlertTriangle, User, Users, Clock } from 'lucide-react';

interface ConflictInfo {
  type: 'teacher' | 'section';
  message: string;
  conflictingEntry?: ScheduleEntry;
}

interface ScheduleEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ScheduleEntryFormData) => void;
  entry?: ScheduleEntry | null;
  day: WeekDay;
  periodId: string;
  teachers: Teacher[];
  grades: Grade[];
  sections: Section[];
  periods: Period[];
  existingEntries: ScheduleEntry[];
  isLoading?: boolean;
}

export function ScheduleEntryFormDialog({
  open,
  onOpenChange,
  onSubmit,
  entry,
  day,
  periodId,
  teachers,
  grades,
  sections,
  periods,
  existingEntries,
  isLoading = false,
}: ScheduleEntryFormDialogProps) {
  const isEditing = !!entry;
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);

  const period = periods.find((p) => p.id === periodId);

  const form = useForm<ScheduleEntryFormData>({
    resolver: zodResolver(scheduleEntrySchema),
    defaultValues: {
      teacherId: '',
      gradeId: '',
      sectionId: '',
      periodId: periodId,
      day: day,
      subject: '',
    },
  });

  // Watch form values for real-time conflict checking
  const watchedTeacherId = form.watch('teacherId');
  const watchedSectionId = form.watch('sectionId');
  const watchedGradeId = form.watch('gradeId');

  // Filter sections by selected grade
  const filteredSections = useMemo(() => {
    if (!watchedGradeId) return [];
    return sections.filter((s) => s.gradeId === watchedGradeId);
  }, [sections, watchedGradeId]);

  // Auto-fill subject when teacher is selected
  useEffect(() => {
    if (watchedTeacherId && !form.getValues('subject')) {
      const teacher = teachers.find((t) => t.id === watchedTeacherId);
      if (teacher) {
        form.setValue('subject', teacher.subject);
      }
    }
  }, [watchedTeacherId, teachers, form]);

  // Reset section when grade changes
  useEffect(() => {
    if (watchedGradeId && !isEditing) {
      form.setValue('sectionId', '');
    }
  }, [watchedGradeId, form, isEditing]);

  // Check for conflicts
  useEffect(() => {
    const newConflicts: ConflictInfo[] = [];

    // Get entries for the same day and period (excluding current entry if editing)
    const sameslotEntries = existingEntries.filter(
      (e) =>
        e.day === day &&
        e.periodId === periodId &&
        (!entry || e.id !== entry.id)
    );

    // Check teacher conflict
    if (watchedTeacherId) {
      const teacherConflict = sameslotEntries.find(
        (e) => e.teacherId === watchedTeacherId
      );
      if (teacherConflict) {
        const teacher = teachers.find((t) => t.id === watchedTeacherId);
        newConflicts.push({
          type: 'teacher',
          message: `المدرس "${teacher?.fullName}" لديه حصة أخرى في هذا الوقت`,
          conflictingEntry: teacherConflict,
        });
      }
    }

    // Check section conflict
    if (watchedSectionId) {
      const sectionConflict = sameslotEntries.find(
        (e) => e.sectionId === watchedSectionId
      );
      if (sectionConflict) {
        const section = sections.find((s) => s.id === watchedSectionId);
        newConflicts.push({
          type: 'section',
          message: `الشعبة "${section?.name}" لديها حصة أخرى في هذا الوقت`,
          conflictingEntry: sectionConflict,
        });
      }
    }

    setConflicts(newConflicts);
  }, [
    watchedTeacherId,
    watchedSectionId,
    day,
    periodId,
    existingEntries,
    entry,
    teachers,
    sections,
  ]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setConflicts([]);
      if (entry) {
        form.reset({
          teacherId: entry.teacherId,
          gradeId: entry.gradeId,
          sectionId: entry.sectionId,
          periodId: entry.periodId,
          day: entry.day,
          subject: entry.subject,
        });
      } else {
        form.reset({
          teacherId: '',
          gradeId: '',
          sectionId: '',
          periodId: periodId,
          day: day,
          subject: '',
        });
      }
    }
  }, [open, entry, day, periodId, form]);

  const handleSubmit = (data: ScheduleEntryFormData) => {
    if (conflicts.length > 0) {
      return; // Prevent submission with conflicts
    }
    onSubmit(data);
  };

  const hasConflicts = conflicts.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'تعديل الحصة' : 'إضافة حصة جديدة'}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {weekDaysArabic[day]}
            </Badge>
            {period && (
              <Badge variant="outline">
                الحصة {period.number} ({period.startTime} - {period.endTime})
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Teacher selection */}
            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    المدرس
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المدرس" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.fullName} - {teacher.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Grade and Section selection */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gradeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الصف</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الصف" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem key={grade.id} value={grade.id}>
                            {grade.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      الشعبة
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!watchedGradeId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الشعبة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredSections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Subject override */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المادة</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="سيتم استخدام مادة المدرس تلقائياً"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conflict warnings */}
            {conflicts.map((conflict, index) => (
              <Alert key={index} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{conflict.message}</AlertDescription>
              </Alert>
            ))}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || hasConflicts}
              >
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'حفظ التعديلات' : 'إضافة'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
