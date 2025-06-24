# 🚀 Deploy INMEDIATO en Render - Control Horario

## 📝 PASOS RÁPIDOS (15 minutos)

### 1️⃣ **Crear Cuenta en Render** (2 min)
1. Ve a **[render.com](https://render.com)**
2. Haz clic en **"Get Started"**
3. Registrate con GitHub (recomendado)

### 2️⃣ **Crear Base de Datos PostgreSQL** (3 min)
1. En el dashboard, click **"New"** → **"PostgreSQL"**
2. Configuración:
   - **Name**: `control-horario-db`
   - **Database Name**: `control_horario`
   - **Region**: Oregon (US West)
   - **Plan**: **Free** ✅
3. Click **"Create Database"**
4. **ESPERAR** hasta que aparezca "Available" ✅

### 3️⃣ **Subir Código a GitHub** (3 min)
```bash
# En tu terminal, desde control-horario/
git init
git add .
git commit -m "Sistema de control horario con PostgreSQL"

# Crear repo en GitHub y conectar
git remote add origin https://github.com/TU_USUARIO/control-horario.git
git push -u origin main
```

### 4️⃣ **Ejecutar Schema en Base de Datos** (2 min)
1. En Render, ve a tu base de datos creada
2. Click pestaña **"Shell"**
3. Copia y pega este comando:

```sql
-- Control Horario Database Schema - PostgreSQL Version
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE company_settings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'Mi Empresa',
    working_hours_per_day DECIMAL(3,1) NOT NULL DEFAULT 8.0,
    working_days_per_week INTEGER NOT NULL DEFAULT 5,
    standard_work_start TIME NOT NULL DEFAULT '09:00:00',
    standard_work_end TIME NOT NULL DEFAULT '17:00:00',
    timezone VARCHAR(100) NOT NULL DEFAULT 'America/Mexico_City',
    overtime_rate DECIMAL(3,2) NOT NULL DEFAULT 1.50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2) NULL,
    phone VARCHAR(20) NULL,
    address TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE time_entries (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP NULL,
    break_start TIMESTAMP NULL,
    break_end TIMESTAMP NULL,
    total_hours DECIMAL(4,2) NULL,
    total_break_minutes INTEGER NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'clocked-in'
        CHECK (status IN ('clocked-in', 'on-break', 'clocked-out')),
    date DATE NOT NULL,
    notes TEXT NULL,
    location VARCHAR(255) NULL,
    ip_address INET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, date)
);

-- Insertar datos de ejemplo
INSERT INTO company_settings (name) VALUES ('Mi Empresa');

INSERT INTO employees (employee_code, name, email, department, position, hire_date) VALUES
('EMP001', 'Ana García', 'ana.garcia@empresa.com', 'Desarrollo', 'Desarrolladora Frontend', '2024-01-15'),
('EMP002', 'Carlos Rodríguez', 'carlos.rodriguez@empresa.com', 'Diseño', 'Diseñador UX/UI', '2024-02-01'),
('EMP003', 'María López', 'maria.lopez@empresa.com', 'Marketing', 'Marketing Manager', '2024-01-10');
```

### 5️⃣ **Crear Web Service Backend** (5 min)
1. En Render dashboard, click **"New"** → **"Web Service"**
2. **Connect Repository**: Selecciona tu repo GitHub
3. Configuración:
   - **Name**: `control-horario-api`
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: **Free** ✅

4. **Environment Variables** (click "Add Environment Variable"):
   ```
   NODE_ENV = production
   DB_TYPE = postgresql
   JWT_SECRET = control_horario_secret_2024
   ALLOWED_ORIGINS = https://same-yx2maar5fj8-latest.netlify.app
   ```

5. **Add Database** (MUY IMPORTANTE):
   - Scroll down a "Environment Variables"
   - Click **"Add from Database"**
   - Selecciona `control-horario-db`
   - Esto agrega automáticamente `DATABASE_URL`

6. Click **"Create Web Service"**

## ⏱️ **ESPERAR DEPLOY** (5-10 min)
- Render construirá tu aplicación
- Verás logs en tiempo real
- Cuando aparezca "Your service is live" ✅ = LISTO

## 🎯 **PROBAR SISTEMA**

Una vez desplegado:

1. **Backend URL**: `https://control-horario-api-XXXX.onrender.com`
2. **Health Check**: Agrega `/health` al final de tu URL
3. **API Docs**: Agrega `/api/docs`
4. **Empleados**: Agrega `/api/employees`

## 🔧 **Actualizar Frontend** (1 min)

En tu archivo `src/config/api.ts`, cambia:

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production'
    ? 'https://TU-URL-BACKEND.onrender.com/api'  // ← Poner TU URL real
    : 'http://localhost:5000/api',
  // ...
};
```

## ✅ **VERIFICACIÓN FINAL**

URLs que deben funcionar:
- ✅ Frontend: https://same-yx2maar5fj8-latest.netlify.app
- ✅ Backend: https://TU-URL.onrender.com/health
- ✅ API: https://TU-URL.onrender.com/api/employees

---

## 🚨 **¿NECESITAS AYUDA?**

Si algo no funciona:
1. Revisa los **logs** en Render
2. Verifica que `DATABASE_URL` esté en Environment Variables
3. Confirma que el schema se ejecutó correctamente
4. El primer deploy puede tardar 2-3 minutos

**¡READY TO GO! 🎉**
