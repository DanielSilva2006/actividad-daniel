const { Pool } = require('pg');
const dotenv = require('dotenv');
const { hashPassword } = require('../utils/crypto');

dotenv.config();

// ==========================================
// PostgreSQL CONNECTION POOL (Supabase)
// ==========================================
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,                // Max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Test the connection on module load
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Conexión exitosa a PostgreSQL (Supabase)'))
  .catch(err => {
    console.error('❌ Error de conexión a PostgreSQL:', err.message);
    console.error('   Verifica las variables DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD en tu archivo .env');
  });

// ==========================================
// TABLE CREATION & SCHEMA MIGRATION
// ==========================================
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Inicializando esquema de Base de Datos PostgreSQL...');

    // Create tables using IF NOT EXISTS for idempotency
    await client.query(`
      CREATE TABLE IF NOT EXISTS administradores (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(100) UNIQUE NOT NULL,
        contrasena TEXT NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        creado_en TIMESTAMP DEFAULT NOW(),
        actualizado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cursos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        duracion VARCHAR(100),
        modalidad VARCHAR(100),
        dificultad VARCHAR(100),
        imagen TEXT,
        temas JSONB DEFAULT '[]',
        perfil TEXT,
        aplicaciones JSONB DEFAULT '[]',
        tecnologias JSONB DEFAULT '[]',
        creado_en TIMESTAMP DEFAULT NOW(),
        actualizado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        documento VARCHAR(100) UNIQUE NOT NULL,
        correo VARCHAR(255) UNIQUE NOT NULL,
        telefono VARCHAR(50),
        edad INTEGER,
        pais VARCHAR(100),
        contrasena TEXT NOT NULL,
        cursos_ids JSONB DEFAULT '[]',
        estado VARCHAR(20) DEFAULT 'PENDIENTE',
        usuario_acceso VARCHAR(100),
        contrasena_acceso VARCHAR(100),
        creado_en TIMESTAMP DEFAULT NOW(),
        actualizado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    // Migración automática para la base de datos en Supabase
    try {
      await client.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cursos_ids JSONB DEFAULT '[]'`);
      // Intentar migrar los datos viejos si existían
      await client.query(`UPDATE usuarios SET cursos_ids = jsonb_build_array(curso_id) WHERE curso_id IS NOT NULL AND jsonb_typeof(cursos_ids) = 'array' AND jsonb_array_length(cursos_ids) = 0`);
    } catch(e) {}


    await client.query(`
      CREATE TABLE IF NOT EXISTS modulos (
        id SERIAL PRIMARY KEY,
        curso_id INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        orden INTEGER DEFAULT 1,
        creado_en TIMESTAMP DEFAULT NOW(),
        actualizado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        titulo VARCHAR(255),
        mensaje TEXT,
        leida BOOLEAN DEFAULT FALSE,
        creado_en TIMESTAMP DEFAULT NOW(),
        actualizado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sent_emails (
        id SERIAL PRIMARY KEY,
        para VARCHAR(255),
        asunto VARCHAR(500),
        estudiante VARCHAR(255),
        curso VARCHAR(255),
        usuario VARCHAR(100),
        contrasena VARCHAR(100),
        html TEXT,
        error TEXT,
        fecha TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Esquema de tablas creado/verificado correctamente.');

    // ==========================================
    // SEED DATA (only if tables are empty)
    // ==========================================

    // 1. Seed Administradores
    const adminCheck = await client.query('SELECT COUNT(*) FROM administradores');
    if (parseInt(adminCheck.rows[0].count, 10) === 0) {
      console.log('Sembrando administrador por defecto...');
      await client.query(
        'INSERT INTO administradores (usuario, contrasena, nombre) VALUES ($1, $2, $3)',
        ['admin', hashPassword('admin1234'), 'Administrador Infinity Tech']
      );
    }

    // 2. Seed Cursos
    const cursosCheck = await client.query('SELECT COUNT(*) FROM cursos');
    if (parseInt(cursosCheck.rows[0].count, 10) === 0) {
      console.log('Sembrando cursos principales...');

      await client.query(`
        INSERT INTO cursos (titulo, descripcion, duracion, modalidad, dificultad, imagen, temas, perfil, aplicaciones, tecnologias)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        'Regresión Lineal',
        'La regresión lineal es uno de los algoritmos fundacionales de Machine Learning e Inteligencia Artificial. En este curso especializado, aprenderás a profundidad cómo modelar, predecir y analizar relaciones cuantitativas complejas entre variables dependientes e independientes usando el método de mínimos cuadrados ordinarios y técnicas modernas de optimización gradient descent.',
        '8 Semanas (60 Horas Académicas)',
        'Online - Clases en Vivo',
        'Principiante a Intermedio',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Introducción a Machine Learning', 'Variables dependientes e independientes', 'Modelos predictivos cuantitativos', 'Programación en Python aplicado', 'Manipulación de matrices con NumPy', 'Análisis y estructuración con Pandas', 'Entrenamiento con Scikit-Learn', 'Visualización de datos (Matplotlib & Seaborn)', 'Predicción probabilística de datos', 'Evaluación de modelos (MSE, R², RMSE)']),
        'Estudiantes de ingeniería, analistas de datos, desarrolladores de software y profesionales financieros que deseen iniciarse formalmente en el modelado predictivo estadístico.',
        JSON.stringify(['Predicción del volumen de ventas empresariales', 'Análisis predictivo financiero e inmobiliario', 'Ciencia de datos y optimización de métricas', 'Inteligencia de negocios y proyección de ingresos']),
        JSON.stringify(['Python', 'NumPy', 'Pandas', 'Scikit-Learn', 'Matplotlib', 'Jupyter Notebook'])
      ]);

      await client.query(`
        INSERT INTO cursos (titulo, descripcion, duracion, modalidad, dificultad, imagen, temas, perfil, aplicaciones, tecnologias)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        'Algoritmos Genéticos',
        'Los algoritmos genéticos son potentes técnicas de búsqueda heurística y optimización inspiradas directamente en los principios de la evolución biológica y la selección natural de Charles Darwin. Aprenderás a representar problemas complejos en forma de cromosomas, y guiarás una población de soluciones candidatas mediante operadores de cruce y mutación para resolver desafíos logísticos, robóticos y de redes neuronales.',
        '10 Semanas (80 Horas Académicas)',
        'Online - Clases en Vivo',
        'Avanzado',
        'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Introducción a la Inteligencia Artificial Evolutiva', 'Modelado de evolución computacional', 'Estructura de poblaciones y diseño de cromosomas', 'Estrategias y ratios de mutación genética', 'Cruce cromosómico y recombinación', 'Selección natural (Ruleta, Torneo, Elitismo)', 'Funciones de Aptitud (Fitness Functions)', 'Python avanzado aplicado a IA', 'Optimización y resolución de problemas NP-Hard']),
        'Desarrolladores con experiencia previa en Python, investigadores científicos y apasionados de la IA que quieran explorar la heurística evolutiva y optimización estocástica.',
        JSON.stringify(['Optimización de rutas logísticas complejas (TSP)', 'Entrenamiento y diseño de arquitecturas de IA avanzadas', 'Navegación autónoma y robótica móvil', 'Sistemas inteligentes de calendarización y distribución', 'Investigación científica y diseño bio-informático']),
        JSON.stringify(['Python', 'SciPy', 'DEAP Framework', 'NumPy', 'Matplotlib'])
      ]);
    }

    // 3. Seed Modulos (Forzar actualización borrando primero los existentes para este test)
    await client.query('DELETE FROM modulos');
    const modulosCheck = await client.query('SELECT COUNT(*) FROM modulos');
    if (parseInt(modulosCheck.rows[0].count, 10) === 0) {
      console.log('Sembrando módulos de cursos desde la pizarra...');

      // Get the IDs that were assigned by PostgreSQL
      const cursosRows = await client.query('SELECT id, titulo FROM cursos ORDER BY id');
      const curso1Id = cursosRows.rows[0]?.id; // Regresión Lineal
      const curso2Id = cursosRows.rows[1]?.id; // Algoritmo Genético

      if (curso1Id) {
        const mods1 = [
          [curso1Id, 1, 'Explicación', 'Introducción teórica detallada al modelo matemático de regresión lineal.'],
          [curso1Id, 2, 'Ejemplos', 'Casos prácticos de predicciones en la vida real.'],
          [curso1Id, 3, 'Demo', 'Demostración práctica y en vivo del algoritmo funcionando.'],
          [curso1Id, 4, 'Subir datos en CSV -> Regresión', 'Procesamiento e inyección de datasets CSV para entrenar el modelo de regresión.'],
          [curso1Id, 5, 'Examen', 'Evaluación final de conocimientos adquiridos en Regresión Lineal.']
        ];
        for (const m of mods1) {
          await client.query('INSERT INTO modulos (curso_id, orden, titulo, descripcion) VALUES ($1, $2, $3, $4)', m);
        }
      }

      if (curso2Id) {
        const mods2 = [
          [curso2Id, 1, 'Explicación', 'Conceptos fundamentales de cromosomas, poblaciones y funciones de fitness.'],
          [curso2Id, 2, 'Ejemplos', 'Resolución evolutiva aplicada a problemas estocásticos y de ruteo.'],
          [curso2Id, 3, 'Demo', 'Visualización en vivo de la mutación y convergencia del algoritmo genético.'],
          [curso2Id, 4, 'Examen', 'Prueba técnica sobre operadores de mutación, cruce y selección natural.']
        ];
        for (const m of mods2) {
          await client.query('INSERT INTO modulos (curso_id, orden, titulo, descripcion) VALUES ($1, $2, $3, $4)', m);
        }
      }
    }

    // 4. Seed Mock Students (Limpiar y sembrar con array de cursos)
    await client.query('DELETE FROM usuarios');
    const usersCheck = await client.query('SELECT COUNT(*) FROM usuarios');
    if (parseInt(usersCheck.rows[0].count, 10) === 0) {
      console.log('Sembrando estudiantes de prueba...');
      const cursosRows = await client.query('SELECT id FROM cursos ORDER BY id');
      const c1 = cursosRows.rows[0]?.id;
      const c2 = cursosRows.rows[1]?.id;

      // Carlos (Accepted student) - Inscrito en ambos cursos
      const carlosRes = await client.query(
        `INSERT INTO usuarios (nombre, documento, correo, telefono, edad, pais, contrasena, cursos_ids, estado, usuario_acceso, contrasena_acceso)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
        ['Carlos Rodríguez', 'V-20456789', 'carlos.rod@gmail.com', '+584125556677', 24, 'Venezuela', hashPassword('carlos123'), JSON.stringify([c1, c2]), 'ACEPTADO', 'crodriguez_fit', 'FitSecure2026']
      );
      const carlosId = carlosRes.rows[0].id;

      await client.query(
        'INSERT INTO notificaciones (usuario_id, titulo, mensaje, leida) VALUES ($1,$2,$3,$4)',
        [carlosId, '¡Admisión Aprobada!', 'Felicidades Carlos, has sido aceptado en Infinity Tech University para tus cursos seleccionados. Tus credenciales oficiales de acceso son: Usuario: crodriguez_fit | Contraseña: FitSecure2026.', false]
      );

      // María (Pending student) - Inscrita solo en Algoritmo Genético
      await client.query(
        `INSERT INTO usuarios (nombre, documento, correo, telefono, edad, pais, contrasena, cursos_ids, estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        ['María González', 'PE-10293847', 'maria.gonzalez.ai@gmail.com', '+51987654321', 26, 'Perú', hashPassword('maria123'), JSON.stringify([c2]), 'PENDIENTE']
      );

      // Ana (Pending student) - Inscrita solo en Regresión Lineal
      await client.query(
        `INSERT INTO usuarios (nombre, documento, correo, telefono, edad, pais, contrasena, cursos_ids, estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        ['Ana Silva', 'AR-99384726', 'ana.silva.data@gmail.com', '+549113847291', 28, 'Argentina', hashPassword('ana123'), JSON.stringify([c1]), 'PENDIENTE']
      );
    }

    console.log('✅ Inicialización de la Base de Datos PostgreSQL Completada.');
  } catch (err) {
    console.error('❌ Error durante la inicialización de la BD:', err);
  } finally {
    client.release();
  }
}

