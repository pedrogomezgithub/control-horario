export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  clockIn: Date;
  clockOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalHours?: number;
  status: 'clocked-in' | 'on-break' | 'clocked-out';
  date: string; // YYYY-MM-DD format
  notes?: string;
}

export interface DailyReport {
  employeeId: string;
  employee: Employee;
  date: string;
  totalHours: number;
  entries: TimeEntry[];
  overtime: number;
  status: 'present' | 'absent' | 'partial';
}

export interface CompanySettings {
  name: string;
  workingHoursPerDay: number;
  workingDaysPerWeek: number;
  standardWorkStart: string; // HH:MM format
  standardWorkEnd: string; // HH:MM format
  timezone: string;
  overtimeRate: number;
}

export type ClockAction = 'clock-in' | 'clock-out' | 'break-start' | 'break-end';
