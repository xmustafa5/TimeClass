'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { User, BookOpen, MapPin, Users } from 'lucide-react';

interface ScheduleEntryCardProps {
  teacherName: string;
  subject: string;
  sectionName: string;
  roomName: string;
  colorClass: string;
  onClick?: () => void;
  isCompact?: boolean;
}

// Teacher color palette for visual distinction
export const teacherColors = [
  'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-150',
  'bg-green-100 border-green-300 text-green-800 hover:bg-green-150',
  'bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-150',
  'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-150',
  'bg-pink-100 border-pink-300 text-pink-800 hover:bg-pink-150',
  'bg-teal-100 border-teal-300 text-teal-800 hover:bg-teal-150',
  'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-150',
  'bg-indigo-100 border-indigo-300 text-indigo-800 hover:bg-indigo-150',
  'bg-red-100 border-red-300 text-red-800 hover:bg-red-150',
  'bg-cyan-100 border-cyan-300 text-cyan-800 hover:bg-cyan-150',
];

export function getTeacherColor(teacherId: string, teacherIds: string[]): string {
  const index = teacherIds.indexOf(teacherId);
  return teacherColors[index >= 0 ? index % teacherColors.length : 0];
}

export const ScheduleEntryCard = memo(function ScheduleEntryCard({
  teacherName,
  subject,
  sectionName,
  roomName,
  colorClass,
  onClick,
  isCompact = false,
}: ScheduleEntryCardProps) {
  const card = (
    <div
      onClick={onClick}
      className={cn(
        'p-2 rounded-lg border cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:scale-[1.02]',
        colorClass,
        isCompact ? 'min-h-[60px]' : 'min-h-[80px]'
      )}
    >
      <p className="font-medium text-sm truncate">{teacherName}</p>
      <p className="text-xs truncate">{subject}</p>
      {!isCompact && (
        <p className="text-xs opacity-75 truncate mt-1">{sectionName}</p>
      )}
    </div>
  );

  if (isCompact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{card}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-[250px]">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{teacherName}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{subject}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{sectionName}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{roomName}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return card;
});

// Empty slot component
interface EmptySlotProps {
  onClick: () => void;
  isCompact?: boolean;
}

export const EmptySlot = memo(function EmptySlot({
  onClick,
  isCompact = false,
}: EmptySlotProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'border-2 border-dashed border-muted-foreground/25 rounded-lg',
        'hover:border-primary/50 hover:bg-primary/5 cursor-pointer',
        'transition-all duration-200 flex items-center justify-center',
        'text-muted-foreground/50 hover:text-primary/70',
        isCompact ? 'h-[60px]' : 'h-[80px]'
      )}
    >
      <span className="text-lg">+</span>
    </div>
  );
});
