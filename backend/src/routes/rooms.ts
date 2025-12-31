import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Room, RoomType, ApiResponse } from '../types/index.js';

// In-memory storage (replace with database later)
const rooms: Map<string, Room> = new Map();

export const roomsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all rooms
  fastify.get('/', async (): Promise<ApiResponse<Room[]>> => {
    return {
      success: true,
      data: Array.from(rooms.values()),
    };
  });

  // Get rooms by type
  fastify.get<{ Params: { type: RoomType } }>('/by-type/:type', async (request): Promise<ApiResponse<Room[]>> => {
    const { type } = request.params;
    const filteredRooms = Array.from(rooms.values()).filter(r => r.type === type);

    return { success: true, data: filteredRooms };
  });

  // Get room by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply): Promise<ApiResponse<Room>> => {
    const { id } = request.params;
    const room = rooms.get(id);

    if (!room) {
      reply.status(404);
      return { success: false, error: 'Room not found' };
    }

    return { success: true, data: room };
  });

  // Create room
  fastify.post<{ Body: { name: string; capacity: number; type: RoomType } }>('/', async (request): Promise<ApiResponse<Room>> => {
    const id = crypto.randomUUID();
    const now = new Date();

    const room: Room = {
      id,
      name: request.body.name,
      capacity: request.body.capacity,
      type: request.body.type,
      createdAt: now,
      updatedAt: now,
    };

    rooms.set(id, room);

    return { success: true, data: room, message: 'Room created successfully' };
  });

  // Update room
  fastify.put<{ Params: { id: string }; Body: { name?: string; capacity?: number; type?: RoomType } }>(
    '/:id',
    async (request, reply): Promise<ApiResponse<Room>> => {
      const { id } = request.params;
      const existing = rooms.get(id);

      if (!existing) {
        reply.status(404);
        return { success: false, error: 'Room not found' };
      }

      const updated: Room = {
        ...existing,
        ...request.body,
        updatedAt: new Date(),
      };

      rooms.set(id, updated);

      return { success: true, data: updated, message: 'Room updated successfully' };
    }
  );

  // Delete room
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply): Promise<ApiResponse<null>> => {
    const { id } = request.params;

    if (!rooms.has(id)) {
      reply.status(404);
      return { success: false, error: 'Room not found' };
    }

    rooms.delete(id);

    return { success: true, message: 'Room deleted successfully' };
  });
};
