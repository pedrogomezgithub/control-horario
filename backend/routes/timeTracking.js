const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { executeQuery, executeStoredProcedure, getCurrentDate, getCurrentDateTime } = require('../config/database');

const router = express.Router();

// Middleware para validar errores
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// Obtener IP del cliente
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '127.0.0.1';
};

// POST /api/time/clock-in - Registrar entrada
router.post('/clock-in', [
  body('employee_id').isInt({ min: 1 }).withMessage('ID de empleado requerido'),
  body('location').optional().isString().withMessage('Ubicación debe ser texto'),
  body('notes').optional().isString().withMessage('Notas deben ser texto')
], validateRequest, async (req, res) => {
  try {
    const { employee_id, location, notes } = req.body;
    const ip_address = getClientIP(req);

    // Verificar que el empleado existe y está activo
    const employee = await executeQuery(
      'SELECT id, name, is_active FROM employees WHERE id = ? AND is_active = TRUE',
      [employee_id]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado o inactivo'
      });
    }

    // Verificar si ya tiene entrada para hoy
    const today = getCurrentDate();
    const existingEntry = await executeQuery(
      'SELECT id, status FROM time_entries WHERE employee_id = ? AND date = ?',
      [employee_id, today]
    );

    if (existingEntry.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El empleado ya tiene un registro para hoy'
      });
    }

    // Usar procedimiento almacenado para registrar entrada
    try {
      await executeStoredProcedure('ClockIn', [employee_id, location || null, ip_address]);

      // Actualizar notas si se proporcionaron
      if (notes) {
        await executeQuery(
          'UPDATE time_entries SET notes = ? WHERE employee_id = ? AND date = ?',
          [notes, employee_id, today]
        );
      }

      // Obtener el registro creado
      const [newEntry] = await executeQuery(
        'SELECT * FROM time_entries WHERE employee_id = ? AND date = ?',
        [employee_id, today]
      );

      res.status(201).json({
        success: true,
        message: `Entrada registrada para ${employee[0].name}`,
        data: newEntry
      });

    } catch (dbError) {
      if (dbError.sqlMessage && dbError.sqlMessage.includes('already has an entry')) {
        return res.status(409).json({
          success: false,
          message: 'El empleado ya tiene un registro para hoy'
        });
      }
      throw dbError;
    }

  } catch (error) {
    console.error('Error registrando entrada:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/time/clock-out - Registrar salida
router.post('/clock-out', [
  body('employee_id').isInt({ min: 1 }).withMessage('ID de empleado requerido'),
  body('notes').optional().isString().withMessage('Notas deben ser texto')
], validateRequest, async (req, res) => {
  try {
    const { employee_id, notes } = req.body;
    const ip_address = getClientIP(req);

    // Verificar que el empleado existe
    const employee = await executeQuery(
      'SELECT id, name FROM employees WHERE id = ?',
      [employee_id]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    try {
      // Usar procedimiento almacenado para registrar salida
      await executeStoredProcedure('ClockOut', [employee_id, ip_address]);

      // Actualizar notas si se proporcionaron
      if (notes) {
        const today = getCurrentDate();
        await executeQuery(
          'UPDATE time_entries SET notes = ? WHERE employee_id = ? AND date = ?',
          [notes, employee_id, today]
        );
      }

      // Obtener el registro actualizado
      const today = getCurrentDate();
      const [updatedEntry] = await executeQuery(
        'SELECT * FROM time_entries WHERE employee_id = ? AND date = ?',
        [employee_id, today]
      );

      res.json({
        success: true,
        message: `Salida registrada para ${employee[0].name}`,
        data: updatedEntry
      });

    } catch (dbError) {
      if (dbError.sqlMessage && dbError.sqlMessage.includes('No active entry found')) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró entrada activa para hoy'
        });
      }
      throw dbError;
    }

  } catch (error) {
    console.error('Error registrando salida:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/time/break-start - Iniciar descanso
router.post('/break-start', [
  body('employee_id').isInt({ min: 1 }).withMessage('ID de empleado requerido')
], validateRequest, async (req, res) => {
  try {
    const { employee_id } = req.body;

    // Verificar que el empleado existe
    const employee = await executeQuery(
      'SELECT id, name FROM employees WHERE id = ?',
      [employee_id]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    try {
      // Usar procedimiento almacenado para iniciar descanso
      await executeStoredProcedure('StartBreak', [employee_id]);

      // Obtener el registro actualizado
      const today = getCurrentDate();
      const [updatedEntry] = await executeQuery(
        'SELECT * FROM time_entries WHERE employee_id = ? AND date = ?',
        [employee_id, today]
      );

      res.json({
        success: true,
        message: `Descanso iniciado para ${employee[0].name}`,
        data: updatedEntry
      });

    } catch (dbError) {
      if (dbError.sqlMessage && dbError.sqlMessage.includes('No active work session')) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró sesión de trabajo activa'
        });
      }
      throw dbError;
    }

  } catch (error) {
    console.error('Error iniciando descanso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/time/break-end - Terminar descanso
router.post('/break-end', [
  body('employee_id').isInt({ min: 1 }).withMessage('ID de empleado requerido')
], validateRequest, async (req, res) => {
  try {
    const { employee_id } = req.body;

    // Verificar que el empleado existe
    const employee = await executeQuery(
      'SELECT id, name FROM employees WHERE id = ?',
      [employee_id]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    try {
      // Usar procedimiento almacenado para terminar descanso
      await executeStoredProcedure('EndBreak', [employee_id]);

      // Obtener el registro actualizado
      const today = getCurrentDate();
      const [updatedEntry] = await executeQuery(
        'SELECT * FROM time_entries WHERE employee_id = ? AND date = ?',
        [employee_id, today]
      );

      res.json({
        success: true,
        message: `Descanso terminado para ${employee[0].name}`,
        data: updatedEntry
      });

    } catch (dbError) {
      if (dbError.sqlMessage && dbError.sqlMessage.includes('No active break found')) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró descanso activo'
        });
      }
      throw dbError;
    }

  } catch (error) {
    console.error('Error terminando descanso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/time/entries - Obtener registros de tiempo
router.get('/entries', [
  query('employee_id').optional().isInt({ min: 1 }).withMessage('ID de empleado debe ser entero'),
  query('start_date').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
  query('end_date').optional().isISO8601().withMessage('Fecha de fin debe ser válida'),
  query('status').optional().isIn(['clocked-in', 'on-break', 'clocked-out']).withMessage('Estado inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100')
], validateRequest, async (req, res) => {
  try {
    const {
      employee_id,
      start_date,
      end_date,
      status,
      page = 1,
      limit = 50
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT
        te.*,
        e.name as employee_name,
        e.employee_code,
        e.department
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.id
      WHERE 1=1
    `;

    const params = [];

    if (employee_id) {
      query += ' AND te.employee_id = ?';
      params.push(employee_id);
    }

    if (start_date) {
      query += ' AND te.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND te.date <= ?';
      params.push(end_date);
    }

    if (status) {
      query += ' AND te.status = ?';
      params.push(status);
    }

    query += ' ORDER BY te.date DESC, te.clock_in DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const entries = await executeQuery(query, params);

    // Contar total para paginación
    let countQuery = `
      SELECT COUNT(*) as total
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.id
      WHERE 1=1
    `;
    const countParams = [];

    if (employee_id) {
      countQuery += ' AND te.employee_id = ?';
      countParams.push(employee_id);
    }

    if (start_date) {
      countQuery += ' AND te.date >= ?';
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += ' AND te.date <= ?';
      countParams.push(end_date);
    }

    if (status) {
      countQuery += ' AND te.status = ?';
      countParams.push(status);
    }

    const [{ total }] = await executeQuery(countQuery, countParams);

    res.json({
      success: true,
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo registros:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/time/today - Obtener registros de hoy
router.get('/today', async (req, res) => {
  try {
    const today = getCurrentDate();

    const entries = await executeQuery(`
      SELECT
        te.*,
        e.name as employee_name,
        e.employee_code,
        e.department,
        e.position
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.id
      WHERE te.date = ?
      ORDER BY te.clock_in ASC
    `, [today]);

    res.json({
      success: true,
      data: entries,
      date: today
    });

  } catch (error) {
    console.error('Error obteniendo registros de hoy:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/time/active - Obtener empleados actualmente trabajando
router.get('/active', async (req, res) => {
  try {
    const today = getCurrentDate();

    const activeEmployees = await executeQuery(`
      SELECT
        te.*,
        e.name as employee_name,
        e.employee_code,
        e.department,
        e.position,
        CASE
          WHEN te.status = 'clocked-in' THEN
            ROUND(TIMESTAMPDIFF(MINUTE, te.clock_in, NOW()) / 60.0, 2)
          ELSE te.total_hours
        END as current_hours
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.id
      WHERE te.date = ? AND te.status IN ('clocked-in', 'on-break')
      ORDER BY te.clock_in ASC
    `, [today]);

    res.json({
      success: true,
      data: activeEmployees,
      count: activeEmployees.length
    });

  } catch (error) {
    console.error('Error obteniendo empleados activos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/time/entries/:id - Actualizar registro de tiempo (para correcciones)
router.put('/entries/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser entero válido'),
  body('clock_in').optional().isISO8601().withMessage('Hora de entrada debe ser válida'),
  body('clock_out').optional().isISO8601().withMessage('Hora de salida debe ser válida'),
  body('notes').optional().isString().withMessage('Notas deben ser texto'),
  body('total_hours').optional().isDecimal().withMessage('Total de horas debe ser decimal')
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verificar que el registro existe
    const existing = await executeQuery(
      'SELECT id FROM time_entries WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado'
      });
    }

    // Construir query de actualización
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);

    await executeQuery(
      `UPDATE time_entries SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    // Obtener registro actualizado
    const [updatedEntry] = await executeQuery(
      'SELECT * FROM time_entries WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Registro actualizado exitosamente',
      data: updatedEntry
    });

  } catch (error) {
    console.error('Error actualizando registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/time/summary - Resumen de tiempo por empleado
router.get('/summary', [
  query('start_date').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
  query('end_date').optional().isISO8601().withMessage('Fecha de fin debe ser válida'),
  query('employee_id').optional().isInt({ min: 1 }).withMessage('ID de empleado debe ser entero')
], validateRequest, async (req, res) => {
  try {
    const { start_date, end_date, employee_id } = req.query;

    // Si no se especifican fechas, usar la semana actual
    const startDate = start_date || getCurrentDate();
    const endDate = end_date || getCurrentDate();

    let query = `
      SELECT
        e.id as employee_id,
        e.name as employee_name,
        e.employee_code,
        e.department,
        COUNT(te.id) as days_worked,
        SUM(te.total_hours) as total_hours,
        AVG(te.total_hours) as avg_daily_hours,
        SUM(CASE WHEN te.total_hours > cs.working_hours_per_day
             THEN te.total_hours - cs.working_hours_per_day
             ELSE 0 END) as overtime_hours
      FROM employees e
      LEFT JOIN time_entries te ON e.id = te.employee_id
        AND te.date BETWEEN ? AND ?
        AND te.total_hours IS NOT NULL
      CROSS JOIN company_settings cs
      WHERE e.is_active = TRUE
    `;

    const params = [startDate, endDate];

    if (employee_id) {
      query += ' AND e.id = ?';
      params.push(employee_id);
    }

    query += ' GROUP BY e.id ORDER BY e.name';

    const summary = await executeQuery(query, params);

    res.json({
      success: true,
      data: summary,
      period: {
        start_date: startDate,
        end_date: endDate
      }
    });

  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
