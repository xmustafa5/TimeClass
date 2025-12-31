import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Grade, ApiResponse } from '../types/index.js';

// In-memory storage (replace with database later)
const grades: Map<string, Grade> = new Map();

export const gradesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all grades
  fastify.get('/', async (): Promise<ApiResponse<Grade[]>> => {
    return {
      success: true,
      data: Array.from(grades.values()),
    };
  });

  // Get grade by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply): Promise<ApiResponse<Grade>> => {
    const { id } = request.params;
    const grade = grades.get(id);

    if (!grade) {
      reply.status(404);
      return { success: false, error: 'Grade not found' };
    }

    return { success: true, data: grade };
  });

  // Create grade
  fastify.post<{ Body: { name: string } }>('/', async (request): Promise<ApiResponse<Grade>> => {
    const id = crypto.randomUUID();
    const now = new Date();

    const grade: Grade = {
      id,
      name: request.body.name,
      createdAt: now,
      updatedAt: now,
    };

    grades.set(id, grade);

    return { success: true, data: grade, message: 'Grade created successfully' };
  });

  // Update grade
  fastify.put<{ Params: { id: string }; Body: { name: string } }>(
    '/:id',
    async (request, reply): Promise<ApiResponse<Grade>> => {
      const { id } = request.params;
      const existing = grades.get(id);

      if (!existing) {
        reply.status(404);
        return { success: false, error: 'Grade not found' };
      }

      const updated: Grade = {
        ...existing,
        name: request.body.name,
        updatedAt: new Date(),
      };

      grades.set(id, updated);

      return { success: true, data: updated, message: 'Grade updated successfully' };
    }
  );

  // Delete grade
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply): Promise<ApiResponse<null>> => {
    const { id } = request.params;

    if (!grades.has(id)) {
      reply.status(404);
      return { success: false, error: 'Grade not found' };
    }

    grades.delete(id);

    return { success: true, message: 'Grade deleted successfully' };
  });
};
