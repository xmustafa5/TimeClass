import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Section, ApiResponse } from '../types/index.js';

// In-memory storage (replace with database later)
const sections: Map<string, Section> = new Map();

export const sectionsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all sections
  fastify.get('/', async (): Promise<ApiResponse<Section[]>> => {
    return {
      success: true,
      data: Array.from(sections.values()),
    };
  });

  // Get sections by grade ID
  fastify.get<{ Params: { gradeId: string } }>('/by-grade/:gradeId', async (request): Promise<ApiResponse<Section[]>> => {
    const { gradeId } = request.params;
    const gradeSections = Array.from(sections.values()).filter(s => s.gradeId === gradeId);

    return { success: true, data: gradeSections };
  });

  // Get section by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply): Promise<ApiResponse<Section>> => {
    const { id } = request.params;
    const section = sections.get(id);

    if (!section) {
      reply.status(404);
      return { success: false, error: 'Section not found' };
    }

    return { success: true, data: section };
  });

  // Create section
  fastify.post<{ Body: { name: string; gradeId: string } }>('/', async (request): Promise<ApiResponse<Section>> => {
    const id = crypto.randomUUID();
    const now = new Date();

    const section: Section = {
      id,
      name: request.body.name,
      gradeId: request.body.gradeId,
      createdAt: now,
      updatedAt: now,
    };

    sections.set(id, section);

    return { success: true, data: section, message: 'Section created successfully' };
  });

  // Update section
  fastify.put<{ Params: { id: string }; Body: { name?: string; gradeId?: string } }>(
    '/:id',
    async (request, reply): Promise<ApiResponse<Section>> => {
      const { id } = request.params;
      const existing = sections.get(id);

      if (!existing) {
        reply.status(404);
        return { success: false, error: 'Section not found' };
      }

      const updated: Section = {
        ...existing,
        ...request.body,
        updatedAt: new Date(),
      };

      sections.set(id, updated);

      return { success: true, data: updated, message: 'Section updated successfully' };
    }
  );

  // Delete section
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply): Promise<ApiResponse<null>> => {
    const { id } = request.params;

    if (!sections.has(id)) {
      reply.status(404);
      return { success: false, error: 'Section not found' };
    }

    sections.delete(id);

    return { success: true, message: 'Section deleted successfully' };
  });
};
