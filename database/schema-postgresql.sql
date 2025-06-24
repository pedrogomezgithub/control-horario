-- Control Horario Database Schema - PostgreSQL Version
-- Database: control_horario

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de configuración de la empresa
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

-- Tabla de empleados
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

-- Índices para empleados
CREATE INDEX idx_employee_code ON employees(employee_code);
CREATE INDEX idx_email ON employees(email);
CREATE INDEX idx_department ON employees(department);
CREATE INDEX idx_is_active ON employees(is_active);

-- Tabla de registros de tiempo
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

-- Índices para time_entries
CREATE INDEX idx_employee_date ON time_entries(employee_id, date);
CREATE INDEX idx_date ON time_entries(date);
CREATE INDEX idx_status ON time_entries(status);
CREATE INDEX idx_clock_in ON time_entries(clock_in);

-- Tabla de horarios programados
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, day_of_week)
);

-- Índices para schedules
CREATE INDEX idx_employee_day ON schedules(employee_id, day_of_week);

-- Tabla de días festivos/no laborables
CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL UNIQUE,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para holidays
CREATE INDEX idx_holiday_date ON holidays(date);

-- Tabla de permisos/ausencias
CREATE TABLE absences (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('vacation', 'sick', 'personal', 'maternity', 'paternity', 'other')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    reason TEXT NULL,
    approved_by INTEGER NULL,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- Índices para absences
CREATE INDEX idx_employee_dates ON absences(employee_id, start_date, end_date);
CREATE INDEX idx_absence_status ON absences(status);
CREATE INDEX idx_absence_type ON absences(type);

-- Tabla de reportes generados (cache)
CREATE TABLE reports_cache (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL,
    data JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Índice para reports_cache
CREATE INDEX idx_type_expires ON reports_cache(report_type, expires_at);

-- Tabla de auditoría
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB NULL,
    new_values JSONB NULL,
    changed_by INTEGER NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (changed_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- Índices para audit_log
CREATE INDEX idx_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created_at ON audit_log(created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
    BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_absences_updated_at
    BEFORE UPDATE ON absences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuración inicial de la empresa
INSERT INTO company_settings (name, working_hours_per_day, working_days_per_week, standard_work_start, standard_work_end, timezone, overtime_rate)
VALUES ('Mi Empresa', 8.0, 5, '09:00:00', '17:00:00', 'America/Mexico_City', 1.50);

-- Insertar empleados de ejemplo
INSERT INTO employees (employee_code, name, email, department, position, hire_date) VALUES
('EMP001', 'Ana García', 'ana.garcia@empresa.com', 'Desarrollo', 'Desarrolladora Frontend', '2024-01-15'),
('EMP002', 'Carlos Rodríguez', 'carlos.rodriguez@empresa.com', 'Diseño', 'Diseñador UX/UI', '2024-02-01'),
('EMP003', 'María López', 'maria.lopez@empresa.com', 'Marketing', 'Marketing Manager', '2024-01-10'),
('EMP004', 'Juan Pérez', 'juan.perez@empresa.com', 'Desarrollo', 'Desarrollador Backend', '2024-03-01'),
('EMP005', 'Laura Martínez', 'laura.martinez@empresa.com', 'Recursos Humanos', 'HR Specialist', '2024-02-15');

-- Insertar algunos días festivos de ejemplo
INSERT INTO holidays (name, date, is_recurring, description) VALUES
('Año Nuevo', '2024-01-01', TRUE, 'Celebración de Año Nuevo'),
('Día del Trabajo', '2024-05-01', TRUE, 'Día Internacional del Trabajo'),
('Independencia de México', '2024-09-16', TRUE, 'Día de la Independencia'),
('Navidad', '2024-12-25', TRUE, 'Celebración de Navidad');

-- Crear vistas útiles para reportes

-- Vista de horas trabajadas por empleado y día
CREATE VIEW daily_hours_view AS
SELECT
    e.id as employee_id,
    e.name as employee_name,
    e.employee_code,
    e.department,
    te.date,
    te.clock_in,
    te.clock_out,
    te.total_hours,
    te.total_break_minutes,
    te.status,
    CASE
        WHEN te.total_hours IS NULL AND te.clock_out IS NULL THEN
            ROUND(EXTRACT(EPOCH FROM (NOW() - te.clock_in)) / 3600.0, 2)
        ELSE te.total_hours
    END as current_hours,
    CASE
        WHEN te.total_hours > cs.working_hours_per_day THEN
            te.total_hours - cs.working_hours_per_day
        ELSE 0
    END as overtime_hours
FROM employees e
LEFT JOIN time_entries te ON e.id = te.employee_id
CROSS JOIN company_settings cs
WHERE e.is_active = TRUE;

-- Vista resumen semanal
CREATE VIEW weekly_summary_view AS
SELECT
    e.id as employee_id,
    e.name as employee_name,
    e.department,
    EXTRACT(YEAR FROM te.date) as year,
    EXTRACT(WEEK FROM te.date) as week,
    COUNT(te.id) as days_worked,
    SUM(te.total_hours) as total_hours,
    SUM(CASE WHEN te.total_hours > cs.working_hours_per_day
         THEN te.total_hours - cs.working_hours_per_day
         ELSE 0 END) as total_overtime,
    AVG(te.total_hours) as avg_daily_hours
FROM employees e
LEFT JOIN time_entries te ON e.id = te.employee_id
CROSS JOIN company_settings cs
WHERE e.is_active = TRUE AND te.total_hours IS NOT NULL
GROUP BY e.id, e.name, e.department, EXTRACT(YEAR FROM te.date), EXTRACT(WEEK FROM te.date);

-- Funciones para operaciones comunes (equivalentes a stored procedures)

-- Función para registrar entrada
CREATE OR REPLACE FUNCTION clock_in(
    p_employee_id INTEGER,
    p_location VARCHAR(255) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_existing_entry INTEGER;
    v_new_entry_id INTEGER;
BEGIN
    -- Verificar si ya hay una entrada para hoy
    SELECT COUNT(*) INTO v_existing_entry
    FROM time_entries
    WHERE employee_id = p_employee_id AND date = v_today;

    IF v_existing_entry > 0 THEN
        RAISE EXCEPTION 'Employee already has an entry for today';
    END IF;

    INSERT INTO time_entries (employee_id, clock_in, date, status, location, ip_address)
    VALUES (p_employee_id, NOW(), v_today, 'clocked-in', p_location, p_ip_address)
    RETURNING id INTO v_new_entry_id;

    RETURN v_new_entry_id;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar salida
CREATE OR REPLACE FUNCTION clock_out(
    p_employee_id INTEGER,
    p_ip_address INET DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_entry_id INTEGER;
    v_clock_in TIMESTAMP;
    v_break_minutes INTEGER := 0;
    v_total_hours DECIMAL(4,2);
BEGIN
    -- Obtener la entrada de hoy
    SELECT id, clock_in, COALESCE(total_break_minutes, 0)
    INTO v_entry_id, v_clock_in, v_break_minutes
    FROM time_entries
    WHERE employee_id = p_employee_id AND date = v_today AND status != 'clocked-out';

    IF v_entry_id IS NULL THEN
        RAISE EXCEPTION 'No active entry found for today';
    END IF;

    -- Calcular horas totales
    v_total_hours := ROUND((EXTRACT(EPOCH FROM (NOW() - v_clock_in)) - (v_break_minutes * 60)) / 3600.0, 2);

    UPDATE time_entries
    SET clock_out = NOW(),
        status = 'clocked-out',
        total_hours = v_total_hours,
        ip_address = p_ip_address
    WHERE id = v_entry_id;
END;
$$ LANGUAGE plpgsql;

-- Función para iniciar descanso
CREATE OR REPLACE FUNCTION start_break(p_employee_id INTEGER) RETURNS VOID AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_updated_rows INTEGER;
BEGIN
    UPDATE time_entries
    SET break_start = NOW(), status = 'on-break'
    WHERE employee_id = p_employee_id AND date = v_today AND status = 'clocked-in';

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

    IF v_updated_rows = 0 THEN
        RAISE EXCEPTION 'No active work session found';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para terminar descanso
CREATE OR REPLACE FUNCTION end_break(p_employee_id INTEGER) RETURNS VOID AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_updated_rows INTEGER;
BEGIN
    UPDATE time_entries
    SET break_end = NOW(),
        status = 'clocked-in',
        total_break_minutes = COALESCE(total_break_minutes, 0) +
                             EXTRACT(EPOCH FROM (NOW() - break_start)) / 60
    WHERE employee_id = p_employee_id AND date = v_today AND status = 'on-break';

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

    IF v_updated_rows = 0 THEN
        RAISE EXCEPTION 'No active break found';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Crear índices adicionales para optimización
CREATE INDEX idx_time_entries_datetime ON time_entries(clock_in, clock_out);
CREATE INDEX idx_employees_department_active ON employees(department, is_active);
CREATE INDEX idx_absences_dates_status ON absences(start_date, end_date, status);
