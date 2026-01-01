import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import {
  createGradeSchema,
  updateGradeSchema,
  paginationSchema,
  formatZodError,
} from '../lib/validations.js';
import { ApiResponse } from '../types/index.js';
import type { Grade } from '../generated/prisma/client.js';

interface GradeWithSections extends Grade {
  sections?: { id: string; name: string }[];
  _count?: { sections: number };
}

interface GradesListResponse {
  grades: GradeWithSections[];
  total: number;
  page: number;
  limit: number;
}

export const gradesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all grades with section count
  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/',
    {
      schema: {
        tags: ['grades'],
        summary: 'Get all grades',
        description: 'Retrieve all grades with section count and pagination',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', description: 'Page number' },
            limit: { type: 'string', description: 'Items per page' },
          },
        },
      },
    },
    async (request, reply): Promise<ApiResponse<GradesListResponse>> => {
      try {
        const queryResult = paginationSchema.safeParse(request.query);
        const { page, limit } = queryResult.success ? queryResult.data : { page: 1, limit: 20 };
        const skip = (page - 1) * limit;

        const [grades, total] = await Promise.all([
          prisma.grade.findMany({
            skip,
            take: limit,
            orderBy: { order: 'asc' },
            include: {
              _count: { select: { sections: true } },
            },
          }),
          prisma.grade.count(),
        ]);

        return {
          success: true,
          data: { grades, total, page, limit },
        };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب الصفوف' };
      }
    }
  );

  // Get grade by ID with sections
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['grades'],
        summary: 'Get grade by ID',
        description: 'Retrieve a single grade with its sections',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<GradeWithSections>> => {
      try {
        const { id } = request.params;

        const grade = await prisma.grade.findUnique({
          where: { id },
          include: {
            sections: {
              orderBy: { name: 'asc' },
            },
            _count: { select: { sections: true } },
          },
        });

        if (!grade) {
          reply.status(404);
          return { success: false, error: 'الصف غير موجود' };
        }

        return { success: true, data: grade };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب الصف' };
      }
    }
  );

  // Create grade
  fastify.post(
    '/',
    {
      schema: {
        tags: ['grades'],
        summary: 'Create a new grade',
        description: 'Create a new grade with the provided details',
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            order: { type: 'number', default: 0 },
          },
        },
      },
    },
    async (request, reply): Promise<ApiResponse<Grade>> => {
      try {
        const result = createGradeSchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        // Check if grade name already exists
        const existing = await prisma.grade.findUnique({
          where: { name: result.data.name },
        });

        if (existing) {
          reply.status(409);
          return { success: false, error: 'اسم الصف موجود مسبقاً' };
        }

        const grade = await prisma.grade.create({
          data: result.data,
        });

        reply.status(201);
        return { success: true, data: grade, message: 'تم إنشاء الصف بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في إنشاء الصف' };
      }
    }
  );

  // Update grade
  fastify.put<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['grades'],
        summary: 'Update a grade',
        description: 'Update an existing grade by ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<Grade>> => {
      try {
        const { id } = request.params;
        const result = updateGradeSchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        // Check if grade exists
        const existing = await prisma.grade.findUnique({ where: { id } });
        if (!existing) {
          reply.status(404);
          return { success: false, error: 'الصف غير موجود' };
        }

        // Check if new name conflicts with another grade
        if (result.data.name && result.data.name !== existing.name) {
          const nameConflict = await prisma.grade.findUnique({
            where: { name: result.data.name },
          });
          if (nameConflict) {
            reply.status(409);
            return { success: false, error: 'اسم الصف موجود مسبقاً' };
          }
        }

        const grade = await prisma.grade.update({
          where: { id },
          data: result.data,
        });

        return { success: true, data: grade, message: 'تم تحديث الصف بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في تحديث الصف' };
      }
    }
  );

  // Delete grade (cascade deletes sections)
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['grades'],
        summary: 'Delete a grade',
        description: 'Delete an existing grade by ID (cascade deletes sections)',
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

        // Check if grade exists
        const existing = await prisma.grade.findUnique({
          where: { id },
          include: { _count: { select: { sections: true, scheduleEntries: true } } },
        });

        if (!existing) {
          reply.status(404);
          return { success: false, error: 'الصف غير موجود' };
        }

        await prisma.grade.delete({ where: { id } });

        return { success: true, message: 'تم حذف الصف بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في حذف الصف' };
      }
    }
  );
};
