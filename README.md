# 🕒 Sistema de Control Horario

Un sistema completo de control horario para empresas, desarrollado con React, Express.js y MySQL. Permite gestionar empleados, registrar entrada/salida, controlar descansos y generar reportes de horas trabajadas.

## 📋 Características

### ✨ Funcionalidades Principales
- **Dashboard en tiempo real** con métricas del día
- **Gestión de empleados** (CRUD completo)
- **Control de tiempo** (entrada, salida, descansos)
- **Reportes** de horas trabajadas y estadísticas
- **Base de datos MySQL** robusta y escalable
- **API REST** completa y documentada
- **Interfaz moderna** con React y Tailwind CSS

### 🎯 Características Técnicas
- Base de datos MySQL con procedimientos almacenados
- Validación completa de datos
- Manejo de errores robusto
- Rate limiting y seguridad
- Paginación y filtros avanzados
- Auditoría completa de cambios
- Soporte para múltiples zonas horarias

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** con TypeScript
- **Vite** para desarrollo rápido
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes
- **Lucide React** para iconos

### Backend
- **Node.js** con Express.js
- **MySQL 8.0+** como base de datos
- **mysql2** para conexión a BD
- **express-validator** para validación
- **helmet** para seguridad
- **cors** para CORS
- **morgan** para logging

## 📦 Instalación y Configuración

### 1. Prerrequisitos

```bash
# Node.js 18+ y npm/bun
node --version  # v18.0.0+
bun --version   # 1.0.0+

# MySQL 8.0+
mysql --version # 8.0.0+
```

### 2. Configurar MySQL

#### Instalar MySQL (si no está instalado)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Windows:**
Descargar desde [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)

#### Crear Base de Datos
```bash
# Conectar a MySQL
mysql -u root -p

# Crear base de datos y usuario
CREATE DATABASE control_horario;
CREATE USER 'control_user'@'localhost' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON control_horario.* TO 'control_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Ejecutar el Schema
```bash
# Desde el directorio del proyecto
mysql -u control_user -p control_horario < database/schema.sql
```

### 3. Configurar Backend

```bash
# Navegar al directorio backend
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Editar .env con tu configuración
nano .env
```

**Configuración de .env:**
```env
# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=control_user
DB_PASSWORD=tu_password
DB_NAME=control_horario

# Configuración del servidor
PORT=5000
NODE_ENV=development

# Otros ajustes...
```

### 4. Configurar Frontend

```bash
# Desde el directorio raíz del proyecto
cd control-horario

# Instalar dependencias
bun install

