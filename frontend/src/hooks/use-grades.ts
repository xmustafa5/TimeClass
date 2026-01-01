import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gradesApi, CreateGradeInput, UpdateGradeInput } from '@/lib/api';
import type { Grade } from '@/types';
import { toast } from 'sonner';

// Query keys factory
export const gradeKeys = {
  all: ['grades'] as const,
  lists: () => [...gradeKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...gradeKeys.lists(), filters] as const,
  details: () => [...gradeKeys.all, 'detail'] as const,
  detail: (id: string) => [...gradeKeys.details(), id] as const,
};

// Get all grades
export function useGrades() {
  return useQuery({
    queryKey: gradeKeys.lists(),
    queryFn: async () => {
      const response = await gradesApi.getAll();
      // Backend returns { grades: [...], total, page, limit }
      const data = response.data as { grades: Grade[]; total: number; page: number; limit: number } | undefined;
      return data?.grades ?? [];
    },
  });
}

// Get single grade by ID
export function useGrade(id: string) {
  return useQuery({
    queryKey: gradeKeys.detail(id),
    queryFn: async () => {
      const response = await gradesApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create grade mutation
export function useCreateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGradeInput) => gradesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.lists() });
      toast.success('تم إضافة الصف بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل في إضافة الصف');
    },
  });
}

// Update grade mutation
export function useUpdateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGradeInput }) =>
      gradesApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: gradeKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: gradeKeys.lists() });

      const previousGrade = queryClient.getQueryData<Grade>(gradeKeys.detail(id));
      const previousGrades = queryClient.getQueryData<Grade[]>(gradeKeys.lists());

      if (previousGrade) {
        queryClient.setQueryData<Grade>(gradeKeys.detail(id), {
          ...previousGrade,
          ...data,
        });
      }

      if (previousGrades) {
        queryClient.setQueryData<Grade[]>(
          gradeKeys.lists(),
          previousGrades.map((g) => (g.id === id ? { ...g, ...data } : g))
        );
      }

      return { previousGrade, previousGrades };
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousGrade) {
        queryClient.setQueryData(gradeKeys.detail(id), context.previousGrade);
      }
      if (context?.previousGrades) {
        queryClient.setQueryData(gradeKeys.lists(), context.previousGrades);
      }
      toast.error(error.message || 'فشل في تحديث الصف');
    },
    onSuccess: () => {
      toast.success('تم تحديث الصف بنجاح');
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: gradeKeys.lists() });
    },
  });
}

// Delete grade mutation
export function useDeleteGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gradesApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: gradeKeys.lists() });

      const previousGrades = queryClient.getQueryData<Grade[]>(gradeKeys.lists());

      if (previousGrades) {
        queryClient.setQueryData<Grade[]>(
          gradeKeys.lists(),
          previousGrades.filter((g) => g.id !== id)
        );
      }

      return { previousGrades };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousGrades) {
        queryClient.setQueryData(gradeKeys.lists(), context.previousGrades);
      }
      toast.error(error.message || 'فشل في حذف الصف');
    },
    onSuccess: () => {
      toast.success('تم حذف الصف بنجاح');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.lists() });
    },
  });
}
