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
import { periodSchema, PeriodFormData } from '@/lib/validations';
import { Period } from '@/types';
import { Loader2 } from 'lucide-react';

interface PeriodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PeriodFormData) => void;
  period?: Period | null;
  isLoading?: boolean;
}

export function PeriodFormDialog({
  open,
  onOpenChange,
  onSubmit,
  period,
  isLoading = false,
}: PeriodFormDialogProps) {
  const isEditing = !!period;

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

  const handleSubmit = (data: PeriodFormData) => {
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
