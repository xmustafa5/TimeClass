// Core Entity Types for School Schedule Management System

// المدرسون - Teachers
export interface Teacher {
  id: string;
  fullName: string;           // الاسم الكامل
  subject: string;            // المادة
  weeklyPeriods: number;      // عدد الحصص الأسبوعية
  workDays: string[];         // أيام الدوام
  notes?: string;             // ملاحظات
  createdAt: Date;
  updatedAt: Date;
}

// الصفوف - Grades
export interface Grade {
  id: string;
  name: string;               // اسم الصف (أول، ثاني، ثالث...)
  createdAt: Date;
  updatedAt: Date;
}

// الشُعَب - Sections
export interface Section {
  id: string;
  name: string;               // اسم الشعبة (أ، ب، ج)
  gradeId: string;            // تابعة لصف محدد
  createdAt: Date;
  updatedAt: Date;
}

// القاعات - Rooms
export interface Room {
  id: string;
  name: string;               // اسم/رقم القاعة
  capacity: number;           // السعة
  type: RoomType;             // نوع القاعة
  createdAt: Date;
  updatedAt: Date;
}

export type RoomType = 'regular' | 'lab' | 'computer';  // عادية، مختبر، حاسوب

// الحصص - Periods
export interface Period {
  id: string;
  number: number;             // رقم الحصة (1-7)
  startTime: string;          // وقت البداية
  endTime: string;            // وقت النهاية
  createdAt: Date;
  updatedAt: Date;
}

// أيام الأسبوع - Week Days
export type WeekDay = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday';

// الجدول الدراسي - Schedule Entry
export interface ScheduleEntry {
  id: string;
  teacherId: string;          // المدرس
  gradeId: string;            // الصف
  sectionId: string;          // الشعبة
  periodId: string;           // الحصة
  roomId: string;             // القاعة
  day: WeekDay;               // اليوم
  subject: string;            // المادة
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Conflict Check Types
export interface ConflictCheck {
  hasConflict: boolean;
  conflictType?: 'teacher' | 'room' | 'section';
  message?: string;
}
