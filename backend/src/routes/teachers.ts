import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Teacher, ApiResponse } from '../types/index.js';

// In-memory storage (replace with database later)
const teachers: Map<string, Teacher> = new Map();

export const teachersRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all teachers
  fastify.get('/', async (): Promise<ApiResponse<Teacher[]>> => {
    return {
      success: true,
      data: Array.from(teachers.values()),
    };
  });

  // Get teacher by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply): Promise<ApiResponse<Teacher>> => {
    const { id } = request.params;
    const teacher = teachers.get(id);

    if (!teacher) {
      reply.status(404);
      return { success: false, error: 'Teacher not found' };
    }

    return { success: true, data: teacher };
  });

  // Create teacher
  fastify.post<{ Body: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'> }>('/', async (request): Promise<ApiResponse<Teacher>> => {
    const id = crypto.randomUUID();
    const now = new Date();

    const teacher: Teacher = {
      id,
      ...request.body,
      createdAt: now,
      updatedAt: now,
    };

    teachers.set(id, teacher);

    return { success: true, data: teacher, message: 'Teacher created successfully' };
  });

  // Update teacher
  fastify.put<{ Params: { id: string }; Body: Partial<Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>> }>(
    '/:id',
    async (request, reply): Promise<ApiResponse<Teacher>> => {
      const { id } = request.params;
      const existing = teachers.get(id);

      if (!existing) {
        reply.status(404);
        return { success: false, error: 'Teacher not found' };
      }

      const updated: Teacher = {
        ...existing,
        ...request.body,
        updatedAt: new Date(),
      };

      teachers.set(id, updated);

      return { success: true, data: updated, message: 'Teacher updated successfully' };
    }
  );

  // Delete teacher
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply): Promise<ApiResponse<null>> => {
    const { id } = request.params;

    if (!teachers.has(id)) {
      reply.status(404);
      return { success: false, error: 'Teacher not found' };
    }

    teachers.delete(id);

    return { success: true, message: 'Teacher deleted successfully' };
  });
};
