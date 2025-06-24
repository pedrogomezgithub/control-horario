import { useState } from 'react';
import { Clock, Users, BarChart3, Settings, Building2, Cloud } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import Dashboard from '@/components/Dashboard';
import EmployeeManagement from '@/components/EmployeeManagement';
import TimeTracking from '@/components/TimeTracking';
import Reports from '@/components/Reports';
import DeployInfo from '@/components/DeployInfo';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const timeTrackingContext = useTimeTracking();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{timeTrackingContext.settings.name}</h1>
                <p className="text-sm text-gray-500">Sistema de Control Horario</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="time-tracking" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Control de Tiempo
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Empleados
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Reportes
            </TabsTrigger>
            <TabsTrigger value="deploy" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Deploy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard {...timeTrackingContext} />
          </TabsContent>

          <TabsContent value="time-tracking" className="space-y-6">
            <TimeTracking {...timeTrackingContext} />
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <EmployeeManagement {...timeTrackingContext} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Reports {...timeTrackingContext} />
          </TabsContent>

          <TabsContent value="deploy" className="space-y-6">
            <DeployInfo />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
