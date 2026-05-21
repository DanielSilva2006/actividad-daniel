// ==========================================
// SPA APPLICATION CONTROLLER & CLIENT
// ==========================================
const API_URL = ''; // Relative path, binds directly to local port

const appState = {
  token: localStorage.getItem('fit_auth_token') || null,
  role: localStorage.getItem('fit_auth_role') || null, // 'student' or 'admin'
  courses: [],
  studentData: null,
  adminData: {
    stats: null,
    students: [],
    emails: []
  }
};

// ==========================================
// API COMMUNICATOR UTILITY
// ==========================================
async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (appState.token) {
    headers['Authorization'] = `Bearer ${appState.token}`;
  }

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ocurrió un error inesperado en la red.');
    }
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ==========================================
// CLIENT VIEW ROUTER (SPA VISIBILITY)
// ==========================================
function navigateTo(view) {
  // Hide all primary layout sections
  document.getElementById('home-section').style.display = 'none';
  document.getElementById('student-dashboard-section').style.display = 'none';
  document.getElementById('admin-dashboard-section').style.display = 'none';

  // Clear scroll position
  window.scrollTo(0, 0);

  // Activate navbar links
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  if (view === 'home') {
    document.getElementById('home-section').style.display = 'block';
    document.querySelector('header').style.display = 'block';
    document.querySelector('.nav-link[data-nav="home"]').classList.add('active');
    loadHomeCourses();
  } else if (view === 'student') {
    document.getElementById('student-dashboard-section').style.display = 'block';
    document.querySelector('header').style.display = 'none';
    loadStudentDashboard();
  } else if (view === 'admin') {
    document.getElementById('admin-dashboard-section').style.display = 'block';
    document.querySelector('header').style.display = 'none';
    loadAdminDashboard();
  }
}

