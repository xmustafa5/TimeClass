import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import {
  createRoomSchema,
  updateRoomSchema,
  paginationSchema,
  formatZodError,
  roomTypes,
} from '../lib/validations.js';
import { ApiResponse } from '../types/index.js';
import type { Room } from '../generated/prisma/client.js';

interface RoomsListResponse {
  rooms: Room[];
  total: number;
  page: number;
  limit: number;
}

export const roomsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all rooms with pagination
  fastify.get<{ Querystring: { page?: string; limit?: string; type?: string } }>(
    '/',
    {
      schema: {
        tags: ['rooms'],
        summary: 'Get all rooms',
        description: 'Retrieve all rooms with pagination and optional filtering',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', description: 'Page number' },
            limit: { type: 'string', description: 'Items per page' },
            type: { type: 'string', enum: [...roomTypes], description: 'Filter by room type' },
          },
        },
      },
    },
    async (request, reply): Promise<ApiResponse<RoomsListResponse>> => {
      try {
        const queryResult = paginationSchema.safeParse(request.query);
        const { page, limit } = queryResult.success ? queryResult.data : { page: 1, limit: 20 };
        const skip = (page - 1) * limit;

        const where = request.query.type ? { type: request.query.type } : {};

        const [rooms, total] = await Promise.all([
          prisma.room.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
          }),
          prisma.room.count({ where }),
        ]);

        return {
          success: true,
          data: { rooms, total, page, limit },
        };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب القاعات' };
      }
    }
  );

  // Get rooms by type
  fastify.get<{ Params: { type: string } }>(
    '/by-type/:type',
    {
      schema: {
        tags: ['rooms'],
        summary: 'Get rooms by type',
        description: 'Retrieve all rooms of a specific type',
        params: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: [...roomTypes] },
          },
          required: ['type'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<Room[]>> => {
      try {
        const { type } = request.params;

        if (!roomTypes.includes(type as typeof roomTypes[number])) {
          reply.status(400);
          return { success: false, error: 'نوع القاعة غير صالح' };
        }

        const rooms = await prisma.room.findMany({
          where: { type },
          orderBy: { name: 'asc' },
        });

        return { success: true, data: rooms };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب القاعات' };
      }
    }
  );

  // Get room by ID
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['rooms'],
        summary: 'Get room by ID',
        description: 'Retrieve a single room by ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<Room>> => {
      try {
        const { id } = request.params;

        const room = await prisma.room.findUnique({
          where: { id },
          include: {
            scheduleEntries: {
              include: {
                teacher: true,
                period: true,
                section: true,
                grade: true,
              },
            },
          },
        });

        if (!room) {
          reply.status(404);
          return { success: false, error: 'القاعة غير موجودة' };
        }

        return { success: true, data: room };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب القاعة' };
      }
    }
  );

  // Create room
  fastify.post(
    '/',
    {
      schema: {
        tags: ['rooms'],
        summary: 'Create a new room',
        description: 'Create a new room with the provided details',
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            capacity: { type: 'number', minimum: 1, default: 30 },
            type: { type: 'string', enum: [...roomTypes], default: 'regular' },
          },
        },
      },
    },
    async (request, reply): Promise<ApiResponse<Room>> => {
      try {
        const result = createRoomSchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        // Check if room name already exists
        const existing = await prisma.room.findUnique({
          where: { name: result.data.name },
        });

        if (existing) {
          reply.status(409);
          return { success: false, error: 'اسم القاعة موجود مسبقاً' };
        }

        const room = await prisma.room.create({
          data: result.data,
        });

        reply.status(201);
        return { success: true, data: room, message: 'تم إنشاء القاعة بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في إنشاء القاعة' };
      }
    }
  );

  // Update room
  fastify.put<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['rooms'],
        summary: 'Update a room',
        description: 'Update an existing room by ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<Room>> => {
      try {
        const { id } = request.params;
        const result = updateRoomSchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        // Check if room exists
        const existing = await prisma.room.findUnique({ where: { id } });
        if (!existing) {
          reply.status(404);
          return { success: false, error: 'القاعة غير موجودة' };
        }

        // Check if new name conflicts with another room
        if (result.data.name && result.data.name !== existing.name) {
          const nameConflict = await prisma.room.findUnique({
            where: { name: result.data.name },
          });
          if (nameConflict) {
            reply.status(409);
            return { success: false, error: 'اسم القاعة موجود مسبقاً' };
          }
        }

        const room = await prisma.room.update({
          where: { id },
          data: result.data,
        });

        return { success: true, data: room, message: 'تم تحديث القاعة بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في تحديث القاعة' };
      }
    }
  );

  // Delete room
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['rooms'],
        summary: 'Delete a room',
        description: 'Delete an existing room by ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<null>> => {
      try {
        const { id } = request.params;

        // Check if room exists
        const existing = await prisma.room.findUnique({ where: { id } });
        if (!existing) {
          reply.status(404);
          return { success: false, error: 'القاعة غير موجودة' };
        }

        await prisma.room.delete({ where: { id } });

        return { success: true, message: 'تم حذف القاعة بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في حذف القاعة' };
      }
    }
  );
};
