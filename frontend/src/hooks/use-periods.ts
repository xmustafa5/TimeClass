import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { periodsApi, CreatePeriodInput, UpdatePeriodInput } from '@/lib/api';
import type { Period } from '@/types';
import { toast } from 'sonner';

// Query keys factory
export const periodKeys = {
  all: ['periods'] as const,
  lists: () => [...periodKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...periodKeys.lists(), filters] as const,
  details: () => [...periodKeys.all, 'detail'] as const,
  detail: (id: string) => [...periodKeys.details(), id] as const,
};

// Get all periods
export function usePeriods() {
  return useQuery({
    queryKey: periodKeys.lists(),
    queryFn: async () => {
      const response = await periodsApi.getAll();
      return response.data ?? [];
    },
  });
}

// Get single period by ID
export function usePeriod(id: string) {
  return useQuery({
    queryKey: periodKeys.detail(id),
    queryFn: async () => {
      const response = await periodsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create period mutation
export function useCreatePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePeriodInput) => periodsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: periodKeys.lists() });
      toast.success('تم إضافة الحصة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل في إضافة الحصة');
    },
  });
}

// Update period mutation
export function useUpdatePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePeriodInput }) =>
      periodsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: periodKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: periodKeys.lists() });

      const previousPeriod = queryClient.getQueryData<Period>(periodKeys.detail(id));
      const previousPeriods = queryClient.getQueryData<Period[]>(periodKeys.lists());

      if (previousPeriod) {
        queryClient.setQueryData<Period>(periodKeys.detail(id), {
          ...previousPeriod,
          ...data,
        });
      }

      if (previousPeriods) {
        queryClient.setQueryData<Period[]>(
          periodKeys.lists(),
          previousPeriods.map((p) => (p.id === id ? { ...p, ...data } : p))
        );
      }

      return { previousPeriod, previousPeriods };
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousPeriod) {
        queryClient.setQueryData(periodKeys.detail(id), context.previousPeriod);
      }
      if (context?.previousPeriods) {
        queryClient.setQueryData(periodKeys.lists(), context.previousPeriods);
      }
      toast.error(error.message || 'فشل في تحديث الحصة');
    },
    onSuccess: () => {
      toast.success('تم تحديث الحصة بنجاح');
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: periodKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: periodKeys.lists() });
    },
  });
}

// Delete period mutation
export function useDeletePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => periodsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: periodKeys.lists() });

      const previousPeriods = queryClient.getQueryData<Period[]>(periodKeys.lists());

      if (previousPeriods) {
        queryClient.setQueryData<Period[]>(
          periodKeys.lists(),
          previousPeriods.filter((p) => p.id !== id)
        );
      }

      return { previousPeriods };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousPeriods) {
        queryClient.setQueryData(periodKeys.lists(), context.previousPeriods);
      }
      toast.error(error.message || 'فشل في حذف الحصة');
    },
    onSuccess: () => {
      toast.success('تم حذف الحصة بنجاح');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: periodKeys.lists() });
    },
  });
}