// ==========================================
// HOME: LOAD COURSES DYNAMICALLY
// ==========================================
async function loadHomeCourses() {
  try {
    const courses = await apiRequest('/api/courses');
    appState.courses = courses;
    
    // Fill Registration Form Checkboxes
    const checkboxContainer = document.getElementById('reg-cursos-container');
    if (checkboxContainer) {
      checkboxContainer.innerHTML = '';
      courses.forEach(c => {
        const label = document.createElement('label');
        label.style.cssText = 'display:flex; align-items:center; gap:10px; padding:12px 18px; border-radius:10px; border:1px solid var(--border-light); cursor:pointer; transition:all 0.3s ease; flex:1; min-width:200px; background:rgba(255,255,255,0.03);';
        label.innerHTML = `
          <input type="checkbox" name="reg-cursos" value="${c.id}" style="width:20px; height:20px; accent-color:var(--secondary); cursor:pointer;">
          <div>
            <strong style="display:block; color:var(--text-main); font-size:14px;">${c.titulo}</strong>
            <span style="font-size:12px; color:var(--text-muted);">${c.dificultad} · ${c.duracion}</span>
          </div>
        `;
        // Hover effect
        label.addEventListener('mouseenter', () => { label.style.borderColor = 'var(--secondary)'; label.style.background = 'rgba(6,182,212,0.05)'; });
        label.addEventListener('mouseleave', () => { 
          const cb = label.querySelector('input');
          if (!cb.checked) { label.style.borderColor = 'var(--border-light)'; label.style.background = 'rgba(255,255,255,0.03)'; }
        });
        // Checked style
        const cb = label.querySelector('input');
        cb.addEventListener('change', () => {
          if (cb.checked) { label.style.borderColor = 'var(--secondary)'; label.style.background = 'rgba(6,182,212,0.08)'; }
          else { label.style.borderColor = 'var(--border-light)'; label.style.background = 'rgba(255,255,255,0.03)'; }
        });
        checkboxContainer.appendChild(label);
      });
    }

    // Fill Admin Filters selector options
    const adminFilterSelect = document.getElementById('admin-filter-curso');
    if (adminFilterSelect) {
      adminFilterSelect.innerHTML = '<option value="">Todos los cursos</option>';
      courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.titulo;
        adminFilterSelect.appendChild(opt);
      });
    }

    // Fill Home courses list
    const grid = document.getElementById('courses-grid-list');
    if (!grid) return;
    grid.innerHTML = '';

    courses.forEach(c => {
      // Build tech tags list
      const techTagsHtml = c.tecnologias.map(t => `<span class="tech-tag">${t}</span>`).join('');
      // Build themes list
      const themesHtml = c.temas.map(t => `
        <div class="accordion-item glass-panel">
          <div class="accordion-header">
            <span>🔹 ${t}</span>
            <span>+</span>
          </div>
          <div class="accordion-body">
            Desarrollo práctico y modelado predictivo interactivo enfocado en este tema mediante guías avanzadas en Python.
          </div>
        </div>
      `).join('');

      const card = document.createElement('div');
      card.className = 'course-card glass-panel';
      card.innerHTML = `
        <div class="course-img">
          <img src="${c.imagen}" alt="${c.titulo}">
          <span class="course-badge">${c.dificultad}</span>
        </div>
        <div class="course-content">
          <h3>${c.titulo}</h3>
          <p class="course-desc">${c.descripcion}</p>
          
          <div class="course-meta">
            <div class="course-meta-item">
              <strong>Duración</strong>
              <span>${c.duracion}</span>
            </div>
            <div class="course-meta-item">
              <strong>Modalidad</strong>
              <span>${c.modalidad}</span>
            </div>
          </div>

          <h4 style="font-family:'Rajdhani'; font-size:16px; margin-bottom:12px; color:var(--secondary); text-transform:uppercase;">Temario y Módulos:</h4>
          <div class="modules-accordion" style="margin-bottom: 25px;">
            ${themesHtml}
          </div>

          <h4 style="font-family:'Rajdhani'; font-size:16px; margin-bottom:12px; color:var(--secondary); text-transform:uppercase;">Perfil del Egresado:</h4>
          <p class="course-desc" style="font-size:13.5px; line-height:1.5; margin-bottom:20px;">${c.perfil}</p>

          <h4 style="font-family:'Rajdhani'; font-size:16px; margin-bottom:12px; color:var(--secondary); text-transform:uppercase;">Aplicaciones Reales:</h4>
          <ul style="list-style:none; padding-left:0; margin-bottom:25px; font-size:13.5px; color:var(--text-muted);">
            ${c.aplicaciones.map(a => `<li style="margin-bottom:6px;">🚀 ${a}</li>`).join('')}
          </ul>

          <div class="course-tech-list">
            ${techTagsHtml}
          </div>

          <div class="course-actions">
            <button class="btn btn-primary" onclick="openRegisterModal(${c.id})" style="flex-grow:1;">Inscribirse Ahora</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

  } catch (err) {
    showToast('No se pudieron conectar los cursos del campus.', 'error');
  }
}

// ==========================================
// REGISTRATION FORM LOGIC & VALIDATION
// ==========================================
function initRegistrationValidation() {
  const pwdInput = document.getElementById('reg-contrasena');
  const pwdConfirmInput = document.getElementById('reg-contrasena-confirm');
  const strengthFill = document.getElementById('pwd-strength-fill');
  
  if (!pwdInput || !strengthFill) return;

  // Real-time password strength indicator
  pwdInput.addEventListener('input', () => {
    const pwd = pwdInput.value;
    let strength = 0;
    
    if (pwd.length >= 6) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 25;

    strengthFill.style.width = `${strength}%`;
    
    if (strength <= 25) {
      strengthFill.style.backgroundColor = 'var(--danger)';
    } else if (strength <= 75) {
      strengthFill.style.backgroundColor = 'var(--warning)';
    } else {
      strengthFill.style.backgroundColor = 'var(--success)';
    }
  });

  // Submit Handler
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('reg-nombre').value.trim();
    const documento = document.getElementById('reg-documento').value.trim();
    const correo = document.getElementById('reg-correo').value.trim();
    const telefono = document.getElementById('reg-telefono').value.trim();
    const edad = document.getElementById('reg-edad').value.trim();
    const pais = document.getElementById('reg-pais').value.trim();
    const contrasena = pwdInput.value;
    const contrasenaConfirm = pwdConfirmInput.value;
    const checkedBoxes = document.querySelectorAll('input[name="reg-cursos"]:checked');
    const cursos_ids = Array.from(checkedBoxes).map(cb => parseInt(cb.value, 10));

    // Field Checks
    if (!nombre || !documento || !correo || !telefono || !edad || !pais || !contrasena || cursos_ids.length === 0) {
      showToast('Por favor, rellene todos los campos y seleccione al menos un curso.', 'error');
      return;
    }

    // Gmail Regex
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(correo)) {
      showToast('Debe proporcionar un correo electrónico @gmail.com válido.', 'error');
      return;
    }

    // Password Match
    if (contrasena !== contrasenaConfirm) {
      showToast('Las contraseñas no coinciden.', 'error');
      return;
    }

    if (contrasena.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    try {
      const res = await apiRequest('/api/auth/register', 'POST', {
        nombre,
        documento,
        correo,
        telefono,
        edad: parseInt(edad, 10),
        pais,
        contrasena,
        cursos_ids
      });

      if (res.success) {
        showToast(res.message, 'success');
        closeAllModals();
        form.reset();
        strengthFill.style.width = '0%';
        
        // Show pending alert info dialogue
        setTimeout(() => {
          alert(`¡Postulación Recibida!\n\nTu registro ha sido enviado exitosamente al Comité de Admisión de Infinity Tech University.\n\nSe ha enviado una confirmación inicial a ${correo}. Una vez que el Administrador evalúe tu perfil, recibirás un correo con tus credenciales oficiales de acceso.`);
        }, 500);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ==========================================
// LOGIN DISPATCHER (STUDENT & ADMIN)
// ==========================================
function initLoginHandler() {
  const form = document.getElementById('login-form');
  const isAdminCheckbox = document.getElementById('login-is-admin');
  
  if (!form) return;

  // Toggle visual elements based on admin role select
  isAdminCheckbox.addEventListener('change', () => {
    const title = document.querySelector('#login-modal .modal-header h3');
    const label = document.getElementById('login-identificador-label');
    const input = document.getElementById('login-identificador');
    const registerFooter = document.getElementById('login-footer-register');

    if (isAdminCheckbox.checked) {
      title.textContent = 'CAMPUS ADMIN';
      label.textContent = 'USUARIO ADMINISTRADOR';
      input.placeholder = 'Ingrese su usuario admin...';
      registerFooter.style.display = 'none';
    } else {
      title.textContent = 'CAMPUS LOGIN';
      label.textContent = 'CORREO GMAIL / USUARIO ASIGNADO';
      input.placeholder = 'ejemplo@gmail.com o usuario_fit...';
      registerFooter.style.display = 'block';
    }
  });

  // Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identificador = document.getElementById('login-identificador').value.trim();
    const contrasena = document.getElementById('login-contrasena').value;
    const isAdmin = isAdminCheckbox.checked;

    if (!identificador || !contrasena) {
      showToast('Por favor ingrese sus datos de acceso.', 'error');
      return;
    }

    const endpoint = isAdmin ? '/api/auth/login-admin' : '/api/auth/login';
    const payload = isAdmin 
      ? { usuario: identificador, contrasena } 
      : { identificador, contrasena };

    try {
      const res = await apiRequest(endpoint, 'POST', payload);
      
      if (res.success) {
        showToast('¡Sesión iniciada exitosamente!', 'success');
        
        // Cache session credentials
        appState.token = res.token;
        appState.role = isAdmin ? 'admin' : 'student';
        localStorage.setItem('fit_auth_token', res.token);
        localStorage.setItem('fit_auth_role', appState.role);

        closeAllModals();
        form.reset();

        // Redirect to corresponding panel
        if (appState.role === 'admin') {
          navigateTo('admin');
        } else {
          navigateTo('student');
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// Password recovery mock trigger
function triggerPasswordRecovery() {
  const email = prompt("Por favor ingrese su dirección de correo electrónico registrada para enviarle instrucciones:");
  if (!email) return;

  apiRequest('/api/auth/recover-password', 'POST', { correo: email })
    .then(res => {
      showToast(res.message, 'success');
    })
    .catch(err => {
      showToast(err.message, 'error');
    });
}

// ==========================================
// STUDENT PANEL RENDER ENGINE
// ==========================================
async function loadStudentDashboard() {
  try {
    const data = await apiRequest('/api/student/dashboard');
    appState.studentData = data;

    // Prefill sidebar info
    const init = data.student.nombre.charAt(0).toUpperCase();
    document.getElementById('student-avatar-letter').textContent = init;
    document.getElementById('student-sidebar-name').textContent = data.student.nombre;
    
    // Welcome Header
    document.getElementById('student-welcome-title').innerHTML = `¡Bienvenido, Académico <span style="color:var(--secondary);">${data.student.nombre}</span>!`;

    // Active course banner
    const courseTitleEl = document.getElementById('student-course-title');
    const courseDescEl = document.getElementById('student-course-desc');
    const courseDurationEl = document.getElementById('student-course-duration');
    const courseModalidadEl = document.getElementById('student-course-modalidad');
    
    if (data.courses && data.courses.length > 0) {
      const courseNames = data.courses.map(c => c.titulo).join(' + ');
      courseTitleEl.textContent = courseNames.toUpperCase();
      courseDescEl.textContent = data.courses.map(c => c.descripcion).join(' | ');
      courseDurationEl.textContent = data.courses.map(c => c.duracion).join(' / ');
      courseModalidadEl.textContent = data.courses[0].modalidad;
    }

    // Dynamic Syllabus/Modules List Checklist
    const syllabusList = document.getElementById('student-modules-checklist');
    syllabusList.innerHTML = '';
    
    if (data.modules.length === 0) {
      syllabusList.innerHTML = '<li class="glass-panel" style="padding:15px; text-align:center;">No hay módulos registrados en tus cursos.</li>';
    } else {
      // Pull completed modules cache from local storage so student can tick off lessons!
      const completedModules = JSON.parse(localStorage.getItem(`fit_completed_${data.student.id}`) || '[]');

      // Group modules by course
      if (data.courses && data.courses.length > 0) {
        data.courses.forEach(course => {
          const courseModules = data.modules.filter(m => m.curso_id === course.id);
          if (courseModules.length === 0) return;

          // Course section header
          const courseHeader = document.createElement('li');
          courseHeader.style.cssText = 'list-style:none; margin-bottom:8px; margin-top:20px; padding:12px 20px; background:linear-gradient(135deg, rgba(6,182,212,0.1), rgba(124,58,237,0.1)); border-radius:10px; border-left:4px solid var(--secondary);';
          courseHeader.innerHTML = `<strong style="font-family:'Rajdhani'; font-size:18px; color:var(--secondary); text-transform:uppercase;"><i class="fa-solid fa-book"></i> ${course.titulo}</strong>`;
          syllabusList.appendChild(courseHeader);

          courseModules.forEach(m => {
            const isChecked = completedModules.includes(m.id) ? 'checked' : '';
            const item = document.createElement('li');
            item.className = 'glass-panel';
            item.style.cssText = 'padding:15px 20px; margin-bottom:12px; display:flex; align-items:center; gap:15px; list-style:none;';
            item.innerHTML = `
              <input type="checkbox" id="module-check-${m.id}" data-mid="${m.id}" ${isChecked} 
                     style="width:20px; height:20px; accent-color:var(--secondary); cursor:pointer;" 
                     onchange="toggleModuleCheck(this, ${data.student.id})">
              <label for="module-check-${m.id}" style="cursor:pointer; flex-grow:1;">
                <strong style="display:block; color:var(--text-main); font-size:15px;">${m.titulo}</strong>
                <span style="color:var(--text-muted); font-size:13px; line-height:1.4; display:block; margin-top:4px;">${m.descripcion}</span>
              </label>
            `;
            syllabusList.appendChild(item);
          });
        });
      } else {
        // Fallback: render modules without grouping
        data.modules.forEach(m => {
          const isChecked = completedModules.includes(m.id) ? 'checked' : '';
          const item = document.createElement('li');
          item.className = 'glass-panel';
          item.style.cssText = 'padding:15px 20px; margin-bottom:12px; display:flex; align-items:center; gap:15px; list-style:none;';
          item.innerHTML = `
            <input type="checkbox" id="module-check-${m.id}" data-mid="${m.id}" ${isChecked} 
                   style="width:20px; height:20px; accent-color:var(--secondary); cursor:pointer;" 
                   onchange="toggleModuleCheck(this, ${data.student.id})">
            <label for="module-check-${m.id}" style="cursor:pointer; flex-grow:1;">
              <strong style="display:block; color:var(--text-main); font-size:15px;">${m.titulo}</strong>
              <span style="color:var(--text-muted); font-size:13px; line-height:1.4; display:block; margin-top:4px;">${m.descripcion}</span>
            </label>
          `;
          syllabusList.appendChild(item);
        });
      }
    }

    // Populate Account Setup Forms fields
    document.getElementById('student-profile-name').textContent = data.student.nombre;
    document.getElementById('student-profile-doc').textContent = data.student.documento;
    document.getElementById('student-profile-email').textContent = data.student.correo;
    document.getElementById('student-profile-age').textContent = `${data.student.edad} Años`;
    document.getElementById('student-profile-country').textContent = data.student.pais;

    document.getElementById('student-setup-phone').value = data.student.telefono || '';
    document.getElementById('student-setup-age').value = data.student.edad || '';

    // Populate dynamic student notifications tray
    const notifBellBadge = document.getElementById('student-notif-badge');
    const notifTrayList = document.getElementById('student-notifications-list');
    notifTrayList.innerHTML = '';

    const unreadCount = data.notifications.filter(n => !n.leida).length;
    if (unreadCount > 0) {
      notifBellBadge.style.display = 'flex';
      notifBellBadge.textContent = unreadCount;
    } else {
      notifBellBadge.style.display = 'none';
    }

    if (data.notifications.length === 0) {
      notifTrayList.innerHTML = '<div style="padding:15px; text-align:center; color:var(--text-muted); font-size:13px;">No hay notificaciones académicas.</div>';
    } else {
      data.notifications.forEach(n => {
        const item = document.createElement('div');
        item.className = `notification-item ${!n.leida ? 'unread' : ''}`;
        item.innerHTML = `
          <div style="font-weight:700; margin-bottom:4px; color:var(--text-main);">${n.titulo}</div>
          <div style="color:var(--text-muted); margin-bottom:6px; line-height:1.3;">${n.mensaje}</div>
          <div style="font-size:11px; color:var(--secondary);">${new Date(n.creado_en).toLocaleString()}</div>
        `;
        
        // Click to read trigger
        if (!n.leida) {
          item.addEventListener('click', () => markNotificationRead(n.id));
        }

        notifTrayList.appendChild(item);
      });
    }

  } catch (err) {
    showToast('Sesión inválida o expirada en el Campus.', 'error');
    logout();
  }
}

// Module checklist tracker handler
function toggleModuleCheck(checkbox, studentId) {
  const mid = parseInt(checkbox.getAttribute('data-mid'), 10);
  let completed = JSON.parse(localStorage.getItem(`fit_completed_${studentId}`) || '[]');

  if (checkbox.checked) {
    if (!completed.includes(mid)) completed.push(mid);
    showToast('¡Módulo marcado como completado! Buen progreso.', 'success');
  } else {
    completed = completed.filter(id => id !== mid);
    showToast('Módulo desmarcado.', 'info');
  }

  localStorage.setItem(`fit_completed_${studentId}`, JSON.stringify(completed));
}

// Mark student notification read
async function markNotificationRead(id) {
  try {
    const res = await apiRequest(`/api/student/notifications/${id}/read`, 'POST');
    if (res.success) {
      loadStudentDashboard(); // reload dashboard datasets
    }
  } catch (err) {
    console.error(err);
  }
}

// Student configuration update submit handler
async function handleStudentSetupSubmit(e) {
  e.preventDefault();
  const telefono = document.getElementById('student-setup-phone').value.trim();
  const edad = document.getElementById('student-setup-age').value.trim();
  const password = document.getElementById('student-setup-pwd').value;
  const passwordConfirm = document.getElementById('student-setup-pwd-confirm').value;

  if (password && password !== passwordConfirm) {
    showToast('Las contraseñas de configuración no coinciden.', 'error');
    return;
  }

  const payload = {};
  if (telefono) payload.telefono = telefono;
  if (edad) payload.edad = parseInt(edad, 10);
  if (password) payload.contrasena = password;

  try {
    const res = await apiRequest('/api/student/update-profile', 'POST', payload);
    if (res.success) {
      showToast(res.message, 'success');
      document.getElementById('student-setup-pwd').value = '';
      document.getElementById('student-setup-pwd-confirm').value = '';
      loadStudentDashboard();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Toggle student notifications dropdown pane
function toggleStudentNotifDropdown() {
  const dropdown = document.getElementById('student-notif-dropdown');
  dropdown.classList.toggle('active');
}

// ==========================================
// ADMINISTRATOR PANEL RENDER ENGINE
// ==========================================
async function loadAdminDashboard() {
  try {
    // 1. Fetch dashboard stats
    const statsData = await apiRequest('/api/admin/dashboard-stats');
    appState.adminData.stats = statsData.stats;

    // Prefill Admin Global stats visual metrics cards
    document.getElementById('admin-stat-total').textContent = statsData.stats.total;
    document.getElementById('admin-stat-pendientes').textContent = statsData.stats.pendientes;
    document.getElementById('admin-stat-aceptados').textContent = statsData.stats.aceptados;
    document.getElementById('admin-stat-correos').textContent = statsData.stats.correosEnviados;

    // RENDER INTERACTIVE STATISTICAL CHART BARS
    const chartContainer = document.getElementById('admin-chart-bars');
    chartContainer.innerHTML = '';

    statsData.enrollmentByCourse.forEach(c => {
      // Math percentage calculation
      const total = statsData.stats.aceptados + statsData.stats.pendientes;
      const percentage = total > 0 ? ((c.aceptados + c.pendientes) / total) * 100 : 0;

      const row = document.createElement('div');
      row.className = 'chart-row';
      row.innerHTML = `
        <span class="chart-label">${c.titulo}</span>
        <div class="chart-track">
          <div class="chart-fill" style="width: 0%;" id="chart-fill-course-${c.id}"></div>
        </div>
        <span class="chart-value">${c.aceptados} Act. / ${c.pendientes} Pend.</span>
      `;
      chartContainer.appendChild(row);

      // Trigger width fill with transition
      setTimeout(() => {
        const fill = document.getElementById(`chart-fill-course-${c.id}`);
        if (fill) fill.style.width = `${percentage || 5}%`; // Minimum visual width
      }, 100);
    });

    // 2. Fetch students list roster (applies search parameters)
    await loadAdminStudentsList();

    // 3. Fetch Virtual Sent Mail logs list
    await loadAdminEmailsInbox();

  } catch (err) {
    showToast('Fallo al recuperar la información del Panel Administrativo.', 'error');
    logout();
  }
}

// Fetch and render student roster table in admin panel
async function loadAdminStudentsList() {
  const busqueda = document.getElementById('admin-search-student').value.trim();
  const curso_id = document.getElementById('admin-filter-curso').value;
  const estado = document.getElementById('admin-filter-estado').value;

  let queryUrl = '/api/admin/students?';
  if (busqueda) queryUrl += `busqueda=${encodeURIComponent(busqueda)}&`;
  if (curso_id) queryUrl += `curso_id=${curso_id}&`;
  if (estado) queryUrl += `estado=${estado}&`;

  try {
    const students = await apiRequest(queryUrl);
    appState.adminData.students = students;

    const tbody = document.getElementById('admin-students-table-body');
    tbody.innerHTML = '';

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">Ningún expediente académico coincide con los criterios.</td></tr>`;
      return;
    }

    students.forEach(s => {
      const row = document.createElement('tr');
      
      // Status badge template
      let badgeClass = 'pendiente';
      if (s.estado === 'ACEPTADO') badgeClass = 'aceptado';
      if (s.estado === 'RECHAZADO') badgeClass = 'rechazado';

      // Access Credentials visual text block
      let credsHtml = '<span style="color:var(--text-muted); font-size:12px;">No generadas</span>';
      if (s.estado === 'ACEPTADO') {
        credsHtml = `
          <div style="font-family:'Courier New', monospace; font-size:12px;">
            👤 ${s.usuario_acceso}<br>
            🔑 ${s.contrasena_acceso}
          </div>
        `;
      }

      // Actions buttons set based on admission state
      let actionsHtml = '';
      if (s.estado === 'PENDIENTE') {
        actionsHtml = `
          <button class="btn btn-primary" onclick="approveStudent(${s.id})" style="padding: 6px 14px; font-size:12px; border-radius: 6px; margin-right:5px;">Aprobar</button>
          <button class="btn btn-secondary" onclick="rejectStudent(${s.id})" style="padding: 6px 14px; font-size:12px; border-radius: 6px; margin-right:5px; color:var(--warning); border-color:var(--warning);">Rechazar</button>
        `;
      }
      // Every profile can be deleted from logs
      actionsHtml += `
        <button class="btn btn-danger" onclick="deleteStudent(${s.id})" style="padding: 6px 14px; font-size:12px; border-radius: 6px;">Eliminar</button>
      `;

      row.innerHTML = `
        <td>
          <strong style="display:block; color:var(--text-main);">${s.nombre}</strong>
          <span style="font-size:12px; color:var(--text-muted);">${s.correo}</span>
        </td>
        <td>${s.documento}</td>
        <td>${s.pais}<br><span style="font-size:12px; color:var(--text-muted);">${s.telefono}</span></td>
        <td>${s.edad} Años</td>
        <td><strong style="color:var(--secondary);">${s.curso_titulo}</strong></td>
        <td><span class="badge-status ${badgeClass}">${s.estado}</span></td>
        <td>${credsHtml}</td>
        <td>
          <div style="display:flex; align-items:center;">
            ${actionsHtml}
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

  } catch (err) {
    showToast('Error al cargar la lista de alumnos.', 'error');
  }
}

// Student Approval API trigger
async function approveStudent(id) {
  if (!confirm('¿Desea aprobar oficialmente esta postulación académica?\n\nEsto cambiará el estado a ACEPTADO, generará credenciales aleatorias seguras y enviará la carta de admisión por correo.')) return;

  showToast('Procesando admisión académica y enviando correo...', 'info');

  try {
    const res = await apiRequest(`/api/admin/students/${id}/approve`, 'POST');
    if (res.success) {
      showToast(`¡Estudiante admitido! Carta enviada vía ${res.emailMode.toUpperCase()}`, 'success');
      loadAdminDashboard(); // Reload statistics and tables
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Student Rejection API trigger
async function rejectStudent(id) {
  if (!confirm('¿Desea marcar esta postulación académica como RECHAZADA?\nEl postulante no podrá acceder al campus.')) return;

  try {
    const res = await apiRequest(`/api/admin/students/${id}/reject`, 'POST');
    if (res.success) {
      showToast('Postulación rechazada.', 'warning');
      loadAdminDashboard();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Student Record Deletion API trigger
async function deleteStudent(id) {
  if (!confirm('🚨 ADVERTENCIA CRÍTICA 🚨\n\n¿Está absolutamente seguro de eliminar permanentemente este expediente estudiantil?\nEsta acción es irreversible y removerá todo historial académico y accesos del alumno.')) return;

  try {
    const res = await apiRequest(`/api/admin/students/${id}`, 'DELETE');
    if (res.success) {
      showToast(res.message, 'success');
      loadAdminDashboard();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Fetch virtual mailbox logs
async function loadAdminEmailsInbox() {
  try {
    const emails = await apiRequest('/api/admin/emails');
    appState.adminData.emails = emails;

    const list = document.getElementById('admin-mails-inbox-list');
    list.innerHTML = '';

    if (emails.length === 0) {
      list.innerHTML = `<div class="glass-panel" style="padding:20px; text-align:center; color:var(--text-muted); font-size:13.5px;">El buzón virtual está vacío. Los correos despachados aparecerán aquí.</div>`;
      return;
    }

    emails.forEach(e => {
      const card = document.createElement('div');
      card.className = 'mail-card glass-panel';
      card.style.marginBottom = '12px';
      card.innerHTML = `
        <div class="mail-card-header">
          <span><strong>De:</strong> admisiones@infinitytech.edu.ve</span>
          <span><strong>Fecha:</strong> ${new Date(e.fecha).toLocaleString()}</span>
        </div>
        <div class="mail-card-subject">Asunto: ${e.asunto}</div>
        <div class="mail-card-body-preview" style="margin-top:5px;">
          <strong>Para:</strong> ${e.para} (${e.estudiante}) | <strong>Curso:</strong> ${e.curso}<br>
          <span style="font-size:12px; color:var(--secondary);">[Haga clic aquí para visualizar la carta de admisión premium enviada]</span>
        </div>
      `;

      // Click to trigger iframe visualizer modal popup!
      card.addEventListener('click', () => openEmailVisualizerModal(e.html));

      list.appendChild(card);
    });

  } catch (err) {
    console.error('Error fetching sent emails list:', err);
  }
}

// Open HTML email in iframe inside a custom modal
function openEmailVisualizerModal(htmlContent) {
  const modal = document.getElementById('email-visualizer-modal');
  const iframe = document.getElementById('email-iframe-viewer');
  
  if (!modal || !iframe) return;

  // Set HTML content inside the iframe sandbox
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  modal.classList.add('active');
}

// Close email viewer modal
function closeEmailVisualizerModal() {
  document.getElementById('email-visualizer-modal').classList.remove('active');
}

// Create new course dynamic submit handler
async function handleCourseCreatorSubmit(e) {
  e.preventDefault();
  
  const titulo = document.getElementById('course-create-titulo').value.trim();
  const descripcion = document.getElementById('course-create-desc').value.trim();
  const duracion = document.getElementById('course-create-duracion').value.trim();
  const modalidad = document.getElementById('course-create-modalidad').value;
  const dificultad = document.getElementById('course-create-dificultad').value;
  const imagen = document.getElementById('course-create-img').value.trim();
  const perfil = document.getElementById('course-create-perfil').value.trim();
  const temas = document.getElementById('course-create-temas').value.split(',').map(t => t.trim()).filter(Boolean);
  const aplicaciones = document.getElementById('course-create-apps').value.split(',').map(a => a.trim()).filter(Boolean);
  const tecnologias = document.getElementById('course-create-techs').value.split(',').map(t => t.trim()).filter(Boolean);

  if (!titulo || !descripcion || !duracion || !modalidad || !dificultad) {
    showToast('Rellene los campos obligatorios del curso.', 'error');
    return;
  }

  const payload = {
    titulo,
    descripcion,
    duracion,
    modalidad,
    dificultad,
    imagen,
    perfil,
    temas,
    aplicaciones,
    tecnologias
  };

  try {
    const res = await apiRequest('/api/admin/courses', 'POST', payload);
    if (res.success) {
      showToast(res.message, 'success');
      document.getElementById('course-create-form').reset();
      loadAdminDashboard(); // Reload statistics
      showToast('¡El nuevo curso y sus módulos ya están disponibles en el Home!', 'success');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// SESSION MANAGEMENT (LOGOUT & INIT)
// ==========================================
function logout() {
  appState.token = null;
  appState.role = null;
  appState.studentData = null;
  localStorage.removeItem('fit_auth_token');
  localStorage.removeItem('fit_auth_role');
  
  showToast('Sesión cerrada correctamente. Volviendo al Home.', 'info');
  navigateTo('home');
}

// Setup Event Listeners
function initEventListeners() {
  // Navigation links routing listeners
  document.querySelectorAll('.nav-link').forEach(l => {
    l.addEventListener('click', (e) => {
      e.preventDefault();
      const target = l.getAttribute('data-nav');
      if (target === 'home') {
        navigateTo('home');
      } else {
        // Handle login modal opening if click other pages without session
        if (!appState.token) {
          openLoginModal();
        } else {
          navigateTo(appState.role === 'admin' ? 'admin' : 'student');
        }
      }
    });
  });

  // Forms submit bindings
  const studentForm = document.getElementById('student-setup-form');
  if (studentForm) studentForm.addEventListener('submit', handleStudentSetupSubmit);

  const courseForm = document.getElementById('course-create-form');
  if (courseForm) courseForm.addEventListener('submit', handleCourseCreatorSubmit);
}

// Initialize Active Session or fallback to Home
function initSession() {
  initEventListeners();
  
  if (appState.token && appState.role) {
    navigateTo(appState.role === 'admin' ? 'admin' : 'student');
  } else {
    navigateTo('home');
  }
}

// Make functions globally executable
window.logout = logout;
window.navigateTo = navigateTo;
window.triggerPasswordRecovery = triggerPasswordRecovery;
window.toggleStudentNotifDropdown = toggleStudentNotifDropdown;
window.toggleModuleCheck = toggleModuleCheck;
window.markNotificationRead = markNotificationRead;
window.approveStudent = approveStudent;
window.rejectStudent = rejectStudent;
window.deleteStudent = deleteStudent;
window.loadAdminStudentsList = loadAdminStudentsList;
window.openEmailVisualizerModal = openEmailVisualizerModal;
window.closeEmailVisualizerModal = closeEmailVisualizerModal;

window.addEventListener('DOMContentLoaded', () => {
  // Initialize registration forms password checkers
  initRegistrationValidation();
  // Initialize student/admin logins controller
  initLoginHandler();
  // Init session check
  initSession();
});
