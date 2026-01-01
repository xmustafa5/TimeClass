import { z } from 'zod';

// Days of the week
export const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'] as const;
export const weekDaySchema = z.enum(weekDays);

// Room types
export const roomTypes = ['regular', 'lab', 'computer'] as const;
export const roomTypeSchema = z.enum(roomTypes);

// Time format validation (HH:MM)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const timeSchema = z.string().regex(timeRegex, 'الوقت يجب أن يكون بصيغة HH:MM');

// ============ Teacher Schemas ============
export const createTeacherSchema = z.object({
  fullName: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين'),
  subject: z.string().min(1, 'المادة مطلوبة'),
  weeklyPeriods: z.number().int().min(1).max(40).default(20),
  workDays: z.array(weekDaySchema).min(1, 'يجب تحديد يوم عمل واحد على الأقل'),
  notes: z.string().optional().nullable(),
});

export const updateTeacherSchema = createTeacherSchema.partial();

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;

// ============ Grade Schemas ============
export const createGradeSchema = z.object({
  name: z.string().min(1, 'اسم الصف مطلوب'),
  order: z.number().int().min(0).default(0),
});

export const updateGradeSchema = createGradeSchema.partial();

export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;

// ============ Section Schemas ============
export const createSectionSchema = z.object({
  name: z.string().min(1, 'اسم الشعبة مطلوب'),
  gradeId: z.string().uuid('معرف الصف غير صالح'),
});

export const updateSectionSchema = z.object({
  name: z.string().min(1, 'اسم الشعبة مطلوب').optional(),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

// ============ Room Schemas ============
export const createRoomSchema = z.object({
  name: z.string().min(1, 'اسم القاعة مطلوب'),
  capacity: z.number().int().min(1, 'السعة يجب أن تكون 1 على الأقل').default(30),
  type: roomTypeSchema.default('regular'),
});

export const updateRoomSchema = createRoomSchema.partial();

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

// ============ Period Schemas ============
export const createPeriodSchema = z.object({
  number: z.number().int().min(1, 'رقم الحصة يجب أن يكون 1 على الأقل').max(10),
  startTime: timeSchema,
  endTime: timeSchema,
}).refine(
  (data) => data.startTime < data.endTime,
  { message: 'وقت البداية يجب أن يكون قبل وقت النهاية', path: ['endTime'] }
);

export const updatePeriodSchema = z.object({
  number: z.number().int().min(1).max(10).optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
});

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>;

// ============ Schedule Entry Schemas ============
export const createScheduleEntrySchema = z.object({
  teacherId: z.string().uuid('معرف المدرس غير صالح'),
  gradeId: z.string().uuid('معرف الصف غير صالح'),
  sectionId: z.string().uuid('معرف الشعبة غير صالح'),
  periodId: z.string().uuid('معرف الحصة غير صالح'),
  roomId: z.string().uuid('معرف القاعة غير صالح'),
  day: weekDaySchema,
  subject: z.string().min(1, 'المادة مطلوبة'),
});

export const updateScheduleEntrySchema = createScheduleEntrySchema.partial();

export type CreateScheduleEntryInput = z.infer<typeof createScheduleEntrySchema>;
export type UpdateScheduleEntryInput = z.infer<typeof updateScheduleEntrySchema>;

// ============ Conflict Check Schema ============
export const checkConflictSchema = z.object({
  teacherId: z.string().uuid('معرف المدرس غير صالح'),
  sectionId: z.string().uuid('معرف الشعبة غير صالح'),
  periodId: z.string().uuid('معرف الحصة غير صالح'),
  roomId: z.string().uuid('معرف القاعة غير صالح'),
  day: weekDaySchema,
  excludeEntryId: z.string().uuid().optional(), // For update operations
});

export type CheckConflictInput = z.infer<typeof checkConflictSchema>;

// ============ Bulk Schedule Entry Schema ============
export const bulkScheduleEntrySchema = z.object({
  entries: z.array(createScheduleEntrySchema).min(1, 'يجب إدخال حصة واحدة على الأقل'),
  skipConflicts: z.boolean().default(false), // If true, skip conflicting entries instead of failing
});

export type BulkScheduleEntryInput = z.infer<typeof bulkScheduleEntrySchema>;

// ============ Pagination Schema ============
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ============ ID Param Schema ============
export const idParamSchema = z.object({
  id: z.string().uuid('معرف غير صالح'),
});

// ============ Helper function to format Zod errors ============
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(', ');
}
