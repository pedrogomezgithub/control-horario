const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar configuración de base de datos
const { createPool, checkDatabaseHealth, initializeDatabase, closePool } = require('./config/database');

// Importar rutas
const employeesRoutes = require('./routes/employees');
const timeTrackingRoutes = require('./routes/timeTracking');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de seguridad
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Configuración de CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // límite de 100 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, intente de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Middleware general
app.use(compression()); // Compresión gzip
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parser JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parser URL-encoded

// Middleware para manejar errores de JSON
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido en el cuerpo de la solicitud'
    });
  }
  next();
});

// Middleware para logging de requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Ruta de health check
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();

    const healthStatus = {
      status: dbHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'control-horario-api',
      version: '1.0.0',
      database: dbHealth ? 'connected' : 'disconnected',
      uptime: process.uptime()
    };

    res.status(dbHealth ? 200 : 503).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'control-horario-api',
      error: error.message
    });
  }
});

// Ruta raíz con información de la API
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Control Horario',
    version: '1.0.0',
    endpoints: {
      employees: '/api/employees',
      timeTracking: '/api/time',
      health: '/health',
      docs: '/api/docs'
    },
    documentation: 'https://github.com/tu-repo/control-horario'
  });
});

// Configurar rutas de la API
app.use('/api/employees', employeesRoutes);
app.use('/api/time', timeTrackingRoutes);

// Ruta para documentación básica de la API
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Control Horario API Documentation',
    version: '1.0.0',
    endpoints: {
      employees: {
        'GET /api/employees': 'Obtener lista de empleados',
        'GET /api/employees/:id': 'Obtener empleado por ID',
        'POST /api/employees': 'Crear nuevo empleado',
        'PUT /api/employees/:id': 'Actualizar empleado',
        'DELETE /api/employees/:id': 'Eliminar empleado',
        'GET /api/employees/departments/list': 'Obtener departamentos',
        'GET /api/employees/:id/status': 'Obtener estado del empleado'
      },
      timeTracking: {
        'POST /api/time/clock-in': 'Registrar entrada',
        'POST /api/time/clock-out': 'Registrar salida',
        'POST /api/time/break-start': 'Iniciar descanso',
        'POST /api/time/break-end': 'Terminar descanso',
        'GET /api/time/entries': 'Obtener registros de tiempo',
        'GET /api/time/today': 'Obtener registros de hoy',
        'GET /api/time/active': 'Obtener empleados activos',
        'GET /api/time/summary': 'Resumen de tiempo por empleado',
        'PUT /api/time/entries/:id': 'Actualizar registro de tiempo'
      }
    },
    authentication: 'Bearer token (pendiente implementación)',
    rateLimit: `${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests por ${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000} minutos`
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Middleware de manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);

  // Error de validación
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      details: error.message
    });
  }

  // Error de base de datos
  if (error.code && error.code.startsWith('ER_')) {
    return res.status(500).json({
      success: false,
      message: 'Error de base de datos',
      code: error.code
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Función para inicializar el servidor
const startServer = async () => {
  try {
    // Crear pool de conexiones a la base de datos
    createPool();

    // Esperar un momento para que se establezca la conexión
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar conexión a la base de datos
    const dbHealth = await checkDatabaseHealth();
    if (!dbHealth) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }

    // Inicializar base de datos con datos de ejemplo si es necesario
    await initializeDatabase();

    // Iniciar servidor
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🚀 Servidor iniciado exitosamente');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api/docs`);
      console.log('\n📋 Endpoints disponibles:');
      console.log(`   GET  /api/employees - Lista de empleados`);
      console.log(`   POST /api/time/clock-in - Registrar entrada`);
      console.log(`   POST /api/time/clock-out - Registrar salida`);
      console.log(`   GET  /api/time/today - Registros de hoy`);
      console.log('\n✅ Servidor listo para recibir solicitudes\n');
    });

    // Manejo de cierre graceful
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  Recibida señal ${signal}. Cerrando servidor...`);

      server.close(async () => {
        console.log('🔒 Servidor HTTP cerrado');

        try {
          await closePool();
          console.log('✅ Cierre graceful completado');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error durante el cierre:', error);
          process.exit(1);
        }
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⏰ Forzando cierre del servidor...');
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales de cierre
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejar errores no capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Excepción no capturada:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Iniciar servidor solo si este archivo es ejecutado directamente
if (require.main === module) {
  startServer();
}

module.exports = app;
