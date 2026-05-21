// Quick API verification script
const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET',
      headers
    }, (res) => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('=== TEST 1: Admin Login ===');
  const adminLogin = await post('/api/auth/login-admin', { usuario: 'admin', contrasena: 'admin1234' });
  console.log(`Status: ${adminLogin.status} | Success: ${adminLogin.body.success}`);
  const adminToken = adminLogin.body.token;

  console.log('\n=== TEST 2: Get Admin Dashboard Stats ===');
  const stats = await get('/api/admin/dashboard-stats', adminToken);
  console.log(`Status: ${stats.status} | Total: ${stats.body.stats?.total} | Pending: ${stats.body.stats?.pendientes} | Accepted: ${stats.body.stats?.aceptados}`);

  console.log('\n=== TEST 3: List Students (Admin) ===');
  const students = await get('/api/admin/students', adminToken);
  console.log(`Status: ${students.status} | Students Found: ${students.body.length}`);
  students.body.forEach(s => console.log(`  - ${s.nombre} | ${s.estado} | Course: ${s.curso_titulo}`));

  console.log('\n=== TEST 4: Approve Pending Student (Maria) ===');
  const maria = students.body.find(s => s.nombre.includes('Mar'));
  if (maria) {
    const approve = await post(`/api/admin/students/${maria.id}/approve`, {});
    // Need auth header for POST too
    const approveReq = new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost', port: 3000,
        path: `/api/admin/students/${maria.id}/approve`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
      }, (res) => {
        let chunks = '';
        res.on('data', c => chunks += c);
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(chunks) }));
      });
      req.on('error', reject);
      req.end();
    });
    const approveRes = await approveReq;
    console.log(`Status: ${approveRes.status} | Success: ${approveRes.body.success} | Email Mode: ${approveRes.body.emailMode}`);
    if (approveRes.body.credentials) {
      console.log(`  Generated User: ${approveRes.body.credentials.usuario_acceso}`);
      console.log(`  Generated Pass: ${approveRes.body.credentials.contrasena_acceso}`);
    }
  }

  console.log('\n=== TEST 5: Student Login (Carlos - accepted) ===');
  const carlosLogin = await post('/api/auth/login', { identificador: 'carlos.rod@gmail.com', contrasena: 'carlos123' });
  console.log(`Status: ${carlosLogin.status} | Success: ${carlosLogin.body.success}`);
  const studentToken = carlosLogin.body.token;

  if (studentToken) {
    console.log('\n=== TEST 6: Student Dashboard ===');
    const dashboard = await get('/api/student/dashboard', studentToken);
    console.log(`Status: ${dashboard.status} | Name: ${dashboard.body.student?.nombre} | Course: ${dashboard.body.course?.titulo}`);
    console.log(`  Modules: ${dashboard.body.modules?.length} | Notifications: ${dashboard.body.notifications?.length}`);
  }

  console.log('\n=== TEST 7: Registration (New Student) ===');
  const newReg = await post('/api/auth/register', {
    nombre: 'Daniel Test',
    documento: 'TEST-99999',
    correo: 'daniel.test.infinity@gmail.com',
    telefono: '+1234567890',
    edad: 22,
    pais: 'Colombia',
    contrasena: 'securePass123!',
    curso_id: 2
  });
  console.log(`Status: ${newReg.status} | Success: ${newReg.body.success} | Message: ${newReg.body.message}`);

  console.log('\n=== TEST 8: Check Virtual Mailbox ===');
  const emails = await get('/api/admin/emails', adminToken);
  console.log(`Status: ${emails.status} | Emails in Virtual Mailbox: ${emails.body.length}`);

  console.log('\n=== ALL TESTS COMPLETED ===');
}

runTests().catch(err => console.error('Test Error:', err));
