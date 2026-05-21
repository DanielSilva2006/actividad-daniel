# 🌌 Infinity Tech University

![Infinity Tech Banner](https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80)

Una plataforma universitaria moderna, completa y profesional (Full-Stack), enfocada en cursos tecnológicos de Inteligencia Artificial y Ciencia de Datos. Desarrollada con un diseño premium futurista (Glassmorphism), backend robusto y base de datos relacional en la nube.

---

## ✨ Características Principales

*   **🎨 Interfaz Futurista UI/UX:** Diseño premium con Glassmorphism, animaciones suaves, efectos neón, fondos dinámicos de partículas en Canvas y soporte de Modo Oscuro/Claro.
*   **🔒 Sistema de Autenticación Seguro:** JWT (JSON Web Tokens) con contraseñas encriptadas nativamente usando PBKDF2-SHA512. Control de roles estricto (Estudiantes y Administradores).
*   **👨‍🎓 Portal Estudiantil:** Los alumnos admitidos pueden iniciar sesión para ver sus cursos matriculados, módulos de clases y recibir notificaciones académicas.
*   **🛡️ Panel Administrativo Dinámico:** Dashboard completo con estadísticas, gráficos interactivos y gestor para aprobar, rechazar o eliminar estudiantes.
*   **📧 Buzón Virtual & SMTP:** Sistema automático de despacho de "Cartas de Admisión" con credenciales de acceso. Soporta envío real mediante Gmail SMTP o un visor de buzón virtual integrado en el panel de administrador.
*   **☁️ Base de Datos Cloud (Supabase):** Integración profunda con PostgreSQL mediante Connection Pooling para máxima eficiencia en entornos Serverless/PaaS.
*   **📱 100% Responsive:** Diseño adaptable para móviles, tablets y escritorios.

---

## 🛠️ Stack Tecnológico

*   **Frontend:** HTML5, CSS3 (Variables HSL), Vanilla JavaScript (SPA Controller, Fetch API).
*   **Backend:** Node.js, Express.js.
*   **Base de Datos:** PostgreSQL (alojado en Supabase) vía el módulo `pg`.
*   **Librerías Adicionales:** `jsonwebtoken` (Auth), `nodemailer` (Emails), `cors`, `dotenv`.

---

## 🚀 Despliegue en Vivo

El proyecto está completamente funcional y alojado gratuitamente en Render (Backend) y Supabase (Base de Datos).

🌐 **Enlace de la Plataforma:** [https://actividad-daniel.onrender.com](https://actividad-daniel.onrender.com)

### 🔐 Credenciales de Prueba

Para probar las funcionalidades de evaluación de estudiantes y métricas, utiliza las siguientes credenciales para acceder al Panel de Control:

*   **Usuario Administrador:** `admin`
*   **Contraseña:** `admin1234`

> **Nota:** Al ser un servicio gratuito de Render, el servidor puede entrar en estado de "suspensión" tras 15 minutos de inactividad. Si la página demora un poco en cargar la primera vez (hasta 50 segundos), es completamente normal mientras el servidor se reactiva.
