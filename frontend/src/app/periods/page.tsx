'use client';

import { useState, useMemo } from 'react';
import { Plus, Clock, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PeriodFormDialog } from '@/components/periods/PeriodFormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/PageSkeleton';
import {
  usePeriods,
  useCreatePeriod,
  useUpdatePeriod,
  useDeletePeriod,
} from '@/hooks/use-periods';
import type { Period } from '@/types';
import type { PeriodFormData } from '@/lib/validations';

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

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'م' : 'ص';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
};

const calculateDuration = (startTime: string, endTime: string) => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return endMinutes - startMinutes;
};

export default function PeriodsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

  // Data fetching
  const { data: periods = [], isLoading } = usePeriods();

  // Mutations
  const createPeriod = useCreatePeriod();
  const updatePeriod = useUpdatePeriod();
  const deletePeriod = useDeletePeriod();

  // Sort periods by number
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => a.number - b.number);
  }, [periods]);

  // Calculate total hours
  const totalMinutes = useMemo(() => {
    return periods.reduce((acc, p) => acc + calculateDuration(p.startTime, p.endTime), 0);
  }, [periods]);

  // Handlers
  const handleAdd = () => {
    setSelectedPeriod(null);
    setIsFormOpen(true);
  };

  const handleEdit = (period: Period) => {
    setSelectedPeriod(period);
    setIsFormOpen(true);
  };

  const handleDelete = (period: Period) => {
    setSelectedPeriod(period);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (data: PeriodFormData) => {
    if (selectedPeriod) {
      updatePeriod.mutate(
        { id: selectedPeriod.id, data },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createPeriod.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedPeriod) {
      deletePeriod.mutate(selectedPeriod.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedPeriod(null);
        },
      });
    }
  };

  const isSubmitting = createPeriod.isPending || updatePeriod.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">الحصص</h1>
          <p className="text-muted-foreground mt-1">
            إدارة أوقات الحصص الدراسية
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2 self-start">
          <Plus className="h-4 w-4" />
          إضافة حصة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحصص</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periods.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الساعات</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(totalMinutes / 60)} ساعة {totalMinutes % 60} دقيقة
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">متوسط مدة الحصة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {periods.length > 0 ? Math.round(totalMinutes / periods.length) : 0} دقيقة
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Periods Timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : sortedPeriods.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Clock}
              title="لا توجد حصص"
              description="لم يتم إضافة أي حصص بعد. اضغط على زر الإضافة للبدء."
              action={{
                label: 'إضافة حصة',
                onClick: handleAdd,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {sortedPeriods.map((period, index) => {
                const duration = calculateDuration(period.startTime, period.endTime);
                return (
                  <div key={period.id} className="relative">
                    {/* Timeline connector */}
                    {index < sortedPeriods.length - 1 && (
                      <div className="absolute right-6 top-14 bottom-0 w-0.5 bg-border" />
                    )}

                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      {/* Period number circle */}
                      <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg shrink-0 z-10">
                        {period.number}
                      </div>

                      {/* Period info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg">
                          الحصة {getPeriodName(period.number)}
                        </h3>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(period.startTime)} - {formatTime(period.endTime)}
                          </span>
                          <span className="text-sm">
                            ({duration} دقيقة)
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(period)}>
                            <Pencil className="ml-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(period)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="ml-2 h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <PeriodFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        period={selectedPeriod}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="حذف الحصة"
        description={`هل أنت متأكد من حذف الحصة "${selectedPeriod ? getPeriodName(selectedPeriod.number) : ''}"؟`}
        confirmLabel="حذف"
        onConfirm={handleConfirmDelete}
        variant="destructive"
        loading={deletePeriod.isPending}
      />
    </div>
  );
}
