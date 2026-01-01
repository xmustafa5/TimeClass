'use client';

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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Teacher, weekDaysArabic, WeekDay } from '@/types';

interface TeachersTableProps {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  showSelection?: boolean;
}

export function TeachersTable({
  teachers,
  onEdit,
  onDelete,
  selectedIds = [],
  onSelectionChange,
  showSelection = false,
}: TeachersTableProps) {
  const allSelected = teachers.length > 0 && selectedIds.length === teachers.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < teachers.length;

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? teachers.map((t) => t.id) : []);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedIds, id]);
      } else {
        onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
      }
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showSelection && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  // @ts-expect-error - indeterminate is valid but not in types
                  indeterminate={someSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="تحديد الكل"
                />
              </TableHead>
            )}
            <TableHead className="text-right">الاسم</TableHead>
            <TableHead className="text-right">المادة</TableHead>
            <TableHead className="text-right">الحصص الأسبوعية</TableHead>
            <TableHead className="text-right">أيام الدوام</TableHead>
            <TableHead className="text-right w-[70px]">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((teacher) => (
            <TableRow
              key={teacher.id}
              data-state={selectedIds.includes(teacher.id) ? 'selected' : undefined}
            >
              {showSelection && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(teacher.id)}
                    onCheckedChange={(checked) =>
                      handleSelectOne(teacher.id, checked as boolean)
                    }
                    aria-label={`تحديد ${teacher.fullName}`}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">{teacher.fullName}</TableCell>
              <TableCell>
                <Badge variant="secondary">{teacher.subject}</Badge>
              </TableCell>
              <TableCell>{teacher.weeklyPeriods} حصة</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(teacher.workDays as WeekDay[]).map((day) => (
                    <Badge key={day} variant="outline" className="text-xs">
                      {weekDaysArabic[day]}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">فتح القائمة</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(teacher)}>
                      <Pencil className="ml-2 h-4 w-4" />
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(teacher)}
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
  );
}
