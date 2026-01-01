import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import {
  createPeriodSchema,
  updatePeriodSchema,
  formatZodError,
} from '../lib/validations.js';
import { ApiResponse } from '../types/index.js';
import type { Period } from '../generated/prisma/client.js';

export const periodsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all periods (sorted by number)
  fastify.get(
    '/',
    {
      schema: {
        tags: ['periods'],
        summary: 'Get all periods',
        description: 'Retrieve all periods sorted by period number',
      },
    },
    async (request, reply): Promise<ApiResponse<Period[]>> => {
      try {
        const periods = await prisma.period.findMany({
          orderBy: { number: 'asc' },
        });

        return { success: true, data: periods };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب الحصص' };
      }
    }
  );

  // Get period by ID
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['periods'],
        summary: 'Get period by ID',
        description: 'Retrieve a single period by ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<Period>> => {
      try {
        const { id } = request.params;

        const period = await prisma.period.findUnique({
          where: { id },
          include: {
            scheduleEntries: {
              include: {
                teacher: true,
                section: true,
                room: true,
                grade: true,
              },
            },
          },
        });

        if (!period) {
          reply.status(404);
          return { success: false, error: 'الحصة غير موجودة' };
        }

        return { success: true, data: period };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب الحصة' };
      }
    }
  );

  // Create period
  fastify.post(
    '/',
    {
      schema: {
        tags: ['periods'],
        summary: 'Create a new period',
        description: 'Create a new period with time slot',
        body: {
          type: 'object',
          required: ['number', 'startTime', 'endTime'],
          properties: {
            number: { type: 'number', minimum: 1, maximum: 10 },
            startTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
            endTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
          },
        },
      },
    },
    async (request, reply): Promise<ApiResponse<Period>> => {
      try {
        const result = createPeriodSchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        // Check if period number already exists
        const existingNumber = await prisma.period.findUnique({
          where: { number: result.data.number },
        });

        if (existingNumber) {
          reply.status(409);
          return { success: false, error: 'رقم الحصة موجود مسبقاً' };
        }

        // Check for time overlaps with existing periods
        const allPeriods = await prisma.period.findMany();
        const newStart = result.data.startTime;
        const newEnd = result.data.endTime;

        for (const existingPeriod of allPeriods) {
          const existingStart = existingPeriod.startTime;
          const existingEnd = existingPeriod.endTime;

          // Check if times overlap
          if (
            (newStart >= existingStart && newStart < existingEnd) ||
            (newEnd > existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)
          ) {
            reply.status(409);
            return {
              success: false,
              error: `وقت الحصة يتعارض مع الحصة رقم ${existingPeriod.number} (${existingStart} - ${existingEnd})`,
            };
          }
        }

        const period = await prisma.period.create({
          data: result.data,
        });

        reply.status(201);
        return { success: true, data: period, message: 'تم إنشاء الحصة بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في إنشاء الحصة' };
      }
    }
  );

  // Update period
  fastify.put<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['periods'],
        summary: 'Update a period',
        description: 'Update an existing period by ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<Period>> => {
      try {
        const { id } = request.params;
        const result = updatePeriodSchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        // Check if period exists
        const existing = await prisma.period.findUnique({ where: { id } });
        if (!existing) {
          reply.status(404);
          return { success: false, error: 'الحصة غير موجودة' };
        }

        // Check if new number conflicts with another period
        if (result.data.number && result.data.number !== existing.number) {
          const numberConflict = await prisma.period.findUnique({
            where: { number: result.data.number },
          });
          if (numberConflict) {
            reply.status(409);
            return { success: false, error: 'رقم الحصة موجود مسبقاً' };
          }
        }

        // Check for time overlaps if times are being updated
        const newStart = result.data.startTime || existing.startTime;
        const newEnd = result.data.endTime || existing.endTime;

        // Validate start < end
        if (newStart >= newEnd) {
          reply.status(400);
          return { success: false, error: 'وقت البداية يجب أن يكون قبل وقت النهاية' };
        }

        const allPeriods = await prisma.period.findMany({
          where: { NOT: { id } },
        });

        for (const existingPeriod of allPeriods) {
          const existingStart = existingPeriod.startTime;
          const existingEnd = existingPeriod.endTime;

          if (
            (newStart >= existingStart && newStart < existingEnd) ||
            (newEnd > existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)
          ) {
            reply.status(409);
            return {
              success: false,
              error: `وقت الحصة يتعارض مع الحصة رقم ${existingPeriod.number} (${existingStart} - ${existingEnd})`,
            };
          }
        }

        const period = await prisma.period.update({
          where: { id },
          data: result.data,
        });

        return { success: true, data: period, message: 'تم تحديث الحصة بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في تحديث الحصة' };
      }
    }
  );

  // Delete period
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['periods'],
        summary: 'Delete a period',
        description: 'Delete an existing period by ID',
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

        // Check if period exists
        const existing = await prisma.period.findUnique({ where: { id } });
        if (!existing) {
          reply.status(404);
          return { success: false, error: 'الحصة غير موجودة' };
        }

        await prisma.period.delete({ where: { id } });

        return { success: true, message: 'تم حذف الحصة بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في حذف الحصة' };
      }
    }
  );
};
