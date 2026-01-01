import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  scheduleApi,
  CreateScheduleInput,
  UpdateScheduleInput,
  ConflictCheckInput,
} from '@/lib/api';
import type { ScheduleEntry, WeekDay } from '@/types';
import { toast } from 'sonner';

// Query keys factory
export const scheduleKeys = {
  all: ['schedule'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...scheduleKeys.lists(), filters] as const,
  byDay: (day: WeekDay) => [...scheduleKeys.all, 'byDay', day] as const,
  byTeacher: (teacherId: string) => [...scheduleKeys.all, 'byTeacher', teacherId] as const,
  bySection: (sectionId: string) => [...scheduleKeys.all, 'bySection', sectionId] as const,
  byRoom: (roomId: string) => [...scheduleKeys.all, 'byRoom', roomId] as const,
  details: () => [...scheduleKeys.all, 'detail'] as const,
  detail: (id: string) => [...scheduleKeys.details(), id] as const,
  conflicts: () => [...scheduleKeys.all, 'conflicts'] as const,
};

// Get all schedule entries
export function useSchedule() {
  return useQuery({
    queryKey: scheduleKeys.lists(),
    queryFn: async () => {
      const response = await scheduleApi.getAll();
      // Backend returns { entries: [...], total, page, limit }
      const data = response.data as { entries: ScheduleEntry[]; total: number; page: number; limit: number } | undefined;
      return data?.entries ?? [];
    },
  });
}

// Get schedule by day
export function useScheduleByDay(day: WeekDay) {
  return useQuery({
    queryKey: scheduleKeys.byDay(day),
    queryFn: async () => {
      const response = await scheduleApi.getByDay(day);
      return response.data ?? [];
    },
    enabled: !!day,
  });
}

// Get schedule by teacher
export function useScheduleByTeacher(teacherId: string) {
  return useQuery({
    queryKey: scheduleKeys.byTeacher(teacherId),
    queryFn: async () => {
      const response = await scheduleApi.getByTeacher(teacherId);
      return response.data ?? [];
    },
    enabled: !!teacherId,
  });
}

// Get schedule by section
export function useScheduleBySection(sectionId: string) {
  return useQuery({
    queryKey: scheduleKeys.bySection(sectionId),
    queryFn: async () => {
      const response = await scheduleApi.getBySection(sectionId);
      return response.data ?? [];
    },
    enabled: !!sectionId,
  });
}

// Get schedule by room
export function useScheduleByRoom(roomId: string) {
  return useQuery({
    queryKey: scheduleKeys.byRoom(roomId),
    queryFn: async () => {
      const response = await scheduleApi.getByRoom(roomId);
      return response.data ?? [];
    },
    enabled: !!roomId,
  });
}

// Get single schedule entry by ID
export function useScheduleEntry(id: string) {
  return useQuery({
    queryKey: scheduleKeys.detail(id),
    queryFn: async () => {
      const response = await scheduleApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// Check conflicts mutation
export function useCheckConflicts() {
  return useMutation({
    mutationFn: (data: ConflictCheckInput) => scheduleApi.checkConflicts(data),
  });
}

// Create schedule entry mutation
export function useCreateScheduleEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScheduleInput) => scheduleApi.create(data),
    onSuccess: () => {
      // Invalidate all schedule queries
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success('تم إضافة الحصة للجدول بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل في إضافة الحصة للجدول');
    },
  });
}

// Update schedule entry mutation
export function useUpdateScheduleEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduleInput }) =>
      scheduleApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: scheduleKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: scheduleKeys.lists() });

      const previousEntry = queryClient.getQueryData<ScheduleEntry>(scheduleKeys.detail(id));
      const previousEntries = queryClient.getQueryData<ScheduleEntry[]>(scheduleKeys.lists());

      if (previousEntry) {
        queryClient.setQueryData<ScheduleEntry>(scheduleKeys.detail(id), {
          ...previousEntry,
          ...data,
        });
      }

      if (previousEntries) {
        queryClient.setQueryData<ScheduleEntry[]>(
          scheduleKeys.lists(),
          previousEntries.map((e) => (e.id === id ? { ...e, ...data } : e))
        );
      }

      return { previousEntry, previousEntries };
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousEntry) {
        queryClient.setQueryData(scheduleKeys.detail(id), context.previousEntry);
      }
      if (context?.previousEntries) {
        queryClient.setQueryData(scheduleKeys.lists(), context.previousEntries);
      }
      toast.error(error.message || 'فشل في تحديث الحصة');
    },
    onSuccess: () => {
      toast.success('تم تحديث الحصة بنجاح');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

// Delete schedule entry mutation
export function useDeleteScheduleEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scheduleApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: scheduleKeys.lists() });

      const previousEntries = queryClient.getQueryData<ScheduleEntry[]>(scheduleKeys.lists());

      if (previousEntries) {
        queryClient.setQueryData<ScheduleEntry[]>(
          scheduleKeys.lists(),
          previousEntries.filter((e) => e.id !== id)
        );
      }

      return { previousEntries };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(scheduleKeys.lists(), context.previousEntries);
      }
      toast.error(error.message || 'فشل في حذف الحصة من الجدول');
    },
    onSuccess: () => {
      toast.success('تم حذف الحصة من الجدول بنجاح');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}
