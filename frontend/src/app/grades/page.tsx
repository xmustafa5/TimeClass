'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, GraduationCap, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GradeFormDialog } from '@/components/grades/GradeFormDialog';
import { GradeCard } from '@/components/grades/GradeCard';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/PageSkeleton';
import {
  useGrades,
  useCreateGrade,
  useUpdateGrade,
  useDeleteGrade,
} from '@/hooks/use-grades';
import { useSections } from '@/hooks/use-sections';
import type { Grade } from '@/types';
import type { GradeFormData } from '@/lib/validations';

export default function GradesPage() {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Data fetching
  const { data: grades = [], isLoading: gradesLoading } = useGrades();
  const { data: sections = [] } = useSections();

  // Mutations
  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();
  const deleteGrade = useDeleteGrade();

  // Filter grades
  const filteredGrades = searchQuery
    ? grades.filter((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : grades;

  // Handlers
  const handleAdd = () => {
    setSelectedGrade(null);
    setIsFormOpen(true);
  };

  const handleEdit = (grade: Grade) => {
    setSelectedGrade(grade);
    setIsFormOpen(true);
  };

  const handleDelete = (grade: Grade) => {
    setSelectedGrade(grade);
    setIsDeleteOpen(true);
  };

  const handleViewSections = (grade: Grade) => {
    router.push(`/sections?gradeId=${grade.id}`);
  };

  const handleFormSubmit = (data: GradeFormData) => {
    if (selectedGrade) {
      updateGrade.mutate(
        { id: selectedGrade.id, data },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createGrade.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedGrade) {
      deleteGrade.mutate(selectedGrade.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedGrade(null);
        },
      });
    }
  };

  const isSubmitting = createGrade.isPending || updateGrade.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">الصفوف</h1>
          <p className="text-muted-foreground mt-1">
            إدارة الصفوف الدراسية والشعب التابعة لها
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2 self-start">
          <Plus className="h-4 w-4" />
          إضافة صف
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الصفوف</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grades.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الشعب</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sections.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث في الصفوف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Grades Grid */}
      {gradesLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredGrades.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            {searchQuery ? (
              <EmptyState
                icon={Search}
                title="لا توجد نتائج"
                description="لم يتم العثور على صفوف تطابق بحثك"
              />
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="لا توجد صفوف"
                description="لم يتم إضافة أي صفوف بعد. اضغط على زر الإضافة للبدء."
                action={{
                  label: 'إضافة صف',
                  onClick: handleAdd,
                }}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGrades.map((grade) => (
            <GradeCard
              key={grade.id}
              grade={grade}
              sections={sections}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewSections={handleViewSections}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <GradeFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        grade={selectedGrade}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="حذف الصف"
        description={`هل أنت متأكد من حذف "${selectedGrade?.name}"؟ سيتم حذف جميع الشعب التابعة لهذا الصف.`}
        confirmLabel="حذف"
        onConfirm={handleConfirmDelete}
        variant="destructive"
        loading={deleteGrade.isPending}
      />
    </div>
  );
}
