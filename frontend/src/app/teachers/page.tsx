'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Users, Download, Trash2, FileSpreadsheet, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TeacherFormDialog } from '@/components/teachers/TeacherFormDialog';
import { TeachersTable } from '@/components/teachers/TeachersTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/PageSkeleton';
import { Pagination } from '@/components/shared/Pagination';
import {
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
  useBulkDeleteTeachers,
} from '@/hooks/use-teachers';
import { exportTeachersToCSV, exportTeachersToJSON } from '@/lib/export';
import type { Teacher } from '@/types';
import type { TeacherFormData } from '@/lib/validations';

export default function TeachersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data fetching
  const { data: teachers = [], isLoading, error } = useTeachers();

  // Mutations
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();
  const bulkDeleteTeachers = useBulkDeleteTeachers();

  // Filter teachers based on search
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const query = searchQuery.toLowerCase();
    return teachers.filter(
      (t) =>
        t.fullName.toLowerCase().includes(query) ||
        t.subject.toLowerCase().includes(query)
    );
  }, [teachers, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTeachers.length / pageSize);
  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTeachers.slice(start, start + pageSize);
  }, [filteredTeachers, currentPage, pageSize]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handlers
  const handleAdd = () => {
    setSelectedTeacher(null);
    setIsFormOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsFormOpen(true);
  };

  const handleDelete = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (data: TeacherFormData) => {
    if (selectedTeacher) {
      updateTeacher.mutate(
        { id: selectedTeacher.id, data },
        {
          onSuccess: () => setIsFormOpen(false),
        }
      );
    } else {
      createTeacher.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedTeacher) {
      deleteTeacher.mutate(selectedTeacher.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedTeacher(null);
        },
      });
    }
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteOpen(true);
  };

  const handleConfirmBulkDelete = () => {
    bulkDeleteTeachers.mutate(selectedIds, {
      onSuccess: () => {
        setIsBulkDeleteOpen(false);
        setSelectedIds([]);
      },
    });
  };

  const handleExportCSV = () => {
    exportTeachersToCSV(selectedIds.length > 0
      ? teachers.filter(t => selectedIds.includes(t.id))
      : teachers
    );
  };

  const handleExportJSON = () => {
    exportTeachersToJSON(selectedIds.length > 0
      ? teachers.filter(t => selectedIds.includes(t.id))
      : teachers
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds([]); // Clear selection on page change
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const isSubmitting = createTeacher.isPending || updateTeacher.isPending;

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        حدث خطأ أثناء تحميل البيانات
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">المدرسون</h1>
          <p className="text-muted-foreground mt-1">
            إدارة قائمة المدرسين والمواد التي يدرسونها
          </p>
        </div>
        <div className="flex gap-2 self-start">
          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                تصدير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="ml-2 h-4 w-4" />
                تصدير CSV
                {selectedIds.length > 0 && ` (${selectedIds.length})`}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON}>
                <FileJson className="ml-2 h-4 w-4" />
                تصدير JSON
                {selectedIds.length > 0 && ` (${selectedIds.length})`}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة مدرس
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">إجمالي المدرسين</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{teachers.length}</div>
        </CardContent>
      </Card>

      {/* Search and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث بالاسم أو المادة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Bulk actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} محدد
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              حذف المحدد
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <TableSkeleton rows={5} />
          </CardContent>
        </Card>
      ) : filteredTeachers.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            {searchQuery ? (
              <EmptyState
                icon={Search}
                title="لا توجد نتائج"
                description="لم يتم العثور على مدرسين تطابق بحثك"
              />
            ) : (
              <EmptyState
                icon={Users}
                title="لا يوجد مدرسون"
                description="لم يتم إضافة أي مدرسين بعد. اضغط على زر الإضافة للبدء."
                action={{
                  label: 'إضافة مدرس',
                  onClick: handleAdd,
                }}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <TeachersTable
            teachers={paginatedTeachers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            showSelection={true}
          />

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredTeachers.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      {/* Form Dialog */}
      <TeacherFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        teacher={selectedTeacher}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="حذف المدرس"
        description={`هل أنت متأكد من حذف المدرس "${selectedTeacher?.fullName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        onConfirm={handleConfirmDelete}
        variant="destructive"
        loading={deleteTeacher.isPending}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        title="حذف المدرسين المحددين"
        description={`هل أنت متأكد من حذف ${selectedIds.length} مدرس؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف الكل"
        onConfirm={handleConfirmBulkDelete}
        variant="destructive"
        loading={bulkDeleteTeachers.isPending}
      />
    </div>
  );
}
