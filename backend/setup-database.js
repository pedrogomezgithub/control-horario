#!/usr/bin/env node

/**
 * Script de configuración automática de la base de datos MySQL
 * Para el Sistema de Control Horario
 *
 * Uso: node setup-database.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

// Configuración por defecto
const DEFAULT_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  database: 'control_horario'
};

// Crear interfaz para input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para hacer preguntas al usuario
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

// Función para leer el archivo SQL del schema
const readSchemaFile = () => {
  try {
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    return fs.readFileSync(schemaPath, 'utf8');
  } catch (error) {
    console.error('❌ No se pudo leer el archivo schema.sql:', error.message);
    process.exit(1);
  }
};

// Función para ejecutar múltiples comandos SQL
const executeSQLCommands = async (connection, sqlScript) => {
  // Dividir el script en comandos individuales
  const commands = sqlScript
    .split(/;\s*$$/m)
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

  console.log(`📝 Ejecutando ${commands.length} comandos SQL...`);

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];

    if (command.toLowerCase().includes('delimiter')) {
      // Manejar comandos DELIMITER especialmente
      continue;
    }

    try {
      await connection.execute(command);
      console.log(`   ✅ Comando ${i + 1}/${commands.length} ejecutado`);
    } catch (error) {
      // Ignorar errores de DROP TABLE IF EXISTS, CREATE DATABASE IF NOT EXISTS, etc.
      if (error.code === 'ER_BAD_DB_ERROR' ||
          error.code === 'ER_DB_CREATE_EXISTS' ||
          error.code === 'ER_TABLE_EXISTS_ERROR' ||
          error.code === 'ER_DUP_KEYNAME') {
        console.log(`   ⚠️  Comando ${i + 1} omitido (ya existe): ${error.message}`);
        continue;
      }
      console.error(`   ❌ Error en comando ${i + 1}:`, error.message);
      console.error(`   📄 Comando: ${command.substring(0, 100)}...`);
    }
  }
};

// Función principal de configuración
const setupDatabase = async () => {
  console.log('\n🚀 Configuración del Sistema de Control Horario');
  console.log('================================================\n');

  try {
    // Recopilar información de conexión
    console.log('📋 Configuración de la base de datos MySQL:\n');

    const host = await askQuestion(`Host de MySQL (${DEFAULT_CONFIG.host}): `) || DEFAULT_CONFIG.host;
    const port = await askQuestion(`Puerto de MySQL (${DEFAULT_CONFIG.port}): `) || DEFAULT_CONFIG.port;
    const user = await askQuestion(`Usuario de MySQL (${DEFAULT_CONFIG.user}): `) || DEFAULT_CONFIG.user;
    const password = await askQuestion('Contraseña de MySQL: ');

    console.log('\n🔍 Validando conexión a MySQL...');

    // Crear conexión sin especificar base de datos
    const connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password
    });

    console.log('✅ Conexión a MySQL establecida correctamente\n');

    // Verificar si la base de datos existe
    console.log('🔍 Verificando si la base de datos existe...');
    const [databases] = await connection.execute(
      "SHOW DATABASES LIKE 'control_horario'"
    );

    if (databases.length > 0) {
      console.log('⚠️  La base de datos "control_horario" ya existe');
      const overwrite = await askQuestion('¿Deseas recrearla? (s/N): ');

      if (overwrite.toLowerCase() === 's' || overwrite.toLowerCase() === 'si') {
        console.log('🗑️  Eliminando base de datos existente...');
        await connection.execute('DROP DATABASE control_horario');
        console.log('✅ Base de datos eliminada');
      } else {
        console.log('🔄 Usando base de datos existente');
      }
    }

    // Crear base de datos
    console.log('🏗️  Creando base de datos...');
    await connection.execute('CREATE DATABASE IF NOT EXISTS control_horario');
    await connection.execute('USE control_horario');
    console.log('✅ Base de datos "control_horario" creada/seleccionada');

    // Leer y ejecutar el schema
    console.log('\n📄 Leyendo archivo de schema...');
    const sqlSchema = readSchemaFile();

    console.log('⚙️  Ejecutando schema de la base de datos...');
    await executeSQLCommands(connection, sqlSchema);

    console.log('\n✅ Schema ejecutado correctamente');

    // Verificar que las tablas se crearon
    console.log('\n🔍 Verificando tablas creadas...');
    const [tables] = await connection.execute('SHOW TABLES');

    console.log('📊 Tablas encontradas:');
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    // Verificar datos de ejemplo
    const [employeeCount] = await connection.execute('SELECT COUNT(*) as count FROM employees');
    const [settingsCount] = await connection.execute('SELECT COUNT(*) as count FROM company_settings');

    console.log(`\n📈 Datos insertados:`);
    console.log(`   - Empleados: ${employeeCount[0].count}`);
    console.log(`   - Configuraciones: ${settingsCount[0].count}`);

    // Actualizar archivo .env
    console.log('\n⚙️  Actualizando archivo .env...');
    const envPath = path.join(__dirname, '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Actualizar o agregar configuraciones
    const envUpdates = {
      DB_HOST: host,
      DB_PORT: port,
      DB_USER: user,
      DB_PASSWORD: password,
      DB_NAME: 'control_horario'
    };

    for (const [key, value] of Object.entries(envUpdates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const line = `${key}=${value}`;

      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, line);
      } else {
        envContent += `\n${line}`;
      }
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log('✅ Archivo .env actualizado');

    // Cerrar conexión
    await connection.end();

    // Mensaje de éxito
    console.log('\n🎉 ¡Configuración completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   🌐 Host: ${host}:${port}`);
    console.log(`   👤 Usuario: ${user}`);
    console.log(`   🗄️  Base de datos: control_horario`);
    console.log(`   📊 Tablas: ${tables.length} creadas`);

    console.log('\n🚀 Próximos pasos:');
    console.log('   1. Instalar dependencias: npm install');
    console.log('   2. Iniciar servidor: npm run dev');
    console.log('   3. Acceder a: http://localhost:5000');

    console.log('\n📚 Endpoints disponibles:');
    console.log('   - GET  /health          - Health check');
    console.log('   - GET  /api/docs        - Documentación');
    console.log('   - GET  /api/employees   - Lista empleados');
    console.log('   - POST /api/time/clock-in - Registrar entrada');

    console.log('\n✨ ¡Sistema listo para usar!\n');

  } catch (error) {
    console.error('\n❌ Error durante la configuración:', error.message);

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔐 Error de acceso: Verifica usuario y contraseña');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Error de conexión: Verifica que MySQL esté ejecutándose');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('🗄️  Error de base de datos: Verifica permisos');
    }

    console.error('\n🛠️  Soluciones sugeridas:');
    console.error('   - Verificar que MySQL esté ejecutándose');
    console.error('   - Comprobar usuario y contraseña');
    console.error('   - Verificar permisos del usuario');
    console.error('   - Revisar firewall y configuración de red');

    process.exit(1);
  } finally {
    rl.close();
  }
};

// Manejar interrupciones
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Configuración cancelada por el usuario');
  rl.close();
  process.exit(0);
});

// Ejecutar configuración
if (require.main === module) {
  setupDatabase().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { setupDatabase };
