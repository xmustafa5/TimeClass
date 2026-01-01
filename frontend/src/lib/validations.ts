import { z } from 'zod';

// Week days enum
export const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'] as const;
export const weekDaySchema = z.enum(weekDays);

// Room types enum
export const roomTypes = ['regular', 'lab', 'computer'] as const;
export const roomTypeSchema = z.enum(roomTypes);

// Teacher Schema
export const teacherSchema = z.object({
  fullName: z
    .string()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(100, 'الاسم يجب ألا يتجاوز 100 حرف'),
  subject: z
    .string()
    .min(2, 'المادة يجب أن تكون حرفين على الأقل')
    .max(50, 'المادة يجب ألا تتجاوز 50 حرف'),
  weeklyPeriods: z
    .number()
    .min(1, 'عدد الحصص يجب أن يكون 1 على الأقل')
    .max(35, 'عدد الحصص يجب ألا يتجاوز 35'),
  workDays: z
    .array(weekDaySchema)
    .min(1, 'يجب اختيار يوم عمل واحد على الأقل'),
  notes: z.string().max(500, 'الملاحظات يجب ألا تتجاوز 500 حرف').optional(),
});

export type TeacherFormData = z.infer<typeof teacherSchema>;

// Grade Schema
export const gradeSchema = z.object({
  name: z
    .string()
    .min(1, 'اسم الصف مطلوب')
    .max(50, 'اسم الصف يجب ألا يتجاوز 50 حرف'),
});

export type GradeFormData = z.infer<typeof gradeSchema>;

// Section Schema
export const sectionSchema = z.object({
  name: z
    .string()
    .min(1, 'اسم الشعبة مطلوب')
    .max(10, 'اسم الشعبة يجب ألا يتجاوز 10 حروف'),
  gradeId: z.string().min(1, 'يجب اختيار الصف'),
});

export type SectionFormData = z.infer<typeof sectionSchema>;

// Room Schema
export const roomSchema = z.object({
  name: z
    .string()
    .min(1, 'اسم القاعة مطلوب')
    .max(50, 'اسم القاعة يجب ألا يتجاوز 50 حرف'),
  capacity: z
    .number()
    .min(1, 'السعة يجب أن تكون 1 على الأقل')
    .max(500, 'السعة يجب ألا تتجاوز 500'),
  type: roomTypeSchema,
});

export type RoomFormData = z.infer<typeof roomSchema>;

// Period Schema
export const periodSchema = z.object({
  number: z
    .number()
    .min(1, 'رقم الحصة يجب أن يكون 1 على الأقل')
    .max(10, 'رقم الحصة يجب ألا يتجاوز 10'),
  startTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'صيغة الوقت غير صحيحة'),
  endTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'صيغة الوقت غير صحيحة'),
}).refine(
  (data) => {
    const start = data.startTime.split(':').map(Number);
    const end = data.endTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    return endMinutes > startMinutes;
  },
  {
    message: 'وقت النهاية يجب أن يكون بعد وقت البداية',
    path: ['endTime'],
  }
);

export type PeriodFormData = z.infer<typeof periodSchema>;

// Schedule Entry Schema
export const scheduleEntrySchema = z.object({
  teacherId: z.string().min(1, 'يجب اختيار المدرس'),
  gradeId: z.string().min(1, 'يجب اختيار الصف'),
  sectionId: z.string().min(1, 'يجب اختيار الشعبة'),
  periodId: z.string().min(1, 'يجب اختيار الحصة'),
  roomId: z.string().min(1, 'يجب اختيار القاعة'),
  day: weekDaySchema,
  subject: z.string().min(1, 'المادة مطلوبة'),
});

export type ScheduleEntryFormData = z.infer<typeof scheduleEntrySchema>;
