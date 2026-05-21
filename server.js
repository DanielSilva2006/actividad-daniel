const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./database/db');
const { verifyPassword, hashPassword } = require('./utils/crypto');
const { sendAdmissionEmail } = require('./utils/mailer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'infinity_tech_default_secret_key_2026';

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// MIDDLEWARES FOR ROUTE PROTECTION
// ==========================================

function authenticateStudent(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    if (verified.role !== 'student') return res.status(403).json({ error: 'Acceso prohibido. Rol insuficiente.' });
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido o expirado.' });
  }
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Acceso denegado. Token administrativo no proporcionado.' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    if (verified.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado. Se requiere cuenta de Administrador.' });
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token administrativo inválido o expirado.' });
  }
}

// ==========================================
// PUBLIC API: COURSES & ANNOUNCEMENTS
// ==========================================

app.get('/api/courses', async (req, res) => {
  try {
    const courses = await db.select('cursos');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Error al recuperar los cursos.' });
  }
});

app.get('/api/courses/:id/modules', async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  try {
    const modules = await db.select('modulos', m => m.curso_id === courseId);
    res.json(modules.sort((a, b) => a.orden - b.orden));
  } catch (err) {
    res.status(500).json({ error: 'Error al recuperar los módulos del curso.' });
  }
});

// ==========================================
// PUBLIC API: AUTHENTICATION (STUDENT & ADMIN)
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  const { nombre, documento, correo, telefono, edad, pais, contrasena, cursos_ids } = req.body;
  
  if (!nombre || !documento || !correo || !telefono || !edad || !pais || !contrasena || !cursos_ids || !Array.isArray(cursos_ids) || cursos_ids.length === 0) {
    return res.status(400).json({ error: 'Por favor complete todos los campos obligatorios y seleccione al menos un curso.' });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!emailRegex.test(correo)) {
    return res.status(400).json({ error: 'Debe proporcionar un correo válido con dominio @gmail.com' });
  }

  if (contrasena.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const existingEmail = await db.selectOne('usuarios', u => u.correo === correo);
    if (existingEmail) return res.status(400).json({ error: 'Este correo electrónico ya está registrado.' });

    const existingDoc = await db.selectOne('usuarios', u => u.documento === documento);
    if (existingDoc) return res.status(400).json({ error: 'Este documento de identidad ya se encuentra registrado.' });

    // Verify all courses exist
    const parsedCourseIds = cursos_ids.map(id => parseInt(id, 10));
    const validCourses = await db.select('cursos', c => parsedCourseIds.includes(c.id));
    if (validCourses.length !== parsedCourseIds.length) return res.status(400).json({ error: 'Uno o más cursos seleccionados no son válidos.' });

    const newStudent = await db.insert('usuarios', {
      nombre,
      documento,
      correo,
      telefono,
      edad: parseInt(edad, 10),
      pais,
      contrasena: hashPassword(contrasena),
      cursos_ids: parsedCourseIds,
      estado: 'PENDIENTE',
      usuario_acceso: null,
      contrasena_acceso: null
    });

    res.status(201).json({ 
      success: true, 
      message: 'Registro exitoso. Tu postulación está bajo evaluación del Comité de Admisión.',
      studentId: newStudent.id
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Ocurrió un error en el servidor al registrar el usuario.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { identificador, contrasena } = req.body; 

  if (!identificador || !contrasena) return res.status(400).json({ error: 'Proporcione credenciales completas.' });

  try {
    const student = await db.selectOne('usuarios', u => u.correo === identificador || u.usuario_acceso === identificador);

    if (!student) return res.status(401).json({ error: 'Credenciales inválidas.' });

    let passwordMatches = false;
    
    if (student.estado === 'ACEPTADO' && student.contrasena_acceso === contrasena) {
      passwordMatches = true;
    } else if (verifyPassword(contrasena, student.contrasena)) {
      passwordMatches = true;
    }

    if (!passwordMatches) return res.status(401).json({ error: 'Credenciales inválidas.' });

    if (student.estado === 'PENDIENTE') {
      return res.status(403).json({ 
        error: 'Tu postulación se encuentra en revisión.',
        estado: 'PENDIENTE',
        mensaje: 'El Comité de Admisiones está analizando tu perfil académico. Recibirás una notificación por correo electrónico una vez finalizada la revisión.'
      });
    }

    if (student.estado === 'RECHAZADO') {
      return res.status(403).json({ 
        error: 'Tu solicitud de ingreso ha sido rechazada.',
        estado: 'RECHAZADO',
        mensaje: 'Agradecemos tu interés, pero lamentablemente tu solicitud no cumple con los requisitos del curso en este ciclo académico.'
      });
    }

    const token = jwt.sign(
      { id: student.id, name: student.nombre, email: student.correo, role: 'student' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      student: { id: student.id, nombre: student.nombre, correo: student.correo, estado: student.estado }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error del servidor al procesar el inicio de sesión.' });
  }
});

app.post('/api/auth/login-admin', async (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) return res.status(400).json({ error: 'Proporcione usuario y contraseña.' });

  try {
    const admin = await db.selectOne('administradores', a => a.usuario === usuario);
    if (!admin) return res.status(401).json({ error: 'Usuario o contraseña administrativa incorrectos.' });

    const matches = verifyPassword(contrasena, admin.contrasena);
    if (!matches) return res.status(401).json({ error: 'Usuario o contraseña administrativa incorrectos.' });

    const token = jwt.sign(
      { id: admin.id, name: admin.nombre, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({
      success: true,
      token,
      admin: { nombre: admin.nombre, usuario: admin.usuario }
    });

  } catch (err) {
    console.error('Admin Login error:', err);
    res.status(500).json({ error: 'Error de servidor al iniciar sesión como administrador.' });
  }
});

app.post('/api/auth/recover-password', async (req, res) => {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ error: 'Ingrese su dirección de correo electrónico.' });

  try {
    const user = await db.selectOne('usuarios', u => u.correo === correo);
    if (!user) {
      return res.json({ success: true, message: 'Si el correo está registrado, se enviarán las instrucciones de recuperación.' });
    }
    res.json({ success: true, message: `Simulación de recuperación enviada a ${correo}. Revise su buzón en breves minutos.` });
  } catch (err) {
    res.status(500).json({ error: 'Error al recuperar contraseña.' });
  }
});

// ==========================================
// PROTECTED STUDENT PORTAL
// ==========================================

app.get('/api/student/dashboard', authenticateStudent, async (req, res) => {
  try {
    const student = await db.selectOne('usuarios', u => u.id === req.user.id);
    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado.' });

    // Handle stringified JSON from Supabase fallback or array
    const courseIds = typeof student.cursos_ids === 'string' ? JSON.parse(student.cursos_ids) : (student.cursos_ids || []);
    
    const courses = await db.select('cursos', c => courseIds.includes(c.id));
    const modules = await db.select('modulos', m => courseIds.includes(m.curso_id));
    const notifications = await db.select('notificaciones', n => n.usuario_id === student.id);

    const notificationsSorted = notifications.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));

    res.json({
      student: {
        id: student.id, nombre: student.nombre, documento: student.documento, correo: student.correo,
        telefono: student.telefono, edad: student.edad, pais: student.pais, estado: student.estado,
        usuario_acceso: student.usuario_acceso, contrasena_acceso: student.contrasena_acceso
      },
      courses: courses,
      modules: modules.sort((a, b) => a.orden - b.orden),
      notifications: notificationsSorted
    });

  } catch (err) {
    console.error('Student dashboard error:', err);
    res.status(500).json({ error: 'Error del servidor al recuperar datos del panel estudiantil.' });
  }
});

