import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import {
  createSectionSchema,
  updateSectionSchema,
  paginationSchema,
  formatZodError,
} from '../lib/validations.js';
import { ApiResponse } from '../types/index.js';
import type { Section, Grade } from '../generated/prisma/client.js';

interface SectionWithGrade extends Section {
  grade?: Grade;
}

interface SectionsListResponse {
  sections: SectionWithGrade[];
  total: number;
  page: number;
  limit: number;
}

export const sectionsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all sections with grade info
  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/',
    {
      schema: {
        tags: ['sections'],
        summary: 'Get all sections',
        description: 'Retrieve all sections with grade info and pagination',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', description: 'Page number' },
            limit: { type: 'string', description: 'Items per page' },
          },
        },
      },
    },
    async (request, reply): Promise<ApiResponse<SectionsListResponse>> => {
      try {
        const queryResult = paginationSchema.safeParse(request.query);
        const { page, limit } = queryResult.success ? queryResult.data : { page: 1, limit: 20 };
        const skip = (page - 1) * limit;

        const [sections, total] = await Promise.all([
          prisma.section.findMany({
            skip,
            take: limit,
            include: { grade: true },
            orderBy: [{ grade: { order: 'asc' } }, { name: 'asc' }],
          }),
          prisma.section.count(),
        ]);

        return {
          success: true,
          data: { sections, total, page, limit },
        };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب الشعب' };
      }
    }
  );

  // Get sections by grade ID
  fastify.get<{ Params: { gradeId: string } }>(
    '/by-grade/:gradeId',
    {
      schema: {
        tags: ['sections'],
        summary: 'Get sections by grade',
        description: 'Retrieve all sections for a specific grade',
        params: {
          type: 'object',
          properties: {
            gradeId: { type: 'string', format: 'uuid' },
          },
          required: ['gradeId'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<SectionWithGrade[]>> => {
      try {
        const { gradeId } = request.params;

        // Check if grade exists
        const grade = await prisma.grade.findUnique({ where: { id: gradeId } });
        if (!grade) {
          reply.status(404);
          return { success: false, error: 'الصف غير موجود' };
        }

        const sections = await prisma.section.findMany({
          where: { gradeId },
          include: { grade: true },
          orderBy: { name: 'asc' },
        });

        return { success: true, data: sections };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب الشعب' };
      }
    }
  );

  // Get section by ID
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['sections'],
        summary: 'Get section by ID',
        description: 'Retrieve a single section by ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<SectionWithGrade>> => {
      try {
        const { id } = request.params;

        const section = await prisma.section.findUnique({
          where: { id },
          include: {
            grade: true,
            scheduleEntries: {
              include: {
                teacher: true,
                period: true,
              },
            },
          },
        });

        if (!section) {
          reply.status(404);
          return { success: false, error: 'الشعبة غير موجودة' };
        }

        return { success: true, data: section };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب الشعبة' };
      }
    }
  );

  // Create section
  fastify.post(
    '/',
    {
      schema: {
        tags: ['sections'],
        summary: 'Create a new section',
        description: 'Create a new section linked to a grade',
        body: {
          type: 'object',
          required: ['name', 'gradeId'],
          properties: {
            name: { type: 'string', minLength: 1 },
            gradeId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply): Promise<ApiResponse<SectionWithGrade>> => {
      try {
        const result = createSectionSchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        // Check if grade exists
        const grade = await prisma.grade.findUnique({
          where: { id: result.data.gradeId },
        });

        if (!grade) {
          reply.status(404);
          return { success: false, error: 'الصف غير موجود' };
        }

        // Check if section name already exists in this grade
        const existing = await prisma.section.findFirst({
          where: {
            gradeId: result.data.gradeId,
            name: result.data.name,
          },
        });

        if (existing) {
          reply.status(409);
          return { success: false, error: 'اسم الشعبة موجود مسبقاً في هذا الصف' };
        }

        const section = await prisma.section.create({
          data: result.data,
          include: { grade: true },
        });

        reply.status(201);
        return { success: true, data: section, message: 'تم إنشاء الشعبة بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في إنشاء الشعبة' };
      }
    }
  );

  // Update section
  fastify.put<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['sections'],
        summary: 'Update a section',
        description: 'Update an existing section by ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<SectionWithGrade>> => {
      try {
        const { id } = request.params;
        const result = updateSectionSchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        // Check if section exists
        const existing = await prisma.section.findUnique({ where: { id } });
        if (!existing) {
          reply.status(404);
          return { success: false, error: 'الشعبة غير موجودة' };
        }

        // Check if new name conflicts with another section in same grade
        if (result.data.name && result.data.name !== existing.name) {
          const nameConflict = await prisma.section.findFirst({
            where: {
              gradeId: existing.gradeId,
              name: result.data.name,
              NOT: { id },
            },
          });
          if (nameConflict) {
            reply.status(409);
            return { success: false, error: 'اسم الشعبة موجود مسبقاً في هذا الصف' };
          }
        }

        const section = await prisma.section.update({
          where: { id },
          data: result.data,
          include: { grade: true },
        });

        return { success: true, data: section, message: 'تم تحديث الشعبة بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في تحديث الشعبة' };
      }
    }
  );

  // Delete section
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['sections'],
        summary: 'Delete a section',
        description: 'Delete an existing section by ID',
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

        // Check if section exists
        const existing = await prisma.section.findUnique({ where: { id } });
        if (!existing) {
          reply.status(404);
          return { success: false, error: 'الشعبة غير موجودة' };
        }

        await prisma.section.delete({ where: { id } });

        return { success: true, message: 'تم حذف الشعبة بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في حذف الشعبة' };
      }
    }
  );
};
