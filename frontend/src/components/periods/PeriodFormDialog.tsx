'use client';

import { useEffect, useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { periodSchema, PeriodFormData, validatePeriodNoOverlap } from '@/lib/validations';
import { Period } from '@/types';
import { Loader2, AlertTriangle } from 'lucide-react';

interface PeriodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PeriodFormData) => void;
  period?: Period | null;
  existingPeriods?: Period[];
  isLoading?: boolean;
}

const periodNames = [
  'الأولى',
  'الثانية',
  'الثالثة',
  'الرابعة',
  'الخامسة',
  'السادسة',
  'السابعة',
  'الثامنة',
  'التاسعة',
  'العاشرة',
];

const getPeriodName = (number: number) => {
  return periodNames[number - 1] || `الحصة ${number}`;
};

export function PeriodFormDialog({
  open,
  onOpenChange,
  onSubmit,
  period,
  existingPeriods = [],
  isLoading = false,
}: PeriodFormDialogProps) {
  const isEditing = !!period;
  const [overlapError, setOverlapError] = useState<string | null>(null);

  const form = useForm<PeriodFormData>({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      number: 1,
      startTime: '08:00',
      endTime: '08:45',
    },
  });

  useEffect(() => {
    if (open) {
      setOverlapError(null);
      if (period) {
        form.reset({
          number: period.number,
          startTime: period.startTime,
          endTime: period.endTime,
        });
      } else {
        form.reset({
          number: 1,
          startTime: '08:00',
          endTime: '08:45',
        });
      }
    }
  }, [open, period, form]);

  // Watch form values for real-time overlap checking
  const startTime = form.watch('startTime');
  const endTime = form.watch('endTime');

  useEffect(() => {
    if (startTime && endTime && existingPeriods.length > 0) {
      const validation = validatePeriodNoOverlap(
        { startTime, endTime },
        existingPeriods,
        period?.id
      );

      if (!validation.isValid && validation.conflictingPeriod) {
        const conflicting = validation.conflictingPeriod;
        setOverlapError(
          `يتعارض مع الحصة ${getPeriodName(conflicting.number)} (${conflicting.startTime} - ${conflicting.endTime})`
        );
      } else {
        setOverlapError(null);
      }
    } else {
      setOverlapError(null);
    }
  }, [startTime, endTime, existingPeriods, period?.id]);

  const handleSubmit = (data: PeriodFormData) => {
    // Final overlap check before submit
    const validation = validatePeriodNoOverlap(
      { startTime: data.startTime, endTime: data.endTime },
      existingPeriods,
      period?.id
    );

    if (!validation.isValid) {
      const conflicting = validation.conflictingPeriod!;
      setOverlapError(
        `يتعارض مع الحصة ${getPeriodName(conflicting.number)} (${conflicting.startTime} - ${conflicting.endTime})`
      );
      return;
    }

    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'تعديل الحصة' : 'إضافة حصة جديدة'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الحصة</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وقت البداية</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وقت النهاية</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Overlap Warning */}
            {overlapError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{overlapError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || !!overlapError}
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