# Configurar la URL de la API
# Editar src/config/api.ts si es necesario
```

### 5. Iniciar los Servicios

#### Iniciar Backend (Terminal 1)
```bash
cd backend
npm run dev
# El servidor estará en http://localhost:5000
```

#### Iniciar Frontend (Terminal 2)
```bash
cd control-horario
bun run dev
# La aplicación estará en http://localhost:5173
```

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

#### `employees` - Empleados
```sql
- id (INT, AUTO_INCREMENT, PK)
- employee_code (VARCHAR, UNIQUE)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- department (VARCHAR)
- position (VARCHAR)
- avatar_url (VARCHAR, OPTIONAL)
- is_active (BOOLEAN)
- hire_date (DATE)
- salary (DECIMAL, OPTIONAL)
- phone (VARCHAR, OPTIONAL)
- address (TEXT, OPTIONAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `time_entries` - Registros de Tiempo
```sql
- id (INT, AUTO_INCREMENT, PK)
- employee_id (INT, FK)
- clock_in (DATETIME)
- clock_out (DATETIME, OPTIONAL)
- break_start (DATETIME, OPTIONAL)
- break_end (DATETIME, OPTIONAL)
- total_hours (DECIMAL, OPTIONAL)
- total_break_minutes (INT)
- status (ENUM: 'clocked-in', 'on-break', 'clocked-out')
- date (DATE)
- notes (TEXT, OPTIONAL)
- location (VARCHAR, OPTIONAL)
- ip_address (VARCHAR, OPTIONAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `company_settings` - Configuración
```sql
- id (INT, AUTO_INCREMENT, PK)
- name (VARCHAR)
- working_hours_per_day (DECIMAL)
- working_days_per_week (INT)
- standard_work_start (TIME)
- standard_work_end (TIME)
- timezone (VARCHAR)
- overtime_rate (DECIMAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Vistas y Procedimientos

#### Vistas Principales
- `daily_hours_view` - Resumen diario de horas
- `weekly_summary_view` - Resumen semanal

#### Procedimientos Almacenados
- `ClockIn(employee_id, location, ip_address)` - Registrar entrada
- `ClockOut(employee_id, ip_address)` - Registrar salida
- `StartBreak(employee_id)` - Iniciar descanso
- `EndBreak(employee_id)` - Terminar descanso

## 🚀 API Endpoints

### Empleados (`/api/employees`)
```
GET    /                     - Listar empleados (con paginación)
GET    /:id                  - Obtener empleado por ID
POST   /                     - Crear nuevo empleado
PUT    /:id                  - Actualizar empleado
DELETE /:id                  - Eliminar empleado (soft delete)
GET    /departments/list     - Obtener departamentos únicos
GET    /:id/status          - Obtener estado actual del empleado
```

### Control de Tiempo (`/api/time`)
```
POST   /clock-in            - Registrar entrada
POST   /clock-out           - Registrar salida
POST   /break-start         - Iniciar descanso
POST   /break-end           - Terminar descanso
GET    /entries             - Obtener registros (con filtros)
GET    /today               - Registros del día actual
GET    /active              - Empleados actualmente trabajando
GET    /summary             - Resumen de horas por empleado
PUT    /entries/:id         - Actualizar registro de tiempo
```

### Utilidades
```
GET    /health              - Health check del sistema
GET    /api/docs            - Documentación de la API
```

## 📱 Uso del Sistema

### 1. Gestión de Empleados
- Agregar nuevos empleados con información completa
- Editar datos de empleados existentes
- Activar/desactivar empleados
- Ver departamentos y posiciones

### 2. Control de Tiempo
- **Entrada**: Registrar cuando el empleado llega
- **Salida**: Registrar cuando el empleado se va
- **Descanso**: Iniciar y terminar períodos de descanso
- **Correcciones**: Editar registros para correcciones

### 3. Dashboard y Reportes
- Ver empleados actualmente trabajando
- Estadísticas del día actual
- Horas totales trabajadas
- Empleados en descanso
- Resumen de asistencia

## 🔧 Configuración Avanzada

### Variables de Entorno Importantes

```env
# Base de datos
DB_HOST=localhost              # Host de MySQL
DB_PORT=3306                   # Puerto de MySQL
DB_USER=control_user           # Usuario de MySQL
DB_PASSWORD=tu_password        # Contraseña de MySQL
DB_NAME=control_horario        # Nombre de la base de datos

# Servidor
PORT=5000                      # Puerto del servidor backend
NODE_ENV=development           # Entorno (development/production)

# Seguridad
JWT_SECRET=tu_secret_key       # Clave secreta para JWT
RATE_LIMIT_MAX_REQUESTS=100    # Límite de requests por ventana
RATE_LIMIT_WINDOW_MS=900000    # Ventana de rate limiting (15 min)

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Zona horaria
DEFAULT_TIMEZONE=America/Mexico_City
```

### Configuración de Producción

1. **Base de datos**:
   - Usar un servidor MySQL dedicado
   - Configurar backups automáticos
   - Optimizar índices y consultas

2. **Servidor**:
   - Usar PM2 para gestión de procesos
   - Configurar proxy reverso (nginx)
   - Habilitar SSL/HTTPS

3. **Seguridad**:
   - Cambiar todas las claves secretas
   - Configurar firewall
   - Implementar autenticación JWT

## 🐛 Solución de Problemas

### Error de Conexión a MySQL
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar conectividad
mysql -u control_user -p -h localhost

# Verificar permisos
SHOW GRANTS FOR 'control_user'@'localhost';
```

### Puerto en Uso
```bash
# Verificar qué proceso usa el puerto
lsof -i :5000
lsof -i :5173

# Cambiar puerto en .env o package.json
```

### Problemas con Dependencias
```bash
# Limpiar cache e instalar de nuevo
rm -rf node_modules package-lock.json
npm install

# Para frontend
rm -rf node_modules bun.lockb
bun install
```

## 📚 Estructura del Proyecto

```
control-horario/
├── README.md
├── database/
│   └── schema.sql              # Esquema de la base de datos
├── backend/                    # Servidor Express.js
│   ├── package.json
│   ├── server.js              # Archivo principal del servidor
│   ├── .env                   # Variables de entorno
│   ├── config/
│   │   └── database.js        # Configuración de MySQL
│   └── routes/
│       ├── employees.js       # Rutas de empleados
│       └── timeTracking.js    # Rutas de control de tiempo
├── src/                       # Frontend React
│   ├── components/
│   │   ├── ui/               # Componentes shadcn/ui
│   │   ├── Dashboard.tsx     # Dashboard principal
│   │   ├── EmployeeManagement.tsx
│   │   ├── TimeTracking.tsx
│   │   └── Reports.tsx
│   ├── hooks/
│   │   └── useTimeTracking.ts # Hook de gestión de estado
│   ├── types/
│   │   └── index.ts          # Tipos de TypeScript
│   └── App.tsx               # Componente principal
├── .same/
│   └── todos.md              # Lista de tareas
└── package.json
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para reportar bugs o solicitar nuevas funcionalidades:
- Abrir un [Issue](https://github.com/tu-repo/control-horario/issues)
- Enviar email a: soporte@tuempresa.com

## 🎯 Roadmap

- [ ] Autenticación JWT completa
- [ ] Reportes avanzados con gráficos
- [ ] Exportación a PDF/Excel
- [ ] Aplicación móvil
- [ ] Integración con sistemas de RH
- [ ] Reconocimiento facial para clock-in
- [ ] Notificaciones push
- [ ] API webhooks
