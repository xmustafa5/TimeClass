'use client';

import { useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { teacherSchema, TeacherFormData } from '@/lib/validations';
import { weekDaysArabic, WeekDay, Teacher } from '@/types';
import { Loader2 } from 'lucide-react';

const weekDays: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

interface TeacherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TeacherFormData) => void;
  teacher?: Teacher | null;
  isLoading?: boolean;
}

export function TeacherFormDialog({
  open,
  onOpenChange,
  onSubmit,
  teacher,
  isLoading = false,
}: TeacherFormDialogProps) {
  const isEditing = !!teacher;

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      fullName: '',
      subject: '',
      weeklyPeriods: 20,
      workDays: [],
      notes: '',
    },
  });

  // Reset form when dialog opens/closes or teacher changes
  useEffect(() => {
    if (open) {
      if (teacher) {
        form.reset({
          fullName: teacher.fullName,
          subject: teacher.subject,
          weeklyPeriods: teacher.weeklyPeriods,
          workDays: teacher.workDays as WeekDay[],
          notes: teacher.notes || '',
        });
      } else {
        form.reset({
          fullName: '',
          subject: '',
          weeklyPeriods: 20,
          workDays: [],
          notes: '',
        });
      }
    }
  }, [open, teacher, form]);

  const handleSubmit = (data: TeacherFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'تعديل بيانات المدرس' : 'إضافة مدرس جديد'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الكامل</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسم المدرس" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المادة</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل المادة التي يدرسها" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weeklyPeriods"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عدد الحصص الأسبوعية</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={35}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workDays"
              render={() => (
                <FormItem>
                  <FormLabel>أيام الدوام</FormLabel>
                  <div className="flex flex-wrap gap-3">
                    {weekDays.map((day) => (
                      <FormField
                        key={day}
                        control={form.control}
                        name="workDays"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, day]);
                                  } else {
                                    field.onChange(current.filter((d) => d !== day));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {weekDaysArabic[day]}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أدخل أي ملاحظات إضافية"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={isLoading}>
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
