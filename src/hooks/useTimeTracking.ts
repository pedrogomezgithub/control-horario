import { useState, useEffect, useCallback } from 'react';
import type { Employee, TimeEntry, ClockAction, CompanySettings } from '@/types';

// Generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Get current date in YYYY-MM-DD format
const getCurrentDate = () => new Date().toISOString().split('T')[0];

// Sample data
const sampleEmployees: Employee[] = [
  {
    id: '1',
    name: 'Ana García',
    email: 'ana.garcia@empresa.com',
    department: 'Desarrollo',
    position: 'Desarrolladora Frontend',
    isActive: true,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@empresa.com',
    department: 'Diseño',
    position: 'Diseñador UX/UI',
    isActive: true,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    name: 'María López',
    email: 'maria.lopez@empresa.com',
    department: 'Marketing',
    position: 'Marketing Manager',
    isActive: true,
    createdAt: new Date('2024-01-10'),
  },
];

const defaultSettings: CompanySettings = {
  name: 'Mi Empresa',
  workingHoursPerDay: 8,
  workingDaysPerWeek: 5,
  standardWorkStart: '09:00',
  standardWorkEnd: '17:00',
  timezone: 'America/Mexico_City',
  overtimeRate: 1.5,
};

export const useTimeTracking = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedEmployees = localStorage.getItem('time-tracking-employees');
    const savedEntries = localStorage.getItem('time-tracking-entries');
    const savedSettings = localStorage.getItem('time-tracking-settings');

    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees));
    } else {
      setEmployees(sampleEmployees);
    }

    if (savedEntries) {
      const parsedEntries = JSON.parse(savedEntries);
      // Parse dates back to Date objects
      const entriesWithDates = parsedEntries.map((entry: any) => ({
        ...entry,
        clockIn: new Date(entry.clockIn),
        clockOut: entry.clockOut ? new Date(entry.clockOut) : undefined,
        breakStart: entry.breakStart ? new Date(entry.breakStart) : undefined,
        breakEnd: entry.breakEnd ? new Date(entry.breakEnd) : undefined,
      }));
      setTimeEntries(entriesWithDates);
    }

    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('time-tracking-employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('time-tracking-entries', JSON.stringify(timeEntries));
  }, [timeEntries]);

  useEffect(() => {
    localStorage.setItem('time-tracking-settings', JSON.stringify(settings));
  }, [settings]);

  // Calculate total hours for a time entry
  const calculateHours = useCallback((entry: TimeEntry): number => {
    if (!entry.clockOut) return 0;

    let totalMs = entry.clockOut.getTime() - entry.clockIn.getTime();

    // Subtract break time if any
    if (entry.breakStart && entry.breakEnd) {
      const breakMs = entry.breakEnd.getTime() - entry.breakStart.getTime();
      totalMs -= breakMs;
    }

    return Math.max(0, totalMs / (1000 * 60 * 60)); // Convert to hours
  }, []);

  // Clock action handler
  const handleClockAction = useCallback((employeeId: string, action: ClockAction) => {
    const now = new Date();
    const currentDate = getCurrentDate();

    setTimeEntries(prev => {
      // Find today's entry for this employee
      const todayEntry = prev.find(
        entry => entry.employeeId === employeeId && entry.date === currentDate
      );

      if (action === 'clock-in') {
        if (todayEntry && todayEntry.status !== 'clocked-out') {
          throw new Error('El empleado ya está trabajando');
        }

        const newEntry: TimeEntry = {
          id: generateId(),
          employeeId,
          clockIn: now,
          status: 'clocked-in',
          date: currentDate,
        };

        return [...prev, newEntry];
      }

      if (!todayEntry) {
        throw new Error('No se encontró registro de entrada para hoy');
      }

      const updatedEntries = prev.map(entry => {
        if (entry.id === todayEntry.id) {
          switch (action) {
            case 'clock-out':
              if (entry.status === 'clocked-out') {
                throw new Error('El empleado ya ha terminado su jornada');
              }
              const totalHours = calculateHours({
                ...entry,
                clockOut: now,
              });
              return {
                ...entry,
                clockOut: now,
                status: 'clocked-out' as const,
                totalHours,
              };

            case 'break-start':
              if (entry.status === 'on-break') {
                throw new Error('El empleado ya está en descanso');
              }
              if (entry.status === 'clocked-out') {
                throw new Error('El empleado ya ha terminado su jornada');
              }
              return {
                ...entry,
                breakStart: now,
                status: 'on-break' as const,
              };

            case 'break-end':
              if (entry.status !== 'on-break') {
                throw new Error('El empleado no está en descanso');
              }
              return {
                ...entry,
                breakEnd: now,
                status: 'clocked-in' as const,
              };

            default:
              return entry;
          }
        }
        return entry;
      });

      return updatedEntries;
    });
  }, [calculateHours]);

  // Add new employee
  const addEmployee = useCallback((employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: generateId(),
      createdAt: new Date(),
    };
    setEmployees(prev => [...prev, newEmployee]);
    return newEmployee;
  }, []);

  // Update employee
  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp));
  }, []);

  // Delete employee
  const deleteEmployee = useCallback((id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    // Also remove their time entries
    setTimeEntries(prev => prev.filter(entry => entry.employeeId !== id));
  }, []);

  // Get current status for an employee
  const getEmployeeStatus = useCallback((employeeId: string) => {
    const today = getCurrentDate();
    const todayEntry = timeEntries.find(
      entry => entry.employeeId === employeeId && entry.date === today
    );
    return todayEntry?.status || 'not-working';
  }, [timeEntries]);

  // Get today's entries
  const getTodayEntries = useCallback(() => {
    const today = getCurrentDate();
    return timeEntries.filter(entry => entry.date === today);
  }, [timeEntries]);

  // Get entries for date range
  const getEntriesForDateRange = useCallback((startDate: string, endDate: string) => {
    return timeEntries.filter(entry => entry.date >= startDate && entry.date <= endDate);
  }, [timeEntries]);

  return {
    employees,
    timeEntries,
    settings,
    handleClockAction,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeStatus,
    getTodayEntries,
    getEntriesForDateRange,
    setSettings,
  };
};
