import type {
  Teacher,
  Grade,
  Section,
  Room,
  Period,
  ScheduleEntry,
  ApiResponse,
  RoomType,
  WeekDay,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  data?: unknown;
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { data, ...fetchOptions } = options;

  const config: RequestInit = {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = 'حدث خطأ غير متوقع';
    let errorCode: string | undefined;

    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
      errorCode = error.code;
    } catch {
      // If response isn't JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  return response.json();
}

// ==================== Teachers API ====================
export type CreateTeacherInput = Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTeacherInput = Partial<CreateTeacherInput>;

export const teachersApi = {
  getAll: () =>
    fetchApi<ApiResponse<Teacher[]>>('/teachers'),

  getById: (id: string) =>
    fetchApi<ApiResponse<Teacher>>(`/teachers/${id}`),

  create: (data: CreateTeacherInput) =>
    fetchApi<ApiResponse<Teacher>>('/teachers', { method: 'POST', data }),

  update: (id: string, data: UpdateTeacherInput) =>
    fetchApi<ApiResponse<Teacher>>(`/teachers/${id}`, { method: 'PUT', data }),

  delete: (id: string) =>
    fetchApi<ApiResponse<null>>(`/teachers/${id}`, { method: 'DELETE' }),
};

// ==================== Grades API ====================
export type CreateGradeInput = Omit<Grade, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateGradeInput = Partial<CreateGradeInput>;

export const gradesApi = {
  getAll: () =>
    fetchApi<ApiResponse<Grade[]>>('/grades'),

  getById: (id: string) =>
    fetchApi<ApiResponse<Grade>>(`/grades/${id}`),

  create: (data: CreateGradeInput) =>
    fetchApi<ApiResponse<Grade>>('/grades', { method: 'POST', data }),

  update: (id: string, data: UpdateGradeInput) =>
    fetchApi<ApiResponse<Grade>>(`/grades/${id}`, { method: 'PUT', data }),

  delete: (id: string) =>
    fetchApi<ApiResponse<null>>(`/grades/${id}`, { method: 'DELETE' }),
};

// ==================== Sections API ====================
export type CreateSectionInput = Omit<Section, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSectionInput = Partial<CreateSectionInput>;

export const sectionsApi = {
  getAll: () =>
    fetchApi<ApiResponse<Section[]>>('/sections'),

  getByGrade: (gradeId: string) =>
    fetchApi<ApiResponse<Section[]>>(`/sections/by-grade/${gradeId}`),

  getById: (id: string) =>
    fetchApi<ApiResponse<Section>>(`/sections/${id}`),

  create: (data: CreateSectionInput) =>
    fetchApi<ApiResponse<Section>>('/sections', { method: 'POST', data }),

  update: (id: string, data: UpdateSectionInput) =>
    fetchApi<ApiResponse<Section>>(`/sections/${id}`, { method: 'PUT', data }),

  delete: (id: string) =>
    fetchApi<ApiResponse<null>>(`/sections/${id}`, { method: 'DELETE' }),
};

// ==================== Rooms API ====================
export type CreateRoomInput = Omit<Room, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRoomInput = Partial<CreateRoomInput>;

export const roomsApi = {
  getAll: () =>
    fetchApi<ApiResponse<Room[]>>('/rooms'),

  getByType: (type: RoomType) =>
    fetchApi<ApiResponse<Room[]>>(`/rooms/by-type/${type}`),

  getById: (id: string) =>
    fetchApi<ApiResponse<Room>>(`/rooms/${id}`),

  create: (data: CreateRoomInput) =>
    fetchApi<ApiResponse<Room>>('/rooms', { method: 'POST', data }),

  update: (id: string, data: UpdateRoomInput) =>
    fetchApi<ApiResponse<Room>>(`/rooms/${id}`, { method: 'PUT', data }),

  delete: (id: string) =>
    fetchApi<ApiResponse<null>>(`/rooms/${id}`, { method: 'DELETE' }),
};

// ==================== Periods API ====================
export type CreatePeriodInput = Omit<Period, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePeriodInput = Partial<CreatePeriodInput>;

export const periodsApi = {
  getAll: () =>
    fetchApi<ApiResponse<Period[]>>('/periods'),

  getById: (id: string) =>
    fetchApi<ApiResponse<Period>>(`/periods/${id}`),

  create: (data: CreatePeriodInput) =>
    fetchApi<ApiResponse<Period>>('/periods', { method: 'POST', data }),

  update: (id: string, data: UpdatePeriodInput) =>
    fetchApi<ApiResponse<Period>>(`/periods/${id}`, { method: 'PUT', data }),

  delete: (id: string) =>
    fetchApi<ApiResponse<null>>(`/periods/${id}`, { method: 'DELETE' }),
};

// ==================== Schedule API ====================
export type CreateScheduleInput = Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateScheduleInput = Partial<CreateScheduleInput>;

export interface ConflictCheckInput {
  teacherId: string;
  sectionId: string;
  roomId: string;
  periodId: string;
  day: WeekDay;
  excludeId?: string; // For updates, exclude current entry
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: {
    type: 'teacher' | 'room' | 'section';
    message: string;
    conflictingEntry?: ScheduleEntry;
  }[];
}

export const scheduleApi = {
  getAll: () =>
    fetchApi<ApiResponse<ScheduleEntry[]>>('/schedule'),

  getByDay: (day: WeekDay) =>
    fetchApi<ApiResponse<ScheduleEntry[]>>(`/schedule/by-day/${day}`),

  getByTeacher: (teacherId: string) =>
    fetchApi<ApiResponse<ScheduleEntry[]>>(`/schedule/by-teacher/${teacherId}`),

  getBySection: (sectionId: string) =>
    fetchApi<ApiResponse<ScheduleEntry[]>>(`/schedule/by-section/${sectionId}`),

  getByRoom: (roomId: string) =>
    fetchApi<ApiResponse<ScheduleEntry[]>>(`/schedule/by-room/${roomId}`),

  checkConflicts: (data: ConflictCheckInput) =>
    fetchApi<ApiResponse<ConflictResult>>('/schedule/check-conflicts', { method: 'POST', data }),

  getById: (id: string) =>
    fetchApi<ApiResponse<ScheduleEntry>>(`/schedule/${id}`),

  create: (data: CreateScheduleInput) =>
    fetchApi<ApiResponse<ScheduleEntry>>('/schedule', { method: 'POST', data }),

  update: (id: string, data: UpdateScheduleInput) =>
    fetchApi<ApiResponse<ScheduleEntry>>(`/schedule/${id}`, { method: 'PUT', data }),

  delete: (id: string) =>
    fetchApi<ApiResponse<null>>(`/schedule/${id}`, { method: 'DELETE' }),
};

// ==================== Statistics API ====================
export interface DashboardStats {
  teachersCount: number;
  gradesCount: number;
  sectionsCount: number;
  roomsCount: number;
  periodsCount: number;
  scheduleEntriesCount: number;
}

export const statsApi = {
  getDashboard: () =>
    fetchApi<ApiResponse<DashboardStats>>('/stats/dashboard'),
};
