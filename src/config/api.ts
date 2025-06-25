import { useState } from 'react';

// Configuración de la API para el frontend
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production'
    ? 'https://control-horario-api-final.onrender.com/api'
    : 'http://localhost:5000/api',
  TIMEOUT: 10000, // 10 segundos
  RETRY_ATTEMPTS: 3,
};

// Tipos para las respuestas de la API
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Cliente HTTP básico con configuración
class APIClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string, timeout = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Agregar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    defaultOptions.signal = controller.signal;

    try {
      const response = await fetch(url, defaultOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        throw new Error(`API Error: ${error.message}`);
      }
      throw new Error('Unknown API error');
    }
  }

  // Métodos HTTP
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>> {
    const searchParams = params ? new URLSearchParams(params).toString() : '';
    const url = searchParams ? `${endpoint}?${searchParams}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Instancia global del cliente API
export const apiClient = new APIClient(API_CONFIG.BASE_URL, API_CONFIG.TIMEOUT);

// Servicios específicos para cada entidad

// Servicio de empleados
export const employeeService = {
  getAll: (params?: { active?: boolean; department?: string; page?: number; limit?: number }) =>
    apiClient.get('/employees', params),

  getById: (id: number) =>
    apiClient.get(`/employees/${id}`),

  create: (employee: any) =>
    apiClient.post('/employees', employee),

  update: (id: number, updates: any) =>
    apiClient.put(`/employees/${id}`, updates),

  delete: (id: number) =>
    apiClient.delete(`/employees/${id}`),

  getDepartments: () =>
    apiClient.get('/employees/departments/list'),

  getStatus: (id: number) =>
    apiClient.get(`/employees/${id}/status`),
};

// Servicio de control de tiempo
export const timeService = {
  clockIn: (employeeId: number, location?: string, notes?: string) =>
    apiClient.post('/time/clock-in', { employee_id: employeeId, location, notes }),

  clockOut: (employeeId: number, notes?: string) =>
    apiClient.post('/time/clock-out', { employee_id: employeeId, notes }),

  startBreak: (employeeId: number) =>
    apiClient.post('/time/break-start', { employee_id: employeeId }),

  endBreak: (employeeId: number) =>
    apiClient.post('/time/break-end', { employee_id: employeeId }),

  getEntries: (params?: {
    employee_id?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient.get('/time/entries', params),

  getTodayEntries: () =>
    apiClient.get('/time/today'),

  getActiveEmployees: () =>
    apiClient.get('/time/active'),

  getSummary: (params?: {
    start_date?: string;
    end_date?: string;
    employee_id?: number;
  }) =>
    apiClient.get('/time/summary', params),

  updateEntry: (id: number, updates: any) =>
    apiClient.put(`/time/entries/${id}`, updates),
};

// Servicio de utilidades
export const utilityService = {
  healthCheck: () =>
    fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/health`).then(r => r.json()),

  getDocs: () =>
    apiClient.get('/docs'),
};

// Hook personalizado para manejar estados de loading y errores
export const useApiState = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async <T>(apiCall: () => Promise<APIResponse<T>>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      if (!response.success) {
        throw new Error(response.message || 'Error en la operación');
      }
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, execute };
};

// Funciones de utilidad para formateo de datos
export const formatters = {
  date: (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES');
  },

  time: (date: string | Date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  dateTime: (date: string | Date) => {
    return new Date(date).toLocaleString('es-ES');
  },

  hours: (hours: number) => {
    return `${hours.toFixed(1)}h`;
  },

  currency: (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
};

// Estados y constantes
export const EMPLOYEE_STATUS = {
  'clocked-in': 'Trabajando',
  'on-break': 'En descanso',
  'clocked-out': 'Terminó',
  'not-working': 'Sin registrar'
} as const;

export const STATUS_COLORS = {
  'clocked-in': 'bg-green-100 text-green-800',
  'on-break': 'bg-yellow-100 text-yellow-800',
  'clocked-out': 'bg-gray-100 text-gray-800',
  'not-working': 'bg-gray-100 text-gray-600'
} as const;
