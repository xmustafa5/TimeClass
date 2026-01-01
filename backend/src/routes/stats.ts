import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  statsService,
  type TeacherStats,
  type OverviewStats,
  type UnusedSlot,
} from '../services/stats.js';
import { ApiResponse } from '../types/index.js';

export const statsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // ============ TEACHER STATISTICS ============
  fastify.get(
    '/teachers',
    {
      schema: {
        tags: ['statistics'],
        summary: 'Get teacher statistics',
        description: 'Get workload statistics for all teachers including scheduled periods and utilization',
      },
    },
    async (request, reply): Promise<ApiResponse<TeacherStats[]>> => {
      try {
        const stats = await statsService.getTeacherStats();
        return { success: true, data: stats };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب إحصائيات المدرسين' };
      }
    }
  );

  // ============ OVERVIEW STATISTICS ============
  fastify.get(
    '/overview',
    {
      schema: {
        tags: ['statistics'],
        summary: 'Get overview statistics',
        description: 'Get general overview statistics for the entire schedule system',
      },
    },
    async (request, reply): Promise<ApiResponse<OverviewStats>> => {
      try {
        const stats = await statsService.getOverviewStats();
        return { success: true, data: stats };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب الإحصائيات العامة' };
      }
    }
  );

  // ============ UNUSED SLOTS ============
  fastify.get(
    '/unused-slots',
    {
      schema: {
        tags: ['statistics'],
        summary: 'Get unused time slots',
        description: 'Find time slots with available teachers',
      },
    },
    async (request, reply): Promise<ApiResponse<UnusedSlot[]>> => {
      try {
        const slots = await statsService.getUnusedSlots();
        return { success: true, data: slots };
      } catch (error) {
        reply.status(500);
        return { success: false, error: 'فشل في جلب الفترات الشاغرة' };
      }
    }
  );
};