// ==========================================
// CRUD OPERATIONS (Same interface as JSON DB)
// ==========================================

/**
 * Inserts a new record into a table and returns the created row.
 * @param {string} tableName
 * @param {object} record
 * @returns {Promise<object>}
 */
async function insert(tableName, record) {
  // Build dynamic INSERT
  const keys = Object.keys(record);
  const values = Object.values(record).map(v => {
    // Convert arrays/objects to JSON string for JSONB columns
    if (Array.isArray(v) || (typeof v === 'object' && v !== null)) return JSON.stringify(v);
    return v;
  });
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');

  const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
  const result = await pool.query(query, values);
  return parseRow(result.rows[0]);
}

/**
 * Selects records from a table. Optionally applies a JS filter function.
 * For performance-critical queries, use selectWhere() instead.
 * @param {string} tableName
 * @param {function} [filterFn]
 * @returns {Promise<Array<object>>}
 */
async function select(tableName, filterFn) {
  const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id`);
  let rows = result.rows.map(parseRow);
  if (filterFn) {
    rows = rows.filter(filterFn);
  }
  return rows;
}

/**
 * Selects a single record matching a JS filter function.
 * @param {string} tableName
 * @param {function} filterFn
 * @returns {Promise<object|null>}
 */
async function selectOne(tableName, filterFn) {
  const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id`);
  const rows = result.rows.map(parseRow);
  return rows.find(filterFn) || null;
}

