import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, Calendar, TrendingUp, FileText, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReportsProps {
  employees: any[];
  timeEntries: any[];
  getEntriesForDateRange: (startDate: string, endDate: string) => any[];
}

export default function Reports({
  employees,
  timeEntries,
  getEntriesForDateRange
}: ReportsProps) {
  const getCurrentWeekData = () => {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));

    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    };
  };

  const weekData = getCurrentWeekData();
  const weekEntries = getEntriesForDateRange(weekData.start, weekData.end);

  const calculateStats = () => {
    const totalHours = weekEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
    const avgHours = totalHours / Math.max(weekEntries.length, 1);
    const presentDays = new Set(weekEntries.map(entry => entry.date)).size;

    return {
      totalHours: totalHours.toFixed(1),
      avgHours: avgHours.toFixed(1),
      presentDays,
      totalEmployees: employees.length
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h2>
          <p className="text-gray-600">Visualiza estadísticas y genera reportes de tiempo</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Filtrar Fechas
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Información del backend */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-medium text-purple-900 mb-2">Reportes MySQL Disponibles</h3>
            <p className="text-purple-700 text-sm mb-3">
              Genera reportes avanzados con datos de la base de datos MySQL
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
              <code className="bg-purple-100 px-2 py-1 rounded">GET /api/time/summary</code>
              <code className="bg-purple-100 px-2 py-1 rounded">GET /api/time/entries</code>
              <code className="bg-purple-100 px-2 py-1 rounded">GET /api/employees</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas de la semana */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Totales</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalHours}h</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Diario</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.avgHours}h</div>
            <p className="text-xs text-muted-foreground">Por día trabajado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Días Trabajados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.presentDays}</div>
            <p className="text-xs text-muted-foreground">De 7 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Total registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tipos de reportes disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Reporte Diario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Resumen de actividad diaria por empleado con horas trabajadas y descansos.
            </p>
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="text-blue-600">Disponible</Badge>
              <Button size="sm" variant="outline">
                Ver Reporte
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Reporte Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Análisis semanal con totales de horas, promedios y comparativas.
            </p>
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="text-green-600">Disponible</Badge>
              <Button size="sm" variant="outline">
                Ver Reporte
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Reporte Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Resumen mensual completo con gráficos y análisis de tendencias.
            </p>
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="text-purple-600">Disponible</Badge>
              <Button size="sm" variant="outline">
                Ver Reporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen de empleados */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen por Empleado (Semana Actual)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.map((employee) => {
              const employeeEntries = weekEntries.filter(entry => entry.employeeId === employee.id);
              const totalHours = employeeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
              const daysWorked = employeeEntries.length;

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

                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-blue-600">{totalHours.toFixed(1)}h</p>
                      <p className="text-gray-500">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-green-600">{daysWorked}</p>
                      <p className="text-gray-500">Días</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-purple-600">
                        {daysWorked > 0 ? (totalHours / daysWorked).toFixed(1) : '0.0'}h
                      </p>
                      <p className="text-gray-500">Promedio</p>
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
