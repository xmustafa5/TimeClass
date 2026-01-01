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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { sectionSchema, SectionFormData } from '@/lib/validations';
import { Section, Grade } from '@/types';
import { Loader2 } from 'lucide-react';

interface SectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SectionFormData) => void;
  section?: Section | null;
  grades: Grade[];
  defaultGradeId?: string;
  isLoading?: boolean;
}

export function SectionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  section,
  grades,
  defaultGradeId,
  isLoading = false,
}: SectionFormDialogProps) {
  const isEditing = !!section;

  const form = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: '',
      gradeId: defaultGradeId || '',
    },
  });

  useEffect(() => {
    if (open) {
      if (section) {
        form.reset({
          name: section.name,
          gradeId: section.gradeId,
        });
      } else {
        form.reset({
          name: '',
          gradeId: defaultGradeId || '',
        });
      }
    }
  }, [open, section, defaultGradeId, form]);

  const handleSubmit = (data: SectionFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'تعديل الشعبة' : 'إضافة شعبة جديدة'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="gradeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الصف</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الشعبة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: أ، ب، ج" {...field} />
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
