import { useMemo } from 'react';
import { Clock, Users, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Employee, TimeEntry, CompanySettings } from '@/types';

interface DashboardProps {
  employees: Employee[];
  timeEntries: TimeEntry[];
  settings: CompanySettings;
  getTodayEntries: () => TimeEntry[];
  getEmployeeStatus: (employeeId: string) => string;
}

export default function Dashboard({
  employees,
  timeEntries,
  settings,
  getTodayEntries,
  getEmployeeStatus
}: DashboardProps) {
  const todayEntries = getTodayEntries();

  const stats = useMemo(() => {
    const activeEmployees = employees.filter(emp =>
      ['clocked-in', 'on-break'].includes(getEmployeeStatus(emp.id))
    );

    const totalHoursToday = todayEntries.reduce((total, entry) => {
      if (entry.totalHours) return total + entry.totalHours;
      if (entry.clockOut) {
        const hours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      // For ongoing work, calculate current hours
      const hours = (Date.now() - entry.clockIn.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    const onBreakCount = employees.filter(emp =>
      getEmployeeStatus(emp.id) === 'on-break'
    ).length;

    const presentToday = todayEntries.length;

    return {
      activeEmployees: activeEmployees.length,
      totalHours: totalHoursToday,
      onBreak: onBreakCount,
      presentToday,
    };
  }, [employees, todayEntries, getEmployeeStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clocked-in':
        return 'bg-green-100 text-green-800';
      case 'on-break':
        return 'bg-yellow-100 text-yellow-800';
      case 'clocked-out':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'clocked-in':
        return 'Trabajando';
      case 'on-break':
        return 'En descanso';
      case 'clocked-out':
        return 'Terminó';
      default:
        return 'Sin registrar';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Buen día! Dashboard de Control Horario
        </h2>
        <p className="text-gray-600">
          Resumen de la actividad laboral de hoy, {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">
              de {employees.length} empleados totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Trabajadas Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalHours.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              En el día actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Descanso</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.onBreak}</div>
            <p className="text-xs text-muted-foreground">
              Empleados actualmente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia Hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">
              Empleados registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Employees List */}
      <Card>
        <CardHeader>
          <CardTitle>Estado Actual de Empleados</CardTitle>
          <CardDescription>
            Vista en tiempo real del estado de todos los empleados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.map((employee) => {
              const status = getEmployeeStatus(employee.id);
              const todayEntry = todayEntries.find(entry => entry.employeeId === employee.id);

              return (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{employee.name}</p>
                      <p className="text-sm text-gray-500">{employee.department} • {employee.position}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {todayEntry && (
                      <div className="text-right text-sm">
                        <p className="text-gray-600">
                          Entrada: {todayEntry.clockIn.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {todayEntry.clockOut && (
                          <p className="text-gray-600">
                            Salida: {todayEntry.clockOut.toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    <Badge className={getStatusColor(status)}>
                      {getStatusText(status)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Activity Summary */}
      {todayEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Actividad del Día</CardTitle>
            <CardDescription>
              Últimos registros de entrada y salida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayEntries.slice(-5).reverse().map((entry) => {
                const employee = employees.find(emp => emp.id === entry.employeeId);
                if (!employee) return null;

                return (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{employee.name}</p>
                        <p className="text-xs text-gray-500">{employee.department}</p>
                      </div>
                    </div>

                    <div className="text-right text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">
                          {entry.clockIn.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {entry.clockOut && (
                          <>
                            <span className="text-gray-400">→</span>
                            <span className="text-gray-600">
                              {entry.clockOut.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </>
                        )}
                        {entry.totalHours && (
                          <Badge variant="outline" className="ml-2">
                            {entry.totalHours.toFixed(1)}h
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
