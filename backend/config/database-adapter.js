// Adaptador de base de datos que detecta automáticamente MySQL vs PostgreSQL
require('dotenv').config();

// Detectar tipo de base de datos basado en variables de entorno
const detectDatabaseType = () => {
  // Si tenemos DATABASE_URL (típico de Render/Heroku), usar PostgreSQL
  if (process.env.DATABASE_URL) {
    return 'postgresql';
  }

  // Si el puerto es 5432 (PostgreSQL por defecto)
  if (process.env.DB_PORT === '5432') {
    return 'postgresql';
  }

  // Si el puerto es 3306 (MySQL por defecto) o no especificado
  if (process.env.DB_PORT === '3306' || !process.env.DB_PORT) {
    return 'mysql';
  }

  // Por defecto, usar MySQL para desarrollo local
  return 'mysql';
};

const dbType = detectDatabaseType();
console.log(`🗄️  Tipo de base de datos detectado: ${dbType.toUpperCase()}`);

// Importar el módulo correspondiente
let databaseModule;

if (dbType === 'postgresql') {
  databaseModule = require('./database-postgresql');
  console.log('📦 Usando adaptador PostgreSQL para Render/producción');
} else {
  databaseModule = require('./database');
  console.log('📦 Usando adaptador MySQL para desarrollo local');
}

// Exportar todas las funciones del módulo seleccionado
module.exports = {
  ...databaseModule,
  databaseType: dbType
};
