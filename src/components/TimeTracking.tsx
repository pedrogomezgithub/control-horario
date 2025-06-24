import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Coffee, LogIn, LogOut, Play, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { ClockAction } from '@/types';

interface TimeTrackingProps {
  employees: any[];
  handleClockAction: (employeeId: string, action: ClockAction) => void;
  getEmployeeStatus: (employeeId: string) => string;
}

export default function TimeTracking({
  employees,
  handleClockAction,
  getEmployeeStatus
}: TimeTrackingProps) {
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

  const handleAction = (employeeId: string, action: ClockAction) => {
    try {
      handleClockAction(employeeId, action);
    } catch (error) {
      console.error('Error en acción:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Control de Tiempo</h2>
        <p className="text-gray-600">Registra entrada, salida y descansos de empleados</p>
      </div>

      {/* Información del backend */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-medium text-blue-900 mb-2">Backend MySQL Disponible</h3>
            <p className="text-blue-700 text-sm mb-3">
              El sistema de control horario está conectado a la base de datos MySQL
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
              <code className="bg-blue-100 px-2 py-1 rounded">POST /api/time/clock-in</code>
              <code className="bg-blue-100 px-2 py-1 rounded">POST /api/time/clock-out</code>
              <code className="bg-blue-100 px-2 py-1 rounded">GET /api/time/today</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acciones Rápidas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button size="sm" className="w-full justify-start" variant="outline">
                <LogIn className="h-4 w-4 mr-2" />
                Entrada
              </Button>
              <Button size="sm" className="w-full justify-start" variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Salida
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descansos</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button size="sm" className="w-full justify-start" variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </Button>
              <Button size="sm" className="w-full justify-start" variant="outline">
                <Square className="h-4 w-4 mr-2" />
                Terminar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trabajando Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {employees.filter(emp => getEmployeeStatus(emp.id) === 'clocked-in').length}
            </div>
            <p className="text-xs text-muted-foreground">Empleados activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Descanso</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {employees.filter(emp => getEmployeeStatus(emp.id) === 'on-break').length}
            </div>
            <p className="text-xs text-muted-foreground">En pausa</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de empleados para control */}
      <Card>
        <CardHeader>
          <CardTitle>Control Individual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.map((employee) => {
              const status = getEmployeeStatus(employee.id);

              return (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {employee.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-gray-500">{employee.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(status)}>
                      {getStatusText(status)}
                    </Badge>

                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(employee.id, 'clock-in')}
                        disabled={status === 'clocked-in' || status === 'on-break'}
                      >
                        <LogIn className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(employee.id, 'clock-out')}
                        disabled={status === 'clocked-out' || status === 'not-working'}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(employee.id, status === 'on-break' ? 'break-end' : 'break-start')}
                        disabled={status === 'clocked-out' || status === 'not-working'}
                      >
                        {status === 'on-break' ? <Square className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
