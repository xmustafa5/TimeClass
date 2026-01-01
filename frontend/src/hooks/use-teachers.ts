import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teachersApi, CreateTeacherInput, UpdateTeacherInput } from '@/lib/api';
import type { Teacher } from '@/types';
import { toast } from 'sonner';

// Query keys factory
export const teacherKeys = {
  all: ['teachers'] as const,
  lists: () => [...teacherKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...teacherKeys.lists(), filters] as const,
  details: () => [...teacherKeys.all, 'detail'] as const,
  detail: (id: string) => [...teacherKeys.details(), id] as const,
};

// Get all teachers
export function useTeachers() {
  return useQuery({
    queryKey: teacherKeys.lists(),
    queryFn: async () => {
      const response = await teachersApi.getAll();
      return response.data ?? [];
    },
  });
}

// Get single teacher by ID
export function useTeacher(id: string) {
  return useQuery({
    queryKey: teacherKeys.detail(id),
    queryFn: async () => {
      const response = await teachersApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create teacher mutation
export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeacherInput) => teachersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      toast.success('تم إضافة المدرس بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل في إضافة المدرس');
    },
  });
}

// Update teacher mutation
export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeacherInput }) =>
      teachersApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: teacherKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: teacherKeys.lists() });

      // Snapshot previous values
      const previousTeacher = queryClient.getQueryData<Teacher>(teacherKeys.detail(id));
      const previousTeachers = queryClient.getQueryData<Teacher[]>(teacherKeys.lists());

      // Optimistically update
      if (previousTeacher) {
        queryClient.setQueryData<Teacher>(teacherKeys.detail(id), {
          ...previousTeacher,
          ...data,
        });
      }

      if (previousTeachers) {
        queryClient.setQueryData<Teacher[]>(
          teacherKeys.lists(),
          previousTeachers.map((t) => (t.id === id ? { ...t, ...data } : t))
        );
      }

      return { previousTeacher, previousTeachers };
    },
    onError: (error: Error, { id }, context) => {
      // Rollback on error
      if (context?.previousTeacher) {
        queryClient.setQueryData(teacherKeys.detail(id), context.previousTeacher);
      }
      if (context?.previousTeachers) {
        queryClient.setQueryData(teacherKeys.lists(), context.previousTeachers);
      }
      toast.error(error.message || 'فشل في تحديث المدرس');
    },
    onSuccess: () => {
      toast.success('تم تحديث المدرس بنجاح');
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
  });
}

// Delete teacher mutation
export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teachersApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: teacherKeys.lists() });

      const previousTeachers = queryClient.getQueryData<Teacher[]>(teacherKeys.lists());

      // Optimistically remove from list
      if (previousTeachers) {
        queryClient.setQueryData<Teacher[]>(
          teacherKeys.lists(),
          previousTeachers.filter((t) => t.id !== id)
        );
      }

      return { previousTeachers };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousTeachers) {
        queryClient.setQueryData(teacherKeys.lists(), context.previousTeachers);
      }
      toast.error(error.message || 'فشل في حذف المدرس');
    },
    onSuccess: () => {
      toast.success('تم حذف المدرس بنجاح');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
  });
}

// Bulk delete teachers mutation
export function useBulkDeleteTeachers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // Delete all teachers in parallel
      await Promise.all(ids.map((id) => teachersApi.delete(id)));
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: teacherKeys.lists() });

      const previousTeachers = queryClient.getQueryData<Teacher[]>(teacherKeys.lists());

      // Optimistically remove from list
      if (previousTeachers) {
        queryClient.setQueryData<Teacher[]>(
          teacherKeys.lists(),
          previousTeachers.filter((t) => !ids.includes(t.id))
        );
      }

      return { previousTeachers };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousTeachers) {
        queryClient.setQueryData(teacherKeys.lists(), context.previousTeachers);
      }
      toast.error(error.message || 'فشل في حذف المدرسين');
    },
    onSuccess: (_, ids) => {
      toast.success(`تم حذف ${ids.length} مدرس بنجاح`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
  });
}
