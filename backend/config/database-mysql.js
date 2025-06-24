const mysql = require('mysql2/promise');
const moment = require('moment-timezone');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'control_horario',
  timezone: '+00:00', // Usar UTC en la base de datos
  dateStrings: false,
  supportBigNumbers: true,
  bigNumberStrings: true,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de conexiones
let pool;

const createPool = () => {
  try {
    pool = mysql.createPool(dbConfig);
    console.log('✅ Pool de conexiones MySQL creado exitosamente');

    // Verificar conexión inicial
    pool.getConnection()
      .then(connection => {
        console.log('✅ Conexión a MySQL establecida');
        connection.release();
      })
      .catch(err => {
        console.error('❌ Error conectando a MySQL:', err.message);
      });

    return pool;
  } catch (error) {
    console.error('❌ Error creando pool de conexiones:', error.message);
    throw error;
  }
};

// Obtener pool de conexiones
const getPool = () => {
  if (!pool) {
    pool = createPool();
  }
  return pool;
};

// Ejecutar query con manejo de errores
const executeQuery = async (query, params = []) => {
  const connection = getPool();
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando query:', error.message);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
};

// Ejecutar procedimiento almacenado
const executeStoredProcedure = async (procedureName, params = []) => {
  const connection = getPool();
  try {
    const placeholders = params.map(() => '?').join(', ');
    const query = `CALL ${procedureName}(${placeholders})`;
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando procedimiento almacenado:', error.message);
    console.error('Procedure:', procedureName);
    console.error('Params:', params);
    throw error;
  }
};

// Transacción
const executeTransaction = async (queries) => {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();

    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }

    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Formatear fecha para MySQL
const formatDateForDB = (date) => {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

// Formatear fecha desde MySQL
const formatDateFromDB = (dateString, timezone = 'America/Mexico_City') => {
  return moment.utc(dateString).tz(timezone);
};

// Obtener fecha actual en zona horaria específica
const getCurrentDate = (timezone = 'America/Mexico_City') => {
  return moment().tz(timezone).format('YYYY-MM-DD');
};

// Obtener fecha y hora actual en zona horaria específica
const getCurrentDateTime = (timezone = 'America/Mexico_City') => {
  return moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');
};

// Cerrar pool de conexiones
const closePool = async () => {
  if (pool) {
    try {
      await pool.end();
      console.log('✅ Pool de conexiones cerrado');
    } catch (error) {
      console.error('❌ Error cerrando pool de conexiones:', error.message);
    }
  }
};

// Verificar salud de la base de datos
const checkDatabaseHealth = async () => {
  try {
    const result = await executeQuery('SELECT 1 as health_check');
    return result.length > 0;
  } catch (error) {
    console.error('❌ Error en health check de la base de datos:', error.message);
    return false;
  }
};

// Inicializar base de datos con datos de ejemplo si está vacía
const initializeDatabase = async () => {
  try {
    // Verificar si hay datos en la tabla de empleados
    const employees = await executeQuery('SELECT COUNT(*) as count FROM employees');

    if (employees[0].count === 0) {
      console.log('📝 Inicializando base de datos con datos de ejemplo...');

      // Insertar empleados de ejemplo
      const employeesData = [
        ['EMP001', 'Ana García', 'ana.garcia@empresa.com', 'Desarrollo', 'Desarrolladora Frontend', '2024-01-15'],
        ['EMP002', 'Carlos Rodríguez', 'carlos.rodriguez@empresa.com', 'Diseño', 'Diseñador UX/UI', '2024-02-01'],
        ['EMP003', 'María López', 'maria.lopez@empresa.com', 'Marketing', 'Marketing Manager', '2024-01-10'],
        ['EMP004', 'Juan Pérez', 'juan.perez@empresa.com', 'Desarrollo', 'Desarrollador Backend', '2024-03-01'],
        ['EMP005', 'Laura Martínez', 'laura.martinez@empresa.com', 'Recursos Humanos', 'HR Specialist', '2024-02-15']
      ];

      for (const employeeData of employeesData) {
        await executeQuery(
          'INSERT INTO employees (employee_code, name, email, department, position, hire_date) VALUES (?, ?, ?, ?, ?, ?)',
          employeeData
        );
      }

      console.log('✅ Datos de ejemplo insertados correctamente');
    }

    // Verificar configuración de la empresa
    const settings = await executeQuery('SELECT COUNT(*) as count FROM company_settings');

    if (settings[0].count === 0) {
      await executeQuery(
        'INSERT INTO company_settings (name, working_hours_per_day, working_days_per_week, standard_work_start, standard_work_end, timezone, overtime_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Mi Empresa', 8.0, 5, '09:00:00', '17:00:00', 'America/Mexico_City', 1.50]
      );
      console.log('✅ Configuración de empresa insertada');
    }

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
  }
};

module.exports = {
  createPool,
  getPool,
  executeQuery,
  executeStoredProcedure,
  executeTransaction,
  formatDateForDB,
  formatDateFromDB,
  getCurrentDate,
  getCurrentDateTime,
  closePool,
  checkDatabaseHealth,
  initializeDatabase
};
