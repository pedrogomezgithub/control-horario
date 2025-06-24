import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Database,
  Server,
  Globe,
  Code,
  CheckCircle,
  ExternalLink,
  Cloud,
  Settings
} from 'lucide-react';

export default function DeployInfo() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🚀 Estado del Deploy</h2>
        <p className="text-gray-600">
          Información sobre el despliegue y la infraestructura del sistema
        </p>
      </div>

      {/* Estado actual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Frontend Desplegado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Plataforma:</span>
                <Badge className="bg-green-100 text-green-800">Netlify</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Estado:</span>
                <Badge className="bg-green-100 text-green-800">✅ Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Tipo:</span>
                <Badge className="bg-green-100 text-green-800">Sitio Estático</Badge>
              </div>
              <Button
                size="sm"
                className="w-full mt-3 bg-green-600 hover:bg-green-700"
                onClick={() => window.open('https://netlify.com', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver en Netlify
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
              <Database className="h-5 w-5" />
              Base de Datos MySQL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Recomendado:</span>
                <Badge className="bg-blue-100 text-blue-800">Railway / Render</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Estado:</span>
                <Badge className="bg-yellow-100 text-yellow-800">🔧 Por configurar</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Esquema:</span>
                <Badge className="bg-blue-100 text-blue-800">✅ Listo</Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-3"
                onClick={() => window.open('https://railway.app', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Desplegar en Railway
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opciones de hosting para la base de datos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            🗄️ Opciones de Hosting para Base de Datos MySQL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Railway */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 bg-purple-600 rounded flex items-center justify-center">
                    <Server className="h-4 w-4 text-white" />
                  </div>
                  Railway
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>MySQL integrado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Deploy automático</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Plan gratuito</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Fácil configuración</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
                  onClick={() => window.open('https://railway.app', '_blank')}
                >
                  Usar Railway
                </Button>
              </CardContent>
            </Card>

            {/* Render */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 bg-green-600 rounded flex items-center justify-center">
                    <Globe className="h-4 w-4 text-white" />
                  </div>
                  Render
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>PostgreSQL/MySQL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>SSL automático</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Plan gratuito</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Muy confiable</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full mt-3 bg-green-600 hover:bg-green-700"
                  onClick={() => window.open('https://render.com', '_blank')}
                >
                  Usar Render
                </Button>
              </CardContent>
            </Card>

            {/* PlanetScale */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 bg-orange-600 rounded flex items-center justify-center">
                    <Database className="h-4 w-4 text-white" />
                  </div>
                  PlanetScale
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>MySQL serverless</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Escalamiento automático</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Plan gratuito</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Alto rendimiento</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full mt-3 bg-orange-600 hover:bg-orange-700"
                  onClick={() => window.open('https://planetscale.com', '_blank')}
                >
                  Usar PlanetScale
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Arquitectura del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            📐 Arquitectura del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
                <Globe className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-medium text-green-800">Frontend React</h3>
                <p className="text-sm text-green-600 mt-1">Desplegado en Netlify</p>
                <Badge className="mt-2 bg-green-100 text-green-800">✅ ACTIVO</Badge>
              </div>

              <div className="p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                <Server className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium text-blue-800">API Express.js</h3>
                <p className="text-sm text-blue-600 mt-1">Backend con Node.js</p>
                <Badge className="mt-2 bg-yellow-100 text-yellow-800">🔧 POR DESPLEGAR</Badge>
              </div>

              <div className="p-4 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50">
                <Database className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-medium text-purple-800">MySQL Database</h3>
                <p className="text-sm text-purple-600 mt-1">Esquema completo</p>
                <Badge className="mt-2 bg-yellow-100 text-yellow-800">🔧 POR DESPLEGAR</Badge>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Code className="h-4 w-4" />
                Código Disponible
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>✅ <strong>Frontend completo</strong> - React + TypeScript + Tailwind</p>
                <p>✅ <strong>Backend API</strong> - Express.js con validación completa</p>
                <p>✅ <strong>Esquema MySQL</strong> - Tablas, vistas y procedimientos</p>
                <p>✅ <strong>Documentación</strong> - README completo con instrucciones</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instrucciones de deploy */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">🚀 Siguientes Pasos para Deploy Completo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-blue-800">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium">Desplegar Base de Datos</p>
                <p className="text-sm text-blue-600">Usar Railway, Render o PlanetScale para la base MySQL</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium">Desplegar Backend API</p>
                <p className="text-sm text-blue-600">Subir el servidor Express.js al mismo servicio</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium">Conectar Frontend</p>
                <p className="text-sm text-blue-600">Actualizar la URL de la API en el frontend</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
