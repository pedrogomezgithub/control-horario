-- Control Horario Database Schema
-- Database: control_horario

CREATE DATABASE IF NOT EXISTS control_horario;
USE control_horario;

-- Tabla de configuración de la empresa
CREATE TABLE company_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL DEFAULT 'Mi Empresa',
    working_hours_per_day DECIMAL(3,1) NOT NULL DEFAULT 8.0,
    working_days_per_week INT NOT NULL DEFAULT 5,
    standard_work_start TIME NOT NULL DEFAULT '09:00:00',
    standard_work_end TIME NOT NULL DEFAULT '17:00:00',
    timezone VARCHAR(100) NOT NULL DEFAULT 'America/Mexico_City',
    overtime_rate DECIMAL(3,2) NOT NULL DEFAULT 1.50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de empleados
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_employee_code (employee_code),
    INDEX idx_email (email),
    INDEX idx_department (department),
    INDEX idx_is_active (is_active)
);

-- Tabla de registros de tiempo
CREATE TABLE time_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    clock_in DATETIME NOT NULL,
    clock_out DATETIME NULL,
    break_start DATETIME NULL,
    break_end DATETIME NULL,
    total_hours DECIMAL(4,2) NULL,
    total_break_minutes INT NULL DEFAULT 0,
    status ENUM('clocked-in', 'on-break', 'clocked-out') NOT NULL DEFAULT 'clocked-in',
    date DATE NOT NULL,
    notes TEXT NULL,
    location VARCHAR(255) NULL, -- Para registro de ubicación si es necesario
    ip_address VARCHAR(45) NULL, -- Para auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee_date (employee_id, date),
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_clock_in (clock_in),
    UNIQUE KEY unique_employee_date (employee_id, date)
);

-- Tabla de horarios programados (opcional para futuras mejoras)
CREATE TABLE schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    day_of_week TINYINT NOT NULL, -- 0=Domingo, 1=Lunes, ..., 6=Sábado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee_day (employee_id, day_of_week),
    UNIQUE KEY unique_employee_day (employee_id, day_of_week)
);

-- Tabla de días festivos/no laborables
CREATE TABLE holidays (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE, -- Si se repite cada año
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_date (date),
    UNIQUE KEY unique_date (date)
);

-- Tabla de permisos/ausencias
CREATE TABLE absences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type ENUM('vacation', 'sick', 'personal', 'maternity', 'paternity', 'other') NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    reason TEXT NULL,
    approved_by INT NULL, -- ID del empleado que aprobó
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_employee_dates (employee_id, start_date, end_date),
    INDEX idx_status (status),
    INDEX idx_type (type)
);

-- Tabla de reportes generados (cache de reportes para optimización)
CREATE TABLE reports_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_type VARCHAR(50) NOT NULL,
    parameters JSON NOT NULL, -- Parámetros usados para generar el reporte
    data JSON NOT NULL, -- Datos del reporte
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,

    INDEX idx_type_expires (report_type, expires_at)
);

-- Tabla de auditoría para cambios importantes
CREATE TABLE audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    changed_by INT NULL, -- ID del usuario que hizo el cambio
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (changed_by) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

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
            ROUND(TIMESTAMPDIFF(MINUTE, te.clock_in, NOW()) / 60.0, 2)
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
    YEARWEEK(te.date, 1) as year_week,
    COUNT(te.id) as days_worked,
    SUM(te.total_hours) as total_hours,
    SUM(CASE WHEN te.total_hours > cs.working_hours_per_day THEN te.total_hours - cs.working_hours_per_day ELSE 0 END) as total_overtime,
    AVG(te.total_hours) as avg_daily_hours
FROM employees e
LEFT JOIN time_entries te ON e.id = te.employee_id
CROSS JOIN company_settings cs
WHERE e.is_active = TRUE AND te.total_hours IS NOT NULL
GROUP BY e.id, YEARWEEK(te.date, 1);

-- Procedimientos almacenados para operaciones comunes

DELIMITER //

-- Procedimiento para registrar entrada
CREATE PROCEDURE ClockIn(
    IN p_employee_id INT,
    IN p_location VARCHAR(255),
    IN p_ip_address VARCHAR(45)
)
BEGIN
    DECLARE v_today DATE DEFAULT CURDATE();
    DECLARE v_existing_entry INT DEFAULT 0;

    -- Verificar si ya hay una entrada para hoy
    SELECT COUNT(*) INTO v_existing_entry
    FROM time_entries
    WHERE employee_id = p_employee_id AND date = v_today;

    IF v_existing_entry > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Employee already has an entry for today';
    ELSE
        INSERT INTO time_entries (employee_id, clock_in, date, status, location, ip_address)
        VALUES (p_employee_id, NOW(), v_today, 'clocked-in', p_location, p_ip_address);
    END IF;
END //

-- Procedimiento para registrar salida
CREATE PROCEDURE ClockOut(
    IN p_employee_id INT,
    IN p_ip_address VARCHAR(45)
)
BEGIN
    DECLARE v_today DATE DEFAULT CURDATE();
    DECLARE v_entry_id INT;
    DECLARE v_clock_in DATETIME;
    DECLARE v_break_minutes INT DEFAULT 0;
    DECLARE v_total_hours DECIMAL(4,2);

    -- Obtener la entrada de hoy
    SELECT id, clock_in, COALESCE(total_break_minutes, 0)
    INTO v_entry_id, v_clock_in, v_break_minutes
    FROM time_entries
    WHERE employee_id = p_employee_id AND date = v_today AND status != 'clocked-out';

    IF v_entry_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No active entry found for today';
    ELSE
        -- Calcular horas totales
        SET v_total_hours = ROUND((TIMESTAMPDIFF(MINUTE, v_clock_in, NOW()) - v_break_minutes) / 60.0, 2);

        UPDATE time_entries
        SET clock_out = NOW(),
            status = 'clocked-out',
            total_hours = v_total_hours,
            ip_address = p_ip_address
        WHERE id = v_entry_id;
    END IF;
END //

-- Procedimiento para iniciar descanso
CREATE PROCEDURE StartBreak(
    IN p_employee_id INT
)
BEGIN
    DECLARE v_today DATE DEFAULT CURDATE();

    UPDATE time_entries
    SET break_start = NOW(), status = 'on-break'
    WHERE employee_id = p_employee_id AND date = v_today AND status = 'clocked-in';

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No active work session found';
    END IF;
END //

-- Procedimiento para terminar descanso
CREATE PROCEDURE EndBreak(
    IN p_employee_id INT
)
BEGIN
    DECLARE v_today DATE DEFAULT CURDATE();
    DECLARE v_break_minutes INT;

    UPDATE time_entries
    SET break_end = NOW(),
        status = 'clocked-in',
        total_break_minutes = COALESCE(total_break_minutes, 0) + TIMESTAMPDIFF(MINUTE, break_start, NOW())
    WHERE employee_id = p_employee_id AND date = v_today AND status = 'on-break';

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No active break found';
    END IF;
END //

DELIMITER ;

-- Crear índices adicionales para optimización
CREATE INDEX idx_time_entries_datetime ON time_entries(clock_in, clock_out);
CREATE INDEX idx_employees_department_active ON employees(department, is_active);
CREATE INDEX idx_absences_dates ON absences(start_date, end_date, status);
