import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import {
  createScheduleEntrySchema,
  updateScheduleEntrySchema,
  checkConflictSchema,
  bulkScheduleEntrySchema,
  paginationSchema,
  formatZodError,
  weekDays,
} from '../lib/validations.js';
import { conflictService, type ConflictCheckResult } from '../services/conflict.js';
import { ApiResponse } from '../types/index.js';
import type { ScheduleEntry } from '../generated/prisma/client.js';

// Extended type with relations
interface ScheduleEntryWithRelations extends ScheduleEntry {
  teacher: { id: string; fullName: string; subject: string };
  grade: { id: string; name: string };
  section: { id: string; name: string };
  period: { id: string; number: number; startTime: string; endTime: string };
  room: { id: string; name: string; type: string };
}

interface ScheduleListResponse {
  entries: ScheduleEntryWithRelations[];
  total: number;
  page: number;
  limit: number;
}

// Include for all schedule entry queries
const scheduleInclude = {
  teacher: { select: { id: true, fullName: true, subject: true } },
  grade: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  period: { select: { id: true, number: true, startTime: true, endTime: true } },
  room: { select: { id: true, name: true, type: true } },
};

export const scheduleRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // ============ GET ALL SCHEDULE ENTRIES ============
  fastify.get<{ Querystring: { page?: string; limit?: string; day?: string } }>(
    '/',
    {
      schema: {
        tags: ['schedule'],
        summary: 'Get all schedule entries',
        description: 'Retrieve all schedule entries with pagination and optional day filter',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', description: 'Page number' },
            limit: { type: 'string', description: 'Items per page' },
            day: { type: 'string', enum: [...weekDays], description: 'Filter by day' },
          },
        },
      },
    },
    async (request, reply): Promise<ApiResponse<ScheduleListResponse>> => {
      try {
        const queryResult = paginationSchema.safeParse(request.query);
        const { page, limit } = queryResult.success ? queryResult.data : { page: 1, limit: 20 };
        const skip = (page - 1) * limit;

        const where = request.query.day ? { day: request.query.day } : {};

        const [entries, total] = await Promise.all([
          prisma.scheduleEntry.findMany({
            where,
            skip,
            take: limit,
            include: scheduleInclude,
            orderBy: [{ day: 'asc' }, { period: { number: 'asc' } }],
          }),
          prisma.scheduleEntry.count({ where }),
        ]);

        return {
          success: true,
          data: { entries: entries as ScheduleEntryWithRelations[], total, page, limit },
        };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب الجدول' };
      }
    }
  );

  // ============ GET SCHEDULE BY ID ============
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['schedule'],
        summary: 'Get schedule entry by ID',
        description: 'Retrieve a single schedule entry by ID',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<ScheduleEntryWithRelations>> => {
      try {
        const { id } = request.params;

        const entry = await prisma.scheduleEntry.findUnique({
          where: { id },
          include: scheduleInclude,
        });

        if (!entry) {
          reply.status(404);
          return { success: false, error: 'الحصة غير موجودة في الجدول' };
        }

        return { success: true, data: entry as ScheduleEntryWithRelations };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب الحصة' };
      }
    }
  );

  // ============ CHECK CONFLICTS ============
  fastify.post(
    '/check-conflicts',
    {
      schema: {
        tags: ['schedule'],
        summary: 'Check for schedule conflicts',
        description: 'Check if a proposed schedule entry would cause any conflicts',
        body: {
          type: 'object',
          required: ['teacherId', 'sectionId', 'periodId', 'roomId', 'day'],
          properties: {
            teacherId: { type: 'string', format: 'uuid' },
            sectionId: { type: 'string', format: 'uuid' },
            periodId: { type: 'string', format: 'uuid' },
            roomId: { type: 'string', format: 'uuid' },
            day: { type: 'string', enum: [...weekDays] },
            excludeEntryId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply): Promise<ApiResponse<ConflictCheckResult>> => {
      try {
        const result = checkConflictSchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        const conflictResult = await conflictService.checkConflicts(result.data);

        return { success: true, data: conflictResult };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في فحص التعارضات' };
      }
    }
  );

  // ============ CREATE SCHEDULE ENTRY ============
  fastify.post(
    '/',
    {
      schema: {
        tags: ['schedule'],
        summary: 'Create a new schedule entry',
        description: 'Create a new schedule entry with conflict checking',
        body: {
          type: 'object',
          required: ['teacherId', 'gradeId', 'sectionId', 'periodId', 'roomId', 'day', 'subject'],
          properties: {
            teacherId: { type: 'string', format: 'uuid' },
            gradeId: { type: 'string', format: 'uuid' },
            sectionId: { type: 'string', format: 'uuid' },
            periodId: { type: 'string', format: 'uuid' },
            roomId: { type: 'string', format: 'uuid' },
            day: { type: 'string', enum: [...weekDays] },
            subject: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request, reply): Promise<ApiResponse<ScheduleEntryWithRelations>> => {
      try {
        const result = createScheduleEntrySchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        const data = result.data;

        // Validate references exist
        const refValidation = await conflictService.validateReferences({
          teacherId: data.teacherId,
          gradeId: data.gradeId,
          sectionId: data.sectionId,
          periodId: data.periodId,
          roomId: data.roomId,
        });

        if (!refValidation.valid) {
          reply.status(400);
          return { success: false, error: refValidation.errors.join(', ') };
        }

        // Check for conflicts before creating
        const conflictResult = await conflictService.checkConflicts({
          teacherId: data.teacherId,
          sectionId: data.sectionId,
          periodId: data.periodId,
          roomId: data.roomId,
          day: data.day,
        });

        if (conflictResult.hasConflict) {
          reply.status(409);
          return {
            success: false,
            error: conflictResult.conflicts[0]?.message || 'يوجد تعارض في الجدول',
          };
        }

        // Create the entry using transaction for safety
        const entry = await prisma.$transaction(async (tx) => {
          return tx.scheduleEntry.create({
            data,
            include: scheduleInclude,
          });
        });

        reply.status(201);
        return {
          success: true,
          data: entry as ScheduleEntryWithRelations,
          message: 'تم إضافة الحصة للجدول بنجاح',
        };
      } catch (error) {
        // Handle Prisma unique constraint errors (database-level protection)
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            reply.status(409);
            return { success: false, error: 'يوجد تعارض في الجدول (انتهاك قيد فريد)' };
          }
        }
        reply.status(500);
        return { success: false, error: 'فشل في إضافة الحصة للجدول' };
      }
    }
  );

  // ============ UPDATE SCHEDULE ENTRY ============
  fastify.put<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['schedule'],
        summary: 'Update a schedule entry',
        description: 'Update an existing schedule entry with conflict checking',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<ScheduleEntryWithRelations>> => {
      try {
        const { id } = request.params;
        const result = updateScheduleEntrySchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        // Check if entry exists
        const existing = await prisma.scheduleEntry.findUnique({ where: { id } });
        if (!existing) {
          reply.status(404);
          return { success: false, error: 'الحصة غير موجودة في الجدول' };
        }

        const data = result.data;

        // Merge existing data with update data for conflict checking
        const mergedDay = (data.day || existing.day) as typeof weekDays[number];

        // Check for conflicts (excluding current entry)
        const conflictResult = await conflictService.checkConflicts({
          teacherId: data.teacherId || existing.teacherId,
          sectionId: data.sectionId || existing.sectionId,
          periodId: data.periodId || existing.periodId,
          roomId: data.roomId || existing.roomId,
          day: mergedDay,
          excludeEntryId: id,
        });

        if (conflictResult.hasConflict) {
          reply.status(409);
          return {
            success: false,
            error: conflictResult.conflicts[0]?.message || 'يوجد تعارض في الجدول',
          };
        }

        // Update the entry
        const entry = await prisma.scheduleEntry.update({
          where: { id },
          data,
          include: scheduleInclude,
        });

        return {
          success: true,
          data: entry as ScheduleEntryWithRelations,
          message: 'تم تحديث الحصة بنجاح',
        };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            reply.status(409);
            return { success: false, error: 'يوجد تعارض في الجدول (انتهاك قيد فريد)' };
          }
        }
        reply.status(500);
        return { success: false, error: 'فشل في تحديث الحصة' };
      }
    }
  );

  // ============ DELETE SCHEDULE ENTRY ============
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['schedule'],
        summary: 'Delete a schedule entry',
        description: 'Delete an existing schedule entry',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<null>> => {
      try {
        const { id } = request.params;

        // Check if entry exists
        const existing = await prisma.scheduleEntry.findUnique({ where: { id } });
        if (!existing) {
          reply.status(404);
          return { success: false, error: 'الحصة غير موجودة في الجدول' };
        }

        await prisma.scheduleEntry.delete({ where: { id } });

        return { success: true, message: 'تم حذف الحصة من الجدول بنجاح' };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في حذف الحصة' };
      }
    }
  );

  // ============ BULK CREATE SCHEDULE ENTRIES ============
  fastify.post(
    '/bulk',
    {
      schema: {
        tags: ['schedule'],
        summary: 'Bulk create schedule entries',
        description: 'Create multiple schedule entries at once with conflict checking',
        body: {
          type: 'object',
          required: ['entries'],
          properties: {
            entries: {
              type: 'array',
              items: {
                type: 'object',
                required: ['teacherId', 'gradeId', 'sectionId', 'periodId', 'roomId', 'day', 'subject'],
                properties: {
                  teacherId: { type: 'string', format: 'uuid' },
                  gradeId: { type: 'string', format: 'uuid' },
                  sectionId: { type: 'string', format: 'uuid' },
                  periodId: { type: 'string', format: 'uuid' },
                  roomId: { type: 'string', format: 'uuid' },
                  day: { type: 'string', enum: [...weekDays] },
                  subject: { type: 'string', minLength: 1 },
                },
              },
            },
            skipConflicts: { type: 'boolean', default: false },
          },
        },
      },
    },
    async (request, reply): Promise<ApiResponse<{
      created: ScheduleEntryWithRelations[];
      skipped: { entry: unknown; conflicts: unknown[] }[];
      errors: string[];
    }>> => {
      try {
        const result = bulkScheduleEntrySchema.safeParse(request.body);

        if (!result.success) {
          reply.status(400);
          return { success: false, error: formatZodError(result.error) };
        }

        const { entries, skipConflicts } = result.data;
        const created: ScheduleEntryWithRelations[] = [];
        const skipped: { entry: unknown; conflicts: unknown[] }[] = [];
        const errors: string[] = [];

        // Use interactive transaction for atomic bulk operation
        await prisma.$transaction(async (tx) => {
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];

            // Check for conflicts using the service
            const conflictResult = await conflictService.checkConflicts({
              teacherId: entry.teacherId,
              sectionId: entry.sectionId,
              periodId: entry.periodId,
              roomId: entry.roomId,
              day: entry.day,
            });

            if (conflictResult.hasConflict) {
              if (skipConflicts) {
                skipped.push({ entry, conflicts: conflictResult.conflicts });
                continue;
              } else {
                throw new Error(`تعارض في الإدخال رقم ${i + 1}: ${conflictResult.conflicts[0]?.message}`);
              }
            }

            const createdEntry = await tx.scheduleEntry.create({
              data: entry,
              include: scheduleInclude,
            });

            created.push(createdEntry as ScheduleEntryWithRelations);
          }
        });

        reply.status(201);
        return {
          success: true,
          data: { created, skipped, errors },
          message: `تم إضافة ${created.length} حصة بنجاح${skipped.length > 0 ? ` (تم تخطي ${skipped.length})` : ''}`,
        };
      } catch (error) {
        if (error instanceof Error) {
          reply.status(409);
          return { success: false, error: error.message };
        }
        reply.status(500);
        return { success: false, error: 'فشل في إضافة الحصص' };
      }
    }
  );

  // ============ SCHEDULE BY DAY ============
  fastify.get<{ Params: { day: string } }>(
    '/by-day/:day',
    {
      schema: {
        tags: ['schedule'],
        summary: 'Get schedule for a specific day',
        description: 'Retrieve all schedule entries for a specific day',
        params: {
          type: 'object',
          properties: { day: { type: 'string', enum: [...weekDays] } },
          required: ['day'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<ScheduleEntryWithRelations[]>> => {
      try {
        const { day } = request.params;

        if (!weekDays.includes(day as typeof weekDays[number])) {
          reply.status(400);
          return { success: false, error: 'اليوم غير صالح' };
        }

        const entries = await prisma.scheduleEntry.findMany({
          where: { day },
          include: scheduleInclude,
          orderBy: { period: { number: 'asc' } },
        });

        return { success: true, data: entries as ScheduleEntryWithRelations[] };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب جدول اليوم' };
      }
    }
  );

  // ============ SCHEDULE BY TEACHER ============
  fastify.get<{ Params: { teacherId: string } }>(
    '/by-teacher/:teacherId',
    {
      schema: {
        tags: ['schedule'],
        summary: 'Get schedule for a specific teacher',
        description: 'Retrieve all schedule entries for a specific teacher',
        params: {
          type: 'object',
          properties: { teacherId: { type: 'string', format: 'uuid' } },
          required: ['teacherId'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<ScheduleEntryWithRelations[]>> => {
      try {
        const { teacherId } = request.params;

        const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
        if (!teacher) {
          reply.status(404);
          return { success: false, error: 'المدرس غير موجود' };
        }

        const entries = await prisma.scheduleEntry.findMany({
          where: { teacherId },
          include: scheduleInclude,
          orderBy: [{ day: 'asc' }, { period: { number: 'asc' } }],
        });

        return { success: true, data: entries as ScheduleEntryWithRelations[] };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب جدول المدرس' };
      }
    }
  );

  // ============ SCHEDULE BY SECTION ============
  fastify.get<{ Params: { sectionId: string } }>(
    '/by-section/:sectionId',
    {
      schema: {
        tags: ['schedule'],
        summary: 'Get schedule for a specific section',
        description: 'Retrieve all schedule entries for a specific section',
        params: {
          type: 'object',
          properties: { sectionId: { type: 'string', format: 'uuid' } },
          required: ['sectionId'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<ScheduleEntryWithRelations[]>> => {
      try {
        const { sectionId } = request.params;

        const section = await prisma.section.findUnique({ where: { id: sectionId } });
        if (!section) {
          reply.status(404);
          return { success: false, error: 'الشعبة غير موجودة' };
        }

        const entries = await prisma.scheduleEntry.findMany({
          where: { sectionId },
          include: scheduleInclude,
          orderBy: [{ day: 'asc' }, { period: { number: 'asc' } }],
        });

        return { success: true, data: entries as ScheduleEntryWithRelations[] };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب جدول الشعبة' };
      }
    }
  );

  // ============ SCHEDULE BY ROOM ============
  fastify.get<{ Params: { roomId: string } }>(
    '/by-room/:roomId',
    {
      schema: {
        tags: ['schedule'],
        summary: 'Get schedule for a specific room',
        description: 'Retrieve all schedule entries for a specific room',
        params: {
          type: 'object',
          properties: { roomId: { type: 'string', format: 'uuid' } },
          required: ['roomId'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<ScheduleEntryWithRelations[]>> => {
      try {
        const { roomId } = request.params;

        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room) {
          reply.status(404);
          return { success: false, error: 'القاعة غير موجودة' };
        }

        const entries = await prisma.scheduleEntry.findMany({
          where: { roomId },
          include: scheduleInclude,
          orderBy: [{ day: 'asc' }, { period: { number: 'asc' } }],
        });

        return { success: true, data: entries as ScheduleEntryWithRelations[] };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب جدول القاعة' };
      }
    }
  );

  // ============ SCHEDULE BY GRADE ============
  fastify.get<{ Params: { gradeId: string } }>(
    '/by-grade/:gradeId',
    {
      schema: {
        tags: ['schedule'],
        summary: 'Get schedule for a specific grade',
        description: 'Retrieve all schedule entries for a specific grade (all sections)',
        params: {
          type: 'object',
          properties: { gradeId: { type: 'string', format: 'uuid' } },
          required: ['gradeId'],
        },
      },
    },
    async (request, reply): Promise<ApiResponse<ScheduleEntryWithRelations[]>> => {
      try {
        const { gradeId } = request.params;

        const grade = await prisma.grade.findUnique({ where: { id: gradeId } });
        if (!grade) {
          reply.status(404);
          return { success: false, error: 'الصف غير موجود' };
        }

        const entries = await prisma.scheduleEntry.findMany({
          where: { gradeId },
          include: scheduleInclude,
          orderBy: [{ day: 'asc' }, { section: { name: 'asc' } }, { period: { number: 'asc' } }],
        });

        return { success: true, data: entries as ScheduleEntryWithRelations[] };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب جدول الصف' };
      }
    }
  );

  // ============ WEEKLY SCHEDULE AGGREGATION ============
  fastify.get(
    '/weekly',
    {
      schema: {
        tags: ['schedule'],
        summary: 'Get weekly schedule overview',
        description: 'Get aggregated weekly schedule grouped by day',
      },
    },
    async (request, reply): Promise<ApiResponse<Record<string, ScheduleEntryWithRelations[]>>> => {
      try {
        const entries = await prisma.scheduleEntry.findMany({
          include: scheduleInclude,
          orderBy: [{ day: 'asc' }, { period: { number: 'asc' } }],
        });

        // Group by day
        const weeklySchedule: Record<string, ScheduleEntryWithRelations[]> = {};
        for (const day of weekDays) {
          weeklySchedule[day] = [];
        }

        for (const entry of entries) {
          weeklySchedule[entry.day].push(entry as ScheduleEntryWithRelations);
        }

        return { success: true, data: weeklySchedule };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب الجدول الأسبوعي' };
      }
    }
  );
};