/**
 * Updates a record matching the given ID.
 * @param {string} tableName
 * @param {number} id
 * @param {object} updates
 * @returns {Promise<object|null>}
 */
async function update(tableName, id, updates) {
  const idNum = parseInt(id, 10);
  const keys = Object.keys(updates);
  if (keys.length === 0) return null;

  const setClauses = [];
  const values = [];
  let paramIdx = 1;

  for (const key of keys) {
    let val = updates[key];
    if (Array.isArray(val) || (typeof val === 'object' && val !== null)) val = JSON.stringify(val);
    setClauses.push(`${key} = $${paramIdx}`);
    values.push(val);
    paramIdx++;
  }

  // Add actualizado_en timestamp
  setClauses.push(`actualizado_en = NOW()`);

  values.push(idNum);
  const query = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) return null;
  return parseRow(result.rows[0]);
}

/**
 * Deletes a record matching the given ID.
 * @param {string} tableName
 * @param {number} id
 * @returns {Promise<boolean>}
 */
async function remove(tableName, id) {
  const idNum = parseInt(id, 10);
  const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [idNum]);
  return result.rowCount > 0;
}

/**
 * Utility: Parse a raw PostgreSQL row to ensure JSONB fields are JS arrays/objects
 * and dates are ISO strings for frontend compatibility.
 */
function parseRow(row) {
  if (!row) return row;
  const parsed = { ...row };

  // Convert Date objects to ISO strings
  for (const key of Object.keys(parsed)) {
    if (parsed[key] instanceof Date) {
      parsed[key] = parsed[key].toISOString();
    }
  }

  return parsed;
}

// ==========================================
// INITIALIZE ON IMPORT
// ==========================================
initializeDatabase();

module.exports = {
  pool,
  insert,
  select,
  selectOne,
  update,
  delete: remove
};
