import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sectionsApi, CreateSectionInput, UpdateSectionInput } from '@/lib/api';
import type { Section } from '@/types';
import { toast } from 'sonner';

// Query keys factory
export const sectionKeys = {
  all: ['sections'] as const,
  lists: () => [...sectionKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...sectionKeys.lists(), filters] as const,
  byGrade: (gradeId: string) => [...sectionKeys.all, 'byGrade', gradeId] as const,
  details: () => [...sectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...sectionKeys.details(), id] as const,
};

// Get all sections
export function useSections() {
  return useQuery({
    queryKey: sectionKeys.lists(),
    queryFn: async () => {
      const response = await sectionsApi.getAll();
      return response.data ?? [];
    },
  });
}

// Get sections by grade
export function useSectionsByGrade(gradeId: string) {
  return useQuery({
    queryKey: sectionKeys.byGrade(gradeId),
    queryFn: async () => {
      const response = await sectionsApi.getByGrade(gradeId);
      return response.data ?? [];
    },
    enabled: !!gradeId,
  });
}

// Get single section by ID
export function useSection(id: string) {
  return useQuery({
    queryKey: sectionKeys.detail(id),
    queryFn: async () => {
      const response = await sectionsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create section mutation
export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSectionInput) => sectionsApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sectionKeys.byGrade(variables.gradeId) });
      toast.success('تم إضافة الشعبة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل في إضافة الشعبة');
    },
  });
}

// Update section mutation
export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSectionInput }) =>
      sectionsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: sectionKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: sectionKeys.lists() });

      const previousSection = queryClient.getQueryData<Section>(sectionKeys.detail(id));
      const previousSections = queryClient.getQueryData<Section[]>(sectionKeys.lists());

      if (previousSection) {
        queryClient.setQueryData<Section>(sectionKeys.detail(id), {
          ...previousSection,
          ...data,
        });
      }

      if (previousSections) {
        queryClient.setQueryData<Section[]>(
          sectionKeys.lists(),
          previousSections.map((s) => (s.id === id ? { ...s, ...data } : s))
        );
      }

      return { previousSection, previousSections };
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousSection) {
        queryClient.setQueryData(sectionKeys.detail(id), context.previousSection);
      }
      if (context?.previousSections) {
        queryClient.setQueryData(sectionKeys.lists(), context.previousSections);
      }
      toast.error(error.message || 'فشل في تحديث الشعبة');
    },
    onSuccess: () => {
      toast.success('تم تحديث الشعبة بنجاح');
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
      // Also invalidate byGrade queries
      queryClient.invalidateQueries({ queryKey: sectionKeys.all });
    },
  });
}

// Delete section mutation
export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sectionsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: sectionKeys.lists() });

      const previousSections = queryClient.getQueryData<Section[]>(sectionKeys.lists());

      if (previousSections) {
        queryClient.setQueryData<Section[]>(
          sectionKeys.lists(),
          previousSections.filter((s) => s.id !== id)
        );
      }

      return { previousSections };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousSections) {
        queryClient.setQueryData(sectionKeys.lists(), context.previousSections);
      }
      toast.error(error.message || 'فشل في حذف الشعبة');
    },
    onSuccess: () => {
      toast.success('تم حذف الشعبة بنجاح');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.all });
    },
  });
}
