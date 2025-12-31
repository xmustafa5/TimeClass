import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Period, ApiResponse } from '../types/index.js';

// In-memory storage (replace with database later)
const periods: Map<string, Period> = new Map();

export const periodsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all periods
  fastify.get('/', async (): Promise<ApiResponse<Period[]>> => {
    const sortedPeriods = Array.from(periods.values()).sort((a, b) => a.number - b.number);
    return {
      success: true,
      data: sortedPeriods,
    };
  });

  // Get period by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply): Promise<ApiResponse<Period>> => {
    const { id } = request.params;
    const period = periods.get(id);

    if (!period) {
      reply.status(404);
      return { success: false, error: 'Period not found' };
    }

    return { success: true, data: period };
  });

  // Create period
  fastify.post<{ Body: { number: number; startTime: string; endTime: string } }>('/', async (request): Promise<ApiResponse<Period>> => {
    const id = crypto.randomUUID();
    const now = new Date();

    const period: Period = {
      id,
      number: request.body.number,
      startTime: request.body.startTime,
      endTime: request.body.endTime,
      createdAt: now,
      updatedAt: now,
    };

    periods.set(id, period);

    return { success: true, data: period, message: 'Period created successfully' };
  });

  // Update period
  fastify.put<{ Params: { id: string }; Body: { number?: number; startTime?: string; endTime?: string } }>(
    '/:id',
    async (request, reply): Promise<ApiResponse<Period>> => {
      const { id } = request.params;
      const existing = periods.get(id);

      if (!existing) {
        reply.status(404);
        return { success: false, error: 'Period not found' };
      }

      const updated: Period = {
        ...existing,
        ...request.body,
        updatedAt: new Date(),
      };

      periods.set(id, updated);

      return { success: true, data: updated, message: 'Period updated successfully' };
    }
  );

  // Delete period
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply): Promise<ApiResponse<null>> => {
    const { id } = request.params;

    if (!periods.has(id)) {
      reply.status(404);
      return { success: false, error: 'Period not found' };
    }

    periods.delete(id);

    return { success: true, message: 'Period deleted successfully' };
  });
};
