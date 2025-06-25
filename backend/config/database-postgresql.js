const { Pool } = require('pg');
const moment = require('moment-timezone');

// Configuración de la base de datos PostgreSQL
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Pool de conexiones
let pool;

const createPool = () => {
  try {
    pool = new Pool(dbConfig);
    console.log('✅ Pool de conexiones PostgreSQL creado exitosamente');

    // Verificar conexión inicial
    pool.connect()
      .then(client => {
        console.log('✅ Conexión a PostgreSQL establecida');
        client.release();
      })
      .catch(err => {
        console.error('❌ Error conectando a PostgreSQL:', err.message);
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
  const client = await getPool().connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error ejecutando query:', error.message);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  } finally {
    client.release();
  }
};

// Ejecutar función almacenada (equivalente a stored procedures en PostgreSQL)
const executeFunction = async (functionName, params = []) => {
  const client = await getPool().connect();
  try {
    const placeholders = params.map((_, index) => `$${index + 1}`).join(', ');
    const query = `SELECT ${functionName}(${placeholders})`;
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error ejecutando función:', error.message);
    console.error('Function:', functionName);
    console.error('Params:', params);
    throw error;
  } finally {
    client.release();
  }
};

// Transacción
const executeTransaction = async (queries) => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const results = [];
    for (const { query, params } of queries) {
      const result = await client.query(query, params);
      results.push(result.rows);
    }

    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Formatear fecha para PostgreSQL
const formatDateForDB = (date) => {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

// Formatear fecha desde PostgreSQL
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

    if (parseInt(employees[0].count) === 0) {
      console.log('📝 Inicializando base de datos con datos de ejemplo...');

      // Los datos ya están en el schema, no necesitamos insertarlos aquí
      console.log('✅ Base de datos ya inicializada con el schema');
    }

    // Verificar configuración de la empresa
    const settings = await executeQuery('SELECT COUNT(*) as count FROM company_settings');

    if (parseInt(settings[0].count) === 0) {
      await executeQuery(
        'INSERT INTO company_settings (name, working_hours_per_day, working_days_per_week, standard_work_start, standard_work_end, timezone, overtime_rate) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['Mi Empresa', 8.0, 5, '09:00:00', '17:00:00', 'America/Mexico_City', 1.50]
      );
      console.log('✅ Configuración de empresa insertada');
    }

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
  }
};

// Adaptadores para mantener compatibilidad con el código existente
const executeStoredProcedure = async (procedureName, params = []) => {
  // Mapear procedimientos de MySQL a funciones de PostgreSQL
  const functionMap = {
    'ClockIn': 'clock_in',
    'ClockOut': 'clock_out',
    'StartBreak': 'start_break',
    'EndBreak': 'end_break'
  };

  const pgFunction = functionMap[procedureName];
  if (!pgFunction) {
    throw new Error(`Función no encontrada: ${procedureName}`);
  }

  return executeFunction(pgFunction, params);
};

module.exports = {
  createPool,
  getPool,
  executeQuery,
  executeStoredProcedure,
  executeFunction,
  executeTransaction,
  formatDateForDB,
  formatDateFromDB,
  getCurrentDate,
  getCurrentDateTime,
  closePool,
  checkDatabaseHealth,
  initializeDatabase
};
