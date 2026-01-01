'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, Layers } from 'lucide-react';
import { Grade, Section } from '@/types';

interface GradeCardProps {
  grade: Grade;
  sections: Section[];
  onEdit: (grade: Grade) => void;
  onDelete: (grade: Grade) => void;
  onViewSections: (grade: Grade) => void;
}

export function GradeCard({
  grade,
  sections,
  onEdit,
  onDelete,
  onViewSections,
}: GradeCardProps) {
  const sectionCount = sections.filter((s) => s.gradeId === grade.id).length;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">{grade.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Layers className="h-3 w-3" />
              {sectionCount} شعبة
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">خيارات</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewSections(grade)}>
              <Layers className="ml-2 h-4 w-4" />
              عرض الشعب
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(grade)}>
              <Pencil className="ml-2 h-4 w-4" />
              تعديل
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(grade)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="ml-2 h-4 w-4" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onViewSections(grade)}
        >
          <Layers className="ml-2 h-4 w-4" />
          إدارة الشعب
        </Button>
      </CardContent>
    </Card>
  );
}
