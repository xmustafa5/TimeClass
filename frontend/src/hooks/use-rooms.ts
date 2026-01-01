import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roomsApi, CreateRoomInput, UpdateRoomInput } from '@/lib/api';
import type { Room, RoomType } from '@/types';
import { toast } from 'sonner';

// Query keys factory
export const roomKeys = {
  all: ['rooms'] as const,
  lists: () => [...roomKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...roomKeys.lists(), filters] as const,
  byType: (type: RoomType) => [...roomKeys.all, 'byType', type] as const,
  details: () => [...roomKeys.all, 'detail'] as const,
  detail: (id: string) => [...roomKeys.details(), id] as const,
};

// Get all rooms
export function useRooms() {
  return useQuery({
    queryKey: roomKeys.lists(),
    queryFn: async () => {
      const response = await roomsApi.getAll();
      return response.data ?? [];
    },
  });
}

// Get rooms by type
export function useRoomsByType(type: RoomType) {
  return useQuery({
    queryKey: roomKeys.byType(type),
    queryFn: async () => {
      const response = await roomsApi.getByType(type);
      return response.data ?? [];
    },
    enabled: !!type,
  });
}

// Get single room by ID
export function useRoom(id: string) {
  return useQuery({
    queryKey: roomKeys.detail(id),
    queryFn: async () => {
      const response = await roomsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create room mutation
export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoomInput) => roomsApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roomKeys.byType(variables.type) });
      toast.success('تم إضافة القاعة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل في إضافة القاعة');
    },
  });
}

// Update room mutation
export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoomInput }) =>
      roomsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: roomKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: roomKeys.lists() });

      const previousRoom = queryClient.getQueryData<Room>(roomKeys.detail(id));
      const previousRooms = queryClient.getQueryData<Room[]>(roomKeys.lists());

      if (previousRoom) {
        queryClient.setQueryData<Room>(roomKeys.detail(id), {
          ...previousRoom,
          ...data,
        });
      }

      if (previousRooms) {
        queryClient.setQueryData<Room[]>(
          roomKeys.lists(),
          previousRooms.map((r) => (r.id === id ? { ...r, ...data } : r))
        );
      }

      return { previousRoom, previousRooms };
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousRoom) {
        queryClient.setQueryData(roomKeys.detail(id), context.previousRoom);
      }
      if (context?.previousRooms) {
        queryClient.setQueryData(roomKeys.lists(), context.previousRooms);
      }
      toast.error(error.message || 'فشل في تحديث القاعة');
    },
    onSuccess: () => {
      toast.success('تم تحديث القاعة بنجاح');
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
    },
  });
}

// Delete room mutation
export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => roomsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: roomKeys.lists() });

      const previousRooms = queryClient.getQueryData<Room[]>(roomKeys.lists());

      if (previousRooms) {
        queryClient.setQueryData<Room[]>(
          roomKeys.lists(),
          previousRooms.filter((r) => r.id !== id)
        );
      }

      return { previousRooms };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousRooms) {
        queryClient.setQueryData(roomKeys.lists(), context.previousRooms);
      }
      toast.error(error.message || 'فشل في حذف القاعة');
    },
    onSuccess: () => {
      toast.success('تم حذف القاعة بنجاح');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
    },
  });
}
