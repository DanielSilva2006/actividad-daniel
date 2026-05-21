const { Resend } = require('resend');
const dotenv = require('dotenv');
const db = require('../database/db');

dotenv.config();

const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Generates an ultra-premium, cyber-futuristic HTML template for student admission.
 * @param {string} studentName 
 * @param {string} courseName 
 * @param {string} username 
 * @param {string} password 
 * @param {string} loginUrl 
 * @returns {string}
 */
function getAdmissionEmailHTML(studentName, courseName, username, password, loginUrl) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admisión Oficial - Infinity Tech University</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #070913;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #e2e8f0;
      }
      .email-container {
        max-width: 600px;
        margin: 40px auto;
        background: radial-gradient(circle at top left, #13182d, #070913);
        border: 1px solid rgba(6, 182, 212, 0.2);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(6, 182, 212, 0.1);
      }
      .email-header {
        background: linear-gradient(135deg, #1e1b4b, #311062);
        padding: 40px 20px;
        text-align: center;
        border-bottom: 2px solid #06b6d4;
        position: relative;
      }
      .email-header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 2px;
        color: #ffffff;
        text-shadow: 0 0 10px rgba(6, 182, 212, 0.6);
      }
      .email-header p {
        margin: 10px 0 0 0;
        font-size: 13px;
        text-transform: uppercase;
        color: #06b6d4;
        font-weight: 600;
        letter-spacing: 4px;
      }
      .email-body {
        padding: 40px 30px;
      }
      .welcome-text {
        font-size: 18px;
        color: #ffffff;
        margin-top: 0;
        margin-bottom: 20px;
        font-weight: 600;
      }
      .main-paragraph {
        font-size: 15px;
        line-height: 1.6;
        color: #94a3b8;
        margin-bottom: 30px;
      }
      .highlight-box {
        background: rgba(30, 41, 59, 0.5);
        border-left: 4px solid #7c3aed;
        padding: 20px;
        border-radius: 0 12px 12px 0;
        margin-bottom: 30px;
      }
      .highlight-box h3 {
        margin: 0 0 10px 0;
        color: #7c3aed;
        font-size: 16px;
      }
      .highlight-box p {
        margin: 0;
        font-size: 14px;
        color: #e2e8f0;
      }
      .credentials-container {
        background: rgba(6, 182, 212, 0.05);
        border: 1px dashed rgba(6, 182, 212, 0.3);
        border-radius: 12px;
        padding: 25px;
        margin-bottom: 35px;
        text-align: center;
      }
      .credentials-title {
        font-size: 13px;
        color: #06b6d4;
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 2px;
        margin-bottom: 15px;
      }
      .credential-row {
        margin: 10px 0;
        font-size: 16px;
      }
      .credential-label {
        color: #94a3b8;
      }
      .credential-value {
        color: #ffffff;
        font-family: 'Courier New', Courier, monospace;
        font-weight: 700;
        background: rgba(15, 23, 42, 0.8);
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: inline-block;
      }
      .cta-button {
        display: block;
        width: 220px;
        margin: 30px auto 0 auto;
        padding: 15px 30px;
        background: linear-gradient(90deg, #7c3aed, #06b6d4);
        color: #ffffff;
        text-decoration: none;
        text-align: center;
        font-weight: 700;
        font-size: 15px;
        text-transform: uppercase;
        border-radius: 30px;
        box-shadow: 0 10px 20px rgba(124, 58, 237, 0.3);
        transition: all 0.3s ease;
      }
      .email-footer {
        background: rgba(15, 23, 42, 0.6);
        padding: 30px 20px;
        text-align: center;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }
      .email-footer p {
        margin: 5px 0;
        font-size: 12px;
        color: #64748b;
      }
      .email-footer a {
        color: #06b6d4;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <h1>INFINITY TECH</h1>
        <p>University of Advanced AI & Data Science</p>
      </div>
      <div class="email-body">
        <p class="welcome-text">¡Saludos, ${studentName}!</p>
        <p class="main-paragraph">
          Nos complace enormemente informarle que el Comité de Admisión de <strong>Infinity Tech University</strong> ha revisado rigurosamente su postulación académica y ha aprobado formalmente su ingreso para el ciclo de alta tecnología 2026.
        </p>
        
        <div class="highlight-box">
          <h3>PROGRAMA APROBADO</h3>
          <p><strong>Curso:</strong> ${courseName}</p>
          <p><strong>Nivel:</strong> Especialización Avanzada</p>
        </div>

        <p class="main-paragraph">
          Para garantizar su acceso inmediato al ecosistema estudiantil digital, nuestro sistema ha generado automáticamente sus credenciales oficiales seguras. Le recomendamos cambiarlas una vez inicie sesión por primera vez.
        </p>

        <div class="credentials-container">
          <div class="credentials-title">Credenciales de Acceso Académico</div>
          <div class="credential-row">
            <span class="credential-label">Usuario:</span>
            <span class="credential-value">${username}</span>
          </div>
          <div class="credential-row">
            <span class="credential-label">Contraseña:</span>
            <span class="credential-value">${password}</span>
          </div>
        </div>

        <p class="main-paragraph" style="text-align: center; font-size: 13px; color: #64748b;">
          Haga clic en el siguiente enlace para dirigirse al panel del estudiante e ingresar sus datos.
        </p>

        <a href="${loginUrl}" class="cta-button">Acceder al Campus</a>
      </div>
      <div class="email-footer">
        <p>© 2026 Infinity Tech University. Todos los derechos reservados.</p>
        <p>Este correo electrónico fue generado automáticamente. Por favor no responda directamente.</p>
        <p><a href="${loginUrl}">Soporte Académico</a> | <a href="${loginUrl}">Políticas de Privacidad</a></p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Sends an email using Resend if configured, otherwise logs it into the PostgreSQL sent_emails table.
 * @param {object} params
 * @param {string} params.to 
 * @param {string} params.subject 
 * @param {string} params.studentName 
 * @param {string} params.courseName 
 * @param {string} params.username 
 * @param {string} params.password 
 * @returns {Promise<{success: boolean, mode: string, messageId?: string, error?: string}>}
 */
async function sendAdmissionEmail({ to, subject, studentName, courseName, username, password }) {
  const loginUrl = `https://actividad-daniel.onrender.com`; // Used live render URL as base
  const htmlContent = getAdmissionEmailHTML(studentName, courseName, username, password, loginUrl);
  
  if (!resendClient) {
    console.log('\n--- [VIRTUAL MAIL BOX TRIGGERED] ---');
    console.log(`Para: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Usuario Generado: ${username}`);
    console.log(`Contraseña Generada: ${password}`);
    console.log('------------------------------------\n');
    
    try {
      await db.insert('sent_emails', {
        para: to, asunto: subject, estudiante: studentName, curso: courseName, usuario: username, contrasena: password, html: htmlContent
      });
    } catch (dbErr) {
      console.error('Error logging virtual mail to database:', dbErr);
    }
    
    return { success: true, mode: 'virtual' };
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: `Infinity Tech University <${process.env.SENDER_EMAIL || 'onboarding@resend.dev'}>`,
      to: [to],
      subject: subject,
      html: htmlContent
    });

    if (error) {
      console.error('Resend API Error:', error);
      throw new Error(error.message);
    }

    console.log(`Correo Resend enviado exitosamente. ID: ${data.id}`);
    
    // Guardar también en la base de datos para el registro en el panel de administrador
    try {
      await db.insert('sent_emails', {
        para: to, asunto: subject, estudiante: studentName, curso: courseName, usuario: username, contrasena: password, html: htmlContent
      });
    } catch (dbErr) {
      // ignore
    }

    return { success: true, mode: 'resend', messageId: data.id };
  } catch (error) {
    console.error('Fallo en el envío Resend, guardando copia en buzón virtual:', error);
    
    try {
      await db.insert('sent_emails', {
        para: to, asunto: `${subject} (RESEND FAILED FALLBACK)`, estudiante: studentName, curso: courseName, usuario: username, contrasena: password, html: htmlContent, error: error.message
      });
    } catch (dbErr) {
      // ignore
    }
    
    return { success: true, mode: 'fallback_virtual', error: error.message };
  }
}

module.exports = {
  sendAdmissionEmail
};
