const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { executeQuery, getCurrentDate } = require('../config/database');

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

// GET /api/employees - Obtener todos los empleados
router.get('/', [
  query('active').optional().isBoolean().withMessage('El campo active debe ser boolean'),
  query('department').optional().isString().withMessage('El departamento debe ser texto'),
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El limit debe estar entre 1 y 100'),
], validateRequest, async (req, res) => {
  try {
    const { active, department, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        id, employee_code, name, email, department, position,
        avatar_url, is_active, hire_date, salary, phone, address,
        created_at, updated_at
      FROM employees
      WHERE 1=1
    `;

    const params = [];

    if (active !== undefined) {
      query += ' AND is_active = ?';
      params.push(active === 'true');
    }

    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const employees = await executeQuery(query, params);

    // Contar total de empleados para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM employees WHERE 1=1';
    const countParams = [];

    if (active !== undefined) {
      countQuery += ' AND is_active = ?';
      countParams.push(active === 'true');
    }

    if (department) {
      countQuery += ' AND department = ?';
      countParams.push(department);
    }

    const [{ total }] = await executeQuery(countQuery, countParams);

    res.json({
      success: true,
      data: employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/employees/:id - Obtener un empleado por ID
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero válido')
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;

    const employees = await executeQuery(
      `SELECT
        id, employee_code, name, email, department, position,
        avatar_url, is_active, hire_date, salary, phone, address,
        created_at, updated_at
      FROM employees
      WHERE id = ?`,
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    res.json({
      success: true,
      data: employees[0]
    });
  } catch (error) {
    console.error('Error obteniendo empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/employees - Crear nuevo empleado
router.post('/', [
  body('employee_code').isString().isLength({ min: 1, max: 50 }).withMessage('Código de empleado requerido (máx. 50 caracteres)'),
  body('name').isString().isLength({ min: 1, max: 255 }).withMessage('Nombre requerido (máx. 255 caracteres)'),
  body('email').isEmail().withMessage('Email válido requerido'),
  body('department').isString().isLength({ min: 1, max: 100 }).withMessage('Departamento requerido (máx. 100 caracteres)'),
  body('position').isString().isLength({ min: 1, max: 100 }).withMessage('Posición requerida (máx. 100 caracteres)'),
  body('hire_date').isISO8601().withMessage('Fecha de contratación válida requerida'),
  body('salary').optional().isDecimal().withMessage('Salario debe ser un número decimal'),
  body('phone').optional().isString().isLength({ max: 20 }).withMessage('Teléfono máximo 20 caracteres'),
  body('address').optional().isString().withMessage('Dirección debe ser texto'),
  body('avatar_url').optional().isURL().withMessage('URL de avatar debe ser válida')
], validateRequest, async (req, res) => {
  try {
    const {
      employee_code, name, email, department, position, hire_date,
      salary, phone, address, avatar_url
    } = req.body;

    // Verificar que el código de empleado y email sean únicos
    const existing = await executeQuery(
      'SELECT id FROM employees WHERE employee_code = ? OR email = ?',
      [employee_code, email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El código de empleado o email ya existe'
      });
    }

    const result = await executeQuery(
      `INSERT INTO employees
       (employee_code, name, email, department, position, hire_date, salary, phone, address, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_code, name, email, department, position, hire_date, salary, phone, address, avatar_url]
    );

    // Obtener el empleado creado
    const [newEmployee] = await executeQuery(
      'SELECT * FROM employees WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Empleado creado exitosamente',
      data: newEmployee
    });
  } catch (error) {
    console.error('Error creando empleado:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        success: false,
        message: 'El código de empleado o email ya existe'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
});

// PUT /api/employees/:id - Actualizar empleado
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero válido'),
  body('employee_code').optional().isString().isLength({ min: 1, max: 50 }).withMessage('Código de empleado máximo 50 caracteres'),
  body('name').optional().isString().isLength({ min: 1, max: 255 }).withMessage('Nombre máximo 255 caracteres'),
  body('email').optional().isEmail().withMessage('Email debe ser válido'),
  body('department').optional().isString().isLength({ max: 100 }).withMessage('Departamento máximo 100 caracteres'),
  body('position').optional().isString().isLength({ max: 100 }).withMessage('Posición máximo 100 caracteres'),
  body('hire_date').optional().isISO8601().withMessage('Fecha de contratación debe ser válida'),
  body('salary').optional().isDecimal().withMessage('Salario debe ser un número decimal'),
  body('phone').optional().isString().isLength({ max: 20 }).withMessage('Teléfono máximo 20 caracteres'),
  body('address').optional().isString().withMessage('Dirección debe ser texto'),
  body('avatar_url').optional().isURL().withMessage('URL de avatar debe ser válida'),
  body('is_active').optional().isBoolean().withMessage('is_active debe ser boolean')
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    // Verificar que el empleado existe
    const existing = await executeQuery('SELECT id FROM employees WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Verificar unicidad de código y email si se están actualizando
    if (updateFields.employee_code || updateFields.email) {
      const duplicateCheck = await executeQuery(
        'SELECT id FROM employees WHERE (employee_code = ? OR email = ?) AND id != ?',
        [updateFields.employee_code || '', updateFields.email || '', id]
      );

      if (duplicateCheck.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'El código de empleado o email ya existe'
        });
      }
    }

    // Construir query de actualización dinámicamente
    const fields = Object.keys(updateFields);
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updateFields[field]);
    values.push(id);

    await executeQuery(
      `UPDATE employees SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    // Obtener el empleado actualizado
    const [updatedEmployee] = await executeQuery(
      'SELECT * FROM employees WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Empleado actualizado exitosamente',
      data: updatedEmployee
    });
  } catch (error) {
    console.error('Error actualizando empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/employees/:id - Eliminar empleado (soft delete)
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero válido')
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el empleado existe
    const existing = await executeQuery('SELECT id FROM employees WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Soft delete - marcar como inactivo
    await executeQuery(
      'UPDATE employees SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Empleado desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/employees/departments/list - Obtener lista de departamentos únicos
router.get('/departments/list', async (req, res) => {
  try {
    const departments = await executeQuery(
      'SELECT DISTINCT department FROM employees WHERE is_active = TRUE ORDER BY department'
    );

    res.json({
      success: true,
      data: departments.map(row => row.department)
    });
  } catch (error) {
    console.error('Error obteniendo departamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/employees/:id/status - Obtener estado actual del empleado
router.get('/:id/status', [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero válido')
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const today = getCurrentDate();

    // Verificar que el empleado existe
    const employee = await executeQuery('SELECT id, name FROM employees WHERE id = ?', [id]);
    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Obtener entrada de hoy
    const todayEntry = await executeQuery(
      'SELECT * FROM time_entries WHERE employee_id = ? AND date = ?',
      [id, today]
    );

    const status = todayEntry.length > 0 ? todayEntry[0].status : 'not-working';

    res.json({
      success: true,
      data: {
        employee_id: id,
        employee_name: employee[0].name,
        date: today,
        status: status,
        entry: todayEntry[0] || null
      }
    });
  } catch (error) {
    console.error('Error obteniendo estado del empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
