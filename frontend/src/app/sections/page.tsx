'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Layers, Search, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionFormDialog } from '@/components/sections/SectionFormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/PageSkeleton';
import {
  useSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
} from '@/hooks/use-sections';
import { useGrades } from '@/hooks/use-grades';
import type { Section } from '@/types';
import type { SectionFormData } from '@/lib/validations';

export default function SectionsPage() {
  const searchParams = useSearchParams();
  const initialGradeId = searchParams.get('gradeId') || '';

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGradeId, setFilterGradeId] = useState(initialGradeId);

  // Data fetching
  const { data: sections = [], isLoading: sectionsLoading } = useSections();
  const { data: grades = [] } = useGrades();

  // Mutations
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();

  // Get grade name helper
  const getGradeName = (gradeId: string) => {
    const grade = grades.find((g) => g.id === gradeId);
    return grade?.name || 'غير محدد';
  };

  // Filter sections
  const filteredSections = useMemo(() => {
    let result = sections;

    if (filterGradeId) {
      result = result.filter((s) => s.gradeId === filterGradeId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          getGradeName(s.gradeId).toLowerCase().includes(query)
      );
    }

    return result;
  }, [sections, filterGradeId, searchQuery, grades]);

  // Handlers
  const handleAdd = () => {
    setSelectedSection(null);
    setIsFormOpen(true);
  };

  const handleEdit = (section: Section) => {
    setSelectedSection(section);
    setIsFormOpen(true);
  };

  const handleDelete = (section: Section) => {
    setSelectedSection(section);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (data: SectionFormData) => {
    if (selectedSection) {
      updateSection.mutate(
        { id: selectedSection.id, data },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createSection.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedSection) {
      deleteSection.mutate(selectedSection.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedSection(null);
        },
      });
    }
  };

  const isSubmitting = createSection.isPending || updateSection.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">الشعب</h1>
          <p className="text-muted-foreground mt-1">
            إدارة الشعب الدراسية وربطها بالصفوف
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2 self-start">
          <Plus className="h-4 w-4" />
          إضافة شعبة
        </Button>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">إجمالي الشعب</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sections.length}</div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في الشعب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={filterGradeId} onValueChange={setFilterGradeId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="جميع الصفوف" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">جميع الصفوف</SelectItem>
            {grades.map((grade) => (
              <SelectItem key={grade.id} value={grade.id}>
                {grade.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {sectionsLoading ? (
        <Card>
          <CardContent className="p-6">
            <TableSkeleton rows={5} />
          </CardContent>
        </Card>
      ) : filteredSections.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            {searchQuery || filterGradeId ? (
              <EmptyState
                icon={Search}
                title="لا توجد نتائج"
                description="لم يتم العثور على شعب تطابق بحثك أو الفلتر المحدد"
              />
            ) : (
              <EmptyState
                icon={Layers}
                title="لا توجد شعب"
                description="لم يتم إضافة أي شعب بعد. اضغط على زر الإضافة للبدء."
                action={{
                  label: 'إضافة شعبة',
                  onClick: handleAdd,
                }}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم الشعبة</TableHead>
                <TableHead className="text-right">الصف</TableHead>
                <TableHead className="text-right w-[70px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell className="font-medium">{section.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getGradeName(section.gradeId)}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(section)}>
                          <Pencil className="ml-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(section)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="ml-2 h-4 w-4" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form Dialog */}
      <SectionFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        section={selectedSection}
        grades={grades}
        defaultGradeId={filterGradeId}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="حذف الشعبة"
        description={`هل أنت متأكد من حذف الشعبة "${selectedSection?.name}"؟`}
        confirmLabel="حذف"
        onConfirm={handleConfirmDelete}
        variant="destructive"
        loading={deleteSection.isPending}
      />
    </div>
  );
}
