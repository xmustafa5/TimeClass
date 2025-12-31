import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ScheduleEntry, WeekDay, ApiResponse, ConflictCheck } from '../types/index.js';

// In-memory storage (replace with database later)
const scheduleEntries: Map<string, ScheduleEntry> = new Map();

// Conflict checking function - Core business logic
const checkConflicts = (
  entry: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>,
  excludeId?: string
): ConflictCheck => {
  const entries = Array.from(scheduleEntries.values()).filter(e => e.id !== excludeId);

  // Check teacher conflict - same teacher, same day, same period
  const teacherConflict = entries.find(
    e => e.teacherId === entry.teacherId && e.day === entry.day && e.periodId === entry.periodId
  );
  if (teacherConflict) {
    return {
      hasConflict: true,
      conflictType: 'teacher',
      message: 'Teacher is already assigned to another class at this time',
    };
  }

  // Check room conflict - same room, same day, same period
  const roomConflict = entries.find(
    e => e.roomId === entry.roomId && e.day === entry.day && e.periodId === entry.periodId
  );
  if (roomConflict) {
    return {
      hasConflict: true,
      conflictType: 'room',
      message: 'Room is already in use at this time',
    };
  }

  // Check section conflict - same section, same day, same period
  const sectionConflict = entries.find(
    e => e.sectionId === entry.sectionId && e.day === entry.day && e.periodId === entry.periodId
  );
  if (sectionConflict) {
    return {
      hasConflict: true,
      conflictType: 'section',
      message: 'Section already has a class at this time',
    };
  }

  return { hasConflict: false };
};

export const scheduleRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all schedule entries
  fastify.get('/', async (): Promise<ApiResponse<ScheduleEntry[]>> => {
    return {
      success: true,
      data: Array.from(scheduleEntries.values()),
    };
  });

  // Get schedule by day
  fastify.get<{ Params: { day: WeekDay } }>('/by-day/:day', async (request): Promise<ApiResponse<ScheduleEntry[]>> => {
    const { day } = request.params;
    const daySchedule = Array.from(scheduleEntries.values()).filter(e => e.day === day);

    return { success: true, data: daySchedule };
  });

  // Get schedule by teacher
  fastify.get<{ Params: { teacherId: string } }>('/by-teacher/:teacherId', async (request): Promise<ApiResponse<ScheduleEntry[]>> => {
    const { teacherId } = request.params;
    const teacherSchedule = Array.from(scheduleEntries.values()).filter(e => e.teacherId === teacherId);

    return { success: true, data: teacherSchedule };
  });

  // Get schedule by section
  fastify.get<{ Params: { sectionId: string } }>('/by-section/:sectionId', async (request): Promise<ApiResponse<ScheduleEntry[]>> => {
    const { sectionId } = request.params;
    const sectionSchedule = Array.from(scheduleEntries.values()).filter(e => e.sectionId === sectionId);

    return { success: true, data: sectionSchedule };
  });

  // Get schedule by room
  fastify.get<{ Params: { roomId: string } }>('/by-room/:roomId', async (request): Promise<ApiResponse<ScheduleEntry[]>> => {
    const { roomId } = request.params;
    const roomSchedule = Array.from(scheduleEntries.values()).filter(e => e.roomId === roomId);

    return { success: true, data: roomSchedule };
  });

  // Check for conflicts before creating
  fastify.post<{ Body: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'> }>(
    '/check-conflicts',
    async (request): Promise<ApiResponse<ConflictCheck>> => {
      const conflict = checkConflicts(request.body);
      return { success: true, data: conflict };
    }
  );

  // Get entry by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply): Promise<ApiResponse<ScheduleEntry>> => {
    const { id } = request.params;
    const entry = scheduleEntries.get(id);

    if (!entry) {
      reply.status(404);
      return { success: false, error: 'Schedule entry not found' };
    }

    return { success: true, data: entry };
  });

  // Create schedule entry
  fastify.post<{ Body: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'> }>(
    '/',
    async (request, reply): Promise<ApiResponse<ScheduleEntry>> => {
      // Check for conflicts first
      const conflict = checkConflicts(request.body);
      if (conflict.hasConflict) {
        reply.status(409);
        return { success: false, error: conflict.message };
      }

      const id = crypto.randomUUID();
      const now = new Date();

      const entry: ScheduleEntry = {
        id,
        ...request.body,
        createdAt: now,
        updatedAt: now,
      };

      scheduleEntries.set(id, entry);

      return { success: true, data: entry, message: 'Schedule entry created successfully' };
    }
  );

  // Update schedule entry
  fastify.put<{ Params: { id: string }; Body: Partial<Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>> }>(
    '/:id',
    async (request, reply): Promise<ApiResponse<ScheduleEntry>> => {
      const { id } = request.params;
      const existing = scheduleEntries.get(id);

      if (!existing) {
        reply.status(404);
        return { success: false, error: 'Schedule entry not found' };
      }

      // Check for conflicts with the updated entry
      const updatedEntry = { ...existing, ...request.body };
      const conflict = checkConflicts(updatedEntry, id);
      if (conflict.hasConflict) {
        reply.status(409);
        return { success: false, error: conflict.message };
      }

      const updated: ScheduleEntry = {
        ...existing,
        ...request.body,
        updatedAt: new Date(),
      };

      scheduleEntries.set(id, updated);

      return { success: true, data: updated, message: 'Schedule entry updated successfully' };
    }
  );

  // Delete schedule entry
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply): Promise<ApiResponse<null>> => {
    const { id } = request.params;

    if (!scheduleEntries.has(id)) {
      reply.status(404);
      return { success: false, error: 'Schedule entry not found' };
    }

    scheduleEntries.delete(id);

    return { success: true, message: 'Schedule entry deleted successfully' };
  });
};
