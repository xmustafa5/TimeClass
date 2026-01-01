import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import {
  createTeacherSchema,
  updateTeacherSchema,
  bulkTeacherSchema,
  paginationSchema,
  formatZodError,
} from '../lib/validations.js';
import { ApiResponse } from '../types/index.js';
import type { Teacher } from '../generated/prisma/client.js';

interface TeachersListResponse {
  teachers: Teacher[];
  total: number;
  page: number;
  limit: number;
}

export const teachersRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all teachers with pagination
  fastify.get<{ Querystring: { page?: string; limit?: string; subject?: string } }>(
    '/',
    {
      schema: {
        tags: ['teachers'],
        summary: 'Get all teachers',
        description: 'Retrieve all teachers with pagination and optional filtering',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', description: 'Page number' },
            limit: { type: 'string', description: 'Items per page' },
            subject: { type: 'string', description: 'Filter by subject' },
          },
        },
      },
    },
    async (request, reply): Promise<ApiResponse<TeachersListResponse>> => {
      try {
        const queryResult = paginationSchema.safeParse(request.query);
        const { page, limit } = queryResult.success ? queryResult.data : { page: 1, limit: 20 };
        const skip = (page - 1) * limit;

        const where = request.query.subject ? { subject: request.query.subject } : {};

        const [teachers, total] = await Promise.all([
          prisma.teacher.findMany({
            where,
            skip,
            take: limit,
            orderBy: { fullName: 'asc' },
          }),
          prisma.teacher.count({ where }),
        ]);

        return {
          success: true,
          data: { teachers, total, page, limit },
        };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب المدرسين' };
      }
    }
  );

  // Get teacher by ID
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['teachers'],
        summary: 'Get teacher by ID',
        description: 'Retrieve a single teacher by their ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<Teacher>> => {
      try {
        const { id } = request.params;

        const teacher = await prisma.teacher.findUnique({
          where: { id },
          include: {
            scheduleEntries: {
              include: {
                period: true,
                section: true,
                grade: true,
              },
            },
          },
        });

        if (!teacher) {
          reply.status(404);
          return { success: false, error: 'المدرس غير موجود' };
        }

        return { success: true, data: teacher };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب المدرس' };
      }
    }
  );

  // Create teacher
  fastify.post(
    '/',
    {
      schema: {
        tags: ['teachers'],
        summary: 'Create a new teacher',
        description: 'Create a new teacher with the provided details',
        body: {
          type: 'object',
          required: ['fullName', 'subject', 'workDays'],
          properties: {
            fullName: { type: 'string', minLength: 2 },
            subject: { type: 'string', minLength: 1 },
            weeklyPeriods: { type: 'number', default: 20 },
            workDays: { type: 'array', items: { type: 'string' } },
            notes: { type: 'string', nullable: true },
          },
        },
      },
    },
    async (request, reply): Promise<ApiResponse<Teacher>> => {
      try {
        const result = createTeacherSchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        const { fullName, subject, weeklyPeriods, workDays, notes } = result.data;

        const teacher = await prisma.teacher.create({
          data: {
            fullName,
            subject,
            weeklyPeriods: weeklyPeriods ?? 20,
            workDays: JSON.stringify(workDays),
            notes,
          },
        });

        reply.status(201);
        return { success: true, data: teacher, message: 'تم إنشاء المدرس بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في إنشاء المدرس' };
      }
    }
  );

  // Update teacher
  fastify.put<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['teachers'],
        summary: 'Update a teacher',
        description: 'Update an existing teacher by ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<Teacher>> => {
      try {
        const { id } = request.params;
        const result = updateTeacherSchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        // Check if teacher exists
        const existing = await prisma.teacher.findUnique({ where: { id } });
        if (!existing) {
          reply.status(404);
          return { success: false, error: 'المدرس غير موجود' };
        }

        const updateData: Record<string, unknown> = { ...result.data };
        if (result.data.workDays) {
          updateData.workDays = JSON.stringify(result.data.workDays);
        }

        const teacher = await prisma.teacher.update({
          where: { id },
          data: updateData,
        });

        return { success: true, data: teacher, message: 'تم تحديث المدرس بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في تحديث المدرس' };
      }
    }
  );

  // Delete teacher
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['teachers'],
        summary: 'Delete a teacher',
        description: 'Delete an existing teacher by ID',
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

        // Check if teacher exists
        const existing = await prisma.teacher.findUnique({ where: { id } });
        if (!existing) {
          reply.status(404);
          return { success: false, error: 'المدرس غير موجود' };
        }

        await prisma.teacher.delete({ where: { id } });

        return { success: true, message: 'تم حذف المدرس بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في حذف المدرس' };
      }
    }
  );

  // Filter teachers by subject
  fastify.get<{ Params: { subject: string } }>(
    '/by-subject/:subject',
    {
      schema: {
        tags: ['teachers'],
        summary: 'Get teachers by subject',
        description: 'Retrieve all teachers that teach a specific subject',
        params: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
          },
          required: ['subject'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<Teacher[]>> => {
      try {
        const { subject } = request.params;

        const teachers = await prisma.teacher.findMany({
          where: { subject },
          orderBy: { fullName: 'asc' },
        });

        return { success: true, data: teachers };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب المدرسين' };
      }
    }
  );

  // Bulk create teachers
  fastify.post(
    '/bulk',
    {
      schema: {
        tags: ['teachers'],
        summary: 'Bulk create teachers',
        description: 'Create multiple teachers in a single request using Prisma createMany',
        body: {
          type: 'object',
          required: ['teachers'],
          properties: {
            teachers: {
              type: 'array',
              items: {
                type: 'object',
                required: ['fullName', 'subject', 'workDays'],
                properties: {
                  fullName: { type: 'string', minLength: 2 },
                  subject: { type: 'string', minLength: 1 },
                  weeklyPeriods: { type: 'number', default: 20 },
                  workDays: { type: 'array', items: { type: 'string' } },
                  notes: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply): Promise<ApiResponse<{ created: number; teachers: Teacher[] }>> => {
      try {
        const result = bulkTeacherSchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        const { teachers: teachersInput } = result.data;

        // Use Prisma transaction for atomic bulk insert
        const createdTeachers = await prisma.$transaction(async (tx) => {
          const results: Teacher[] = [];

          for (const teacher of teachersInput) {
            const created = await tx.teacher.create({
              data: {
                fullName: teacher.fullName,
                subject: teacher.subject,
                weeklyPeriods: teacher.weeklyPeriods ?? 20,
                workDays: JSON.stringify(teacher.workDays),
                notes: teacher.notes,
              },
            });
            results.push(created);
          }

          return results;
        });

        reply.status(201);
        return {
          success: true,
          data: {
            created: createdTeachers.length,
            teachers: createdTeachers,
          },
          message: `تم إنشاء ${createdTeachers.length} مدرس بنجاح`,
        };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في إنشاء المدرسين' };
      }
    }
  );
};
