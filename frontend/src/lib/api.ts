const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

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
    const error = await response.json();
    throw new Error(error.error || 'Something went wrong');
  }

  return response.json();
}

// Teachers API
export const teachersApi = {
  getAll: () => fetchApi<{ success: boolean; data: unknown[] }>('/teachers'),
  getById: (id: string) => fetchApi<{ success: boolean; data: unknown }>(`/teachers/${id}`),
  create: (data: unknown) => fetchApi('/teachers', { method: 'POST', data }),
  update: (id: string, data: unknown) => fetchApi(`/teachers/${id}`, { method: 'PUT', data }),
  delete: (id: string) => fetchApi(`/teachers/${id}`, { method: 'DELETE' }),
};

// Grades API
export const gradesApi = {
  getAll: () => fetchApi<{ success: boolean; data: unknown[] }>('/grades'),
  getById: (id: string) => fetchApi<{ success: boolean; data: unknown }>(`/grades/${id}`),
  create: (data: unknown) => fetchApi('/grades', { method: 'POST', data }),
  update: (id: string, data: unknown) => fetchApi(`/grades/${id}`, { method: 'PUT', data }),
  delete: (id: string) => fetchApi(`/grades/${id}`, { method: 'DELETE' }),
};

// Sections API
export const sectionsApi = {
  getAll: () => fetchApi<{ success: boolean; data: unknown[] }>('/sections'),
  getByGrade: (gradeId: string) => fetchApi<{ success: boolean; data: unknown[] }>(`/sections/by-grade/${gradeId}`),
  getById: (id: string) => fetchApi<{ success: boolean; data: unknown }>(`/sections/${id}`),
  create: (data: unknown) => fetchApi('/sections', { method: 'POST', data }),
  update: (id: string, data: unknown) => fetchApi(`/sections/${id}`, { method: 'PUT', data }),
  delete: (id: string) => fetchApi(`/sections/${id}`, { method: 'DELETE' }),
};

// Rooms API
export const roomsApi = {
  getAll: () => fetchApi<{ success: boolean; data: unknown[] }>('/rooms'),
  getByType: (type: string) => fetchApi<{ success: boolean; data: unknown[] }>(`/rooms/by-type/${type}`),
  getById: (id: string) => fetchApi<{ success: boolean; data: unknown }>(`/rooms/${id}`),
  create: (data: unknown) => fetchApi('/rooms', { method: 'POST', data }),
  update: (id: string, data: unknown) => fetchApi(`/rooms/${id}`, { method: 'PUT', data }),
  delete: (id: string) => fetchApi(`/rooms/${id}`, { method: 'DELETE' }),
};

// Periods API
export const periodsApi = {
  getAll: () => fetchApi<{ success: boolean; data: unknown[] }>('/periods'),
  getById: (id: string) => fetchApi<{ success: boolean; data: unknown }>(`/periods/${id}`),
  create: (data: unknown) => fetchApi('/periods', { method: 'POST', data }),
  update: (id: string, data: unknown) => fetchApi(`/periods/${id}`, { method: 'PUT', data }),
  delete: (id: string) => fetchApi(`/periods/${id}`, { method: 'DELETE' }),
};

// Schedule API
export const scheduleApi = {
  getAll: () => fetchApi<{ success: boolean; data: unknown[] }>('/schedule'),
  getByDay: (day: string) => fetchApi<{ success: boolean; data: unknown[] }>(`/schedule/by-day/${day}`),
  getByTeacher: (teacherId: string) => fetchApi<{ success: boolean; data: unknown[] }>(`/schedule/by-teacher/${teacherId}`),
  getBySection: (sectionId: string) => fetchApi<{ success: boolean; data: unknown[] }>(`/schedule/by-section/${sectionId}`),
  getByRoom: (roomId: string) => fetchApi<{ success: boolean; data: unknown[] }>(`/schedule/by-room/${roomId}`),
  checkConflicts: (data: unknown) => fetchApi('/schedule/check-conflicts', { method: 'POST', data }),
  getById: (id: string) => fetchApi<{ success: boolean; data: unknown }>(`/schedule/${id}`),
  create: (data: unknown) => fetchApi('/schedule', { method: 'POST', data }),
  update: (id: string, data: unknown) => fetchApi(`/schedule/${id}`, { method: 'PUT', data }),
  delete: (id: string) => fetchApi(`/schedule/${id}`, { method: 'DELETE' }),
};