app.post('/api/student/update-profile', authenticateStudent, async (req, res) => {
  const { telefono, contrasena, edad } = req.body;
  const studentId = req.user.id;

  try {
    const updates = {};
    if (telefono) updates.telefono = telefono;
    if (edad) updates.edad = parseInt(edad, 10);
    if (contrasena) {
      if (contrasena.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      updates.contrasena = hashPassword(contrasena);
    }

    const updated = await db.update('usuarios', studentId, updates);
    if (!updated) return res.status(404).json({ error: 'Estudiante no encontrado.' });

    res.json({ success: true, message: 'Perfil estudiantil actualizado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el perfil.' });
  }
});

app.post('/api/student/notifications/:id/read', authenticateStudent, async (req, res) => {
  const notificationId = parseInt(req.params.id, 10);
  try {
    const updated = await db.update('notificaciones', notificationId, { leida: true });
    if (!updated) return res.status(404).json({ error: 'Notificación no encontrada.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al marcar la notificación como leída.' });
  }
});

// ==========================================
// PROTECTED ADMINISTRATOR CONTROL PANEL
// ==========================================

app.get('/api/admin/dashboard-stats', authenticateAdmin, async (req, res) => {
  try {
    const students = await db.select('usuarios');
    const courses = await db.select('cursos');
    const emails = await db.select('sent_emails');

    const totalCount = students.length;
    const pendingCount = students.filter(s => s.estado === 'PENDIENTE').length;
    const approvedCount = students.filter(s => s.estado === 'ACEPTADO').length;
    const rejectedCount = students.filter(s => s.estado === 'RECHAZADO').length;

    const enrollmentByCourse = courses.map(c => {
      const count = students.filter(s => {
        const ids = typeof s.cursos_ids === 'string' ? JSON.parse(s.cursos_ids) : (s.cursos_ids || []);
        return ids.includes(c.id) && s.estado === 'ACEPTADO';
      }).length;
      const pending = students.filter(s => {
        const ids = typeof s.cursos_ids === 'string' ? JSON.parse(s.cursos_ids) : (s.cursos_ids || []);
        return ids.includes(c.id) && s.estado === 'PENDIENTE';
      }).length;
      return { id: c.id, titulo: c.titulo, aceptados: count, pendientes: pending };
    });

    res.json({
      stats: { total: totalCount, pendientes: pendingCount, aceptados: approvedCount, rechazados: rejectedCount, cursos: courses.length, correosEnviados: emails.length },
      enrollmentByCourse
    });

  } catch (err) {
    res.status(500).json({ error: 'Error de servidor al compilar las estadísticas globales.' });
  }
});

app.get('/api/admin/students', authenticateAdmin, async (req, res) => {
  const { busqueda, curso_id, estado } = req.query;

  try {
    let students = await db.select('usuarios');
    const courses = await db.select('cursos');

    students = students.map(s => {
      const courseIds = typeof s.cursos_ids === 'string' ? JSON.parse(s.cursos_ids) : (s.cursos_ids || []);
      const studentCourses = courses.filter(c => courseIds.includes(c.id)).map(c => c.titulo);
      return { ...s, curso_titulo: studentCourses.length > 0 ? studentCourses.join(', ') : 'N/A' };
    });

    if (busqueda) {
      const term = busqueda.toLowerCase();
      students = students.filter(s => s.nombre.toLowerCase().includes(term) || s.documento.toLowerCase().includes(term) || s.correo.toLowerCase().includes(term));
    }

    if (curso_id) {
      const searchId = parseInt(curso_id, 10);
      students = students.filter(s => {
        const ids = typeof s.cursos_ids === 'string' ? JSON.parse(s.cursos_ids) : (s.cursos_ids || []);
        return ids.includes(searchId);
      });
    }
    if (estado) students = students.filter(s => s.estado === estado);

    students.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
    res.json(students);

  } catch (err) {
    res.status(500).json({ error: 'Error de servidor al recuperar la lista de alumnos.' });
  }
});

app.post('/api/admin/students/:id/approve', authenticateAdmin, async (req, res) => {
  const studentId = parseInt(req.params.id, 10);

  try {
    const student = await db.selectOne('usuarios', u => u.id === studentId);
    if (!student) return res.status(404).json({ error: 'Estudiante no registrado.' });
    if (student.estado === 'ACEPTADO') return res.status(400).json({ error: 'El estudiante ya se encuentra aceptado en el sistema.' });

    const courseIds = typeof student.cursos_ids === 'string' ? JSON.parse(student.cursos_ids) : (student.cursos_ids || []);
    const enrolledCourses = await db.select('cursos', c => courseIds.includes(c.id));
    const courseName = enrolledCourses.length > 0 ? enrolledCourses.map(c => c.titulo).join(', ') : 'Especialización Tecnológica';

    const cleanName = student.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
    const uniqueSuffix = Math.floor(100 + Math.random() * 900);
    const generatedUsername = `${cleanName.substring(0, 8)}_${uniqueSuffix}`;
    
    const adjectives = ['Quantum', 'Cyber', 'Deep', 'Neural', 'Matrix', 'Vector', 'Gen', 'Logic'];
    const nouns = ['Node', 'AI', 'Core', 'Link', 'Flow', 'Grid', 'Hash', 'Tech'];
    const generatedPassword = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${uniqueSuffix}!`;

    const updatedStudent = await db.update('usuarios', studentId, {
      estado: 'ACEPTADO',
      usuario_acceso: generatedUsername,
      contrasena_acceso: generatedPassword
    });

    await db.insert('notificaciones', {
      usuario_id: studentId,
      titulo: '¡Admisión Oficial Aprobada!',
      mensaje: `Felicidades, has sido aceptado en Infinity Tech University. Cursarás: "${courseName}". Tus credenciales académicas son: Usuario: ${generatedUsername} | Contraseña: ${generatedPassword}.`,
      leida: false
    });

    const emailResult = await sendAdmissionEmail({
      to: student.correo, subject: 'Carta de Admisión Oficial - Infinity Tech University',
      studentName: student.nombre, courseName: courseName, username: generatedUsername, password: generatedPassword
    });

    res.json({
      success: true, message: 'Estudiante aprobado exitosamente y credenciales despachadas.',
      emailMode: emailResult.mode, credentials: { usuario_acceso: generatedUsername, contrasena_acceso: generatedPassword }
    });

  } catch (err) {
    console.error('Approval Error:', err);
    res.status(500).json({ error: 'Error crítico de servidor durante el proceso de aprobación.' });
  }
});

app.post('/api/admin/students/:id/reject', authenticateAdmin, async (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  try {
    const student = await db.selectOne('usuarios', u => u.id === studentId);
    if (!student) return res.status(404).json({ error: 'Estudiante no registrado.' });

    await db.update('usuarios', studentId, { estado: 'RECHAZADO', usuario_acceso: null, contrasena_acceso: null });
    res.json({ success: true, message: 'La postulación académica ha sido marcada como rechazada.' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor al rechazar la postulación.' });
  }
});

app.delete('/api/admin/students/:id', authenticateAdmin, async (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  try {
    const deleted = await db.delete('usuarios', studentId);
    if (!deleted) return res.status(404).json({ error: 'Estudiante no encontrado en el sistema.' });

    // Notificaciones borradas en cascada por ON DELETE CASCADE en Postgres.
    res.json({ success: true, message: 'Expediente y cuenta del alumno removidos en su totalidad.' });
  } catch (err) {
    res.status(500).json({ error: 'Error de servidor al eliminar el estudiante.' });
  }
});

app.post('/api/admin/courses', authenticateAdmin, async (req, res) => {
  const { titulo, descripcion, duracion, modalidad, dificultad, imagen, temas, perfil, aplicaciones, tecnologias } = req.body;

  if (!titulo || !descripcion || !duracion || !modalidad || !dificultad) {
    return res.status(400).json({ error: 'Complete los campos obligatorios del curso.' });
  }

  try {
    const newCourse = await db.insert('cursos', {
      titulo, descripcion, duracion, modalidad, dificultad,
      imagen: imagen || 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80',
      temas: Array.isArray(temas) ? temas : [temas].filter(Boolean),
      perfil: perfil || 'No especificado.',
      aplicaciones: Array.isArray(aplicaciones) ? aplicaciones : [aplicaciones].filter(Boolean),
      tecnologias: Array.isArray(tecnologias) ? tecnologias : [tecnologias].filter(Boolean)
    });

    const defaultModules = [
      { curso_id: newCourse.id, orden: 1, titulo: `Módulo 1: Introducción a ${titulo}`, descripcion: 'Conceptos fundamentales iniciales y configuración de software.' },
      { curso_id: newCourse.id, orden: 2, titulo: 'Módulo 2: Arquitectura del Sistema', descripcion: 'Modelado analítico y estructuración de algoritmos primarios.' },
      { curso_id: newCourse.id, orden: 3, titulo: 'Módulo 3: Prácticas Guiadas de Código', descripcion: 'Desarrollo interactivo en consola y manejo de dependencias.' }
    ];

    for (const m of defaultModules) {
      await db.insert('modulos', m);
    }

    res.status(201).json({ success: true, message: 'Curso creado con éxito junto con sus módulos por defecto.', course: newCourse });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar el nuevo curso.' });
  }
});

app.put('/api/admin/courses/:id', authenticateAdmin, async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const updates = req.body;

  try {
    const course = await db.selectOne('cursos', c => c.id === courseId);
    if (!course) return res.status(404).json({ error: 'Curso no encontrado.' });

    const updated = await db.update('cursos', courseId, updates);
    res.json({ success: true, message: 'Información académica del curso actualizada correctamente.', course: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error al modificar la información del curso.' });
  }
});

app.get('/api/admin/emails', authenticateAdmin, async (req, res) => {
  try {
    const emails = await db.select('sent_emails');
    res.json(emails.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer el archivo del buzón virtual.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// START SERVER PROCESS
// ==========================================
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`⚡  INFINITY TECH UNIVERSITY CORE RUNNING ON PORT ${PORT}  ⚡`);
  console.log(`🔗  Local Campus Address: http://localhost:${PORT}`);
  console.log(`🔒  Secure Encryption Hashing Engine: ONLINE`);
  console.log(`📊  PostgreSQL Database Connection Pool: READY`);
  console.log(`======================================================\n`);
});
