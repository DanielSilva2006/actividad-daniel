// ==========================================
// TOAST NOTIFICATIONS HELPER
// ==========================================
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast glass-panel ${type}`;
  
  // Icon select based on type
  let icon = '⚡';
  if (type === 'success') icon = '✔';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `
    <span style="font-size: 18px;">${icon}</span>
    <div>${message}</div>
  `;

  container.appendChild(toast);

  // Slide-out and remove animation
  setTimeout(() => {
    toast.style.animation = 'slideToastIn 0.3s reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// Make it global
window.showToast = showToast;

// ==========================================
// PARTICLES BACKGROUND NETWORK (CANVAS)
// ==========================================
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 2 + 1;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'light' 
        ? 'rgba(109, 40, 217, 0.15)' 
        : 'rgba(6, 182, 212, 0.25)';
      ctx.fill();
    }
  }

  // Initialize nodes list
  const maxParticles = window.innerWidth < 768 ? 40 : 100;
  for (let i = 0; i < maxParticles; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update & draw particles
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    
    // Draw connecting vectors
    ctx.beginPath();
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 100) {
          const opacity = (1 - dist / 100) * 0.08;
          ctx.strokeStyle = document.documentElement.getAttribute('data-theme') === 'light'
            ? `rgba(109, 40, 217, ${opacity})`
            : `rgba(6, 182, 212, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
        }
      }
    }
    ctx.stroke();
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

// ==========================================
// DYNAMIC THEME CONTROLLER
// ==========================================
function initThemeController() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;
  
  const savedTheme = localStorage.getItem('fit-university-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('fit-university-theme', newTheme);
    updateThemeIcon(newTheme);
    
    showToast(`Modo ${newTheme === 'dark' ? 'Oscuro' : 'Claro'} activado`, 'info');
  });
}

function updateThemeIcon(theme) {
  const iconSpan = document.querySelector('#theme-toggle span');
  if (iconSpan) {
    iconSpan.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// ==========================================
// FAQ INTELLIGENT SUPPORT CHAT
// ==========================================
function initSupportChat() {
  const bubble = document.getElementById('chat-bubble');
  const windowEl = document.getElementById('chat-window');
  const sendBtn = document.getElementById('chat-send-btn');
  const inputEl = document.getElementById('chat-input');
  const messagesEl = document.getElementById('chat-messages');

  if (!bubble || !windowEl) return;

  // Toggle chat viewport
  bubble.addEventListener('click', () => {
    windowEl.classList.toggle('active');
    // Scroll to bottom on open
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });

  // Predefined chatbot questions & answers
  const faqData = {
    requisitos: "Los requisitos básicos para ingresar son: 1) Ser mayor de 16 años, 2) Poseer conocimientos básicos de lógica o computación, 3) Tener una cuenta activa de correo @gmail.com, y 4) Completar la postulación digital y esperar la aprobación de nuestro Comité Académico.",
    costos: "Infinity Tech University cuenta con financiamiento del 100% de la matrícula gracias a patrocinantes tecnológicos globales. Actualmente, el costo por semestre académico para Regresión Lineal y Algoritmos Genéticos está totalmente cubierto si tu postulación es ACEPTADA.",
    duracion: "El curso de Regresión Lineal tiene una duración de 8 semanas (60 Horas), y el de Algoritmos Genéticos tiene una duración de 10 semanas (80 Horas). Ambas especialidades se dictan en modalidad Online con clases sincrónicas en vivo y laboratorios interactivos.",
    hardware: "Para cursar óptimamente, requieres un computador con procesador Intel i3/Ryzen 3 o superior, mínimo 8 GB de memoria RAM, conexión a internet estable de al menos 10 Mbps, y tener instalado el entorno Anaconda o Python 3.9+ localmente."
  };

  // Add click listeners to quick options buttons
  messagesEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('chat-option-btn')) {
      const optionKey = e.target.getAttribute('data-faq');
      if (faqData[optionKey]) {
        appendChatMessage(e.target.textContent, 'user');
        
        // Typing simulation
        setTimeout(() => {
          appendChatMessage(faqData[optionKey], 'bot');
        }, 600);
      }
    }
  });

  // Send message handler
  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    
    appendChatMessage(text, 'user');
    inputEl.value = '';

    // Advanced search algorithm for user query matching
    setTimeout(() => {
      let reply = "Entiendo tu duda. Por favor comunícate a nuestro correo institucional admisiones@infinitytech.edu para una asistencia más detallada o selecciona una de nuestras opciones frecuentes.";
      const cleanText = text.toLowerCase();

      if (cleanText.includes('requisito') || cleanText.includes('necesito')) {
        reply = faqData.requisitos;
      } else if (cleanText.includes('precio') || cleanText.includes('costo') || cleanText.includes('pagar') || cleanText.includes('gratis')) {
        reply = faqData.costos;
      } else if (cleanText.includes('tiempo') || cleanText.includes('dura') || cleanText.includes('semana') || cleanText.includes('clase')) {
        reply = faqData.duracion;
      } else if (cleanText.includes('computador') || cleanText.includes('ram') || cleanText.includes('pc') || cleanText.includes('requisito tecnico')) {
        reply = faqData.hardware;
      } else if (cleanText.includes('hola') || cleanText.includes('buenos dias')) {
        reply = "¡Hola! Bienvenido al asistente estudiantil de Infinity Tech University. ¿En qué puedo ayudarte hoy?";
      }

      appendChatMessage(reply, 'bot');
    }, 800);
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

function appendChatMessage(text, sender) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const msg = document.createElement('div');
  msg.className = `chat-msg ${sender}`;
  msg.textContent = text;
  container.appendChild(msg);

  // Auto-scroll to view bottom
  container.scrollTop = container.scrollHeight;
}

// ==========================================
// ACCORDION CONTROLLER FOR COURSES PAGE
// ==========================================
function initAccordion() {
  document.addEventListener('click', (e) => {
    const header = e.target.closest('.accordion-header');
    if (!header) return;

    const item = header.parentElement;
    const body = item.querySelector('.accordion-body');
    const allItems = item.parentElement.querySelectorAll('.accordion-item');

    // Close other siblings
    allItems.forEach(i => {
      if (i !== item) i.classList.remove('active');
    });

    item.classList.toggle('active');
  });
}

// ==========================================
// DOCUMENT LIFE CYCLE LOADER
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  // Initialize canvas grid nodes background
  initParticles();
  // Initialize dynamic HSL theme converter
  initThemeController();
  // Initialize support chatbot panel
  initSupportChat();
  // Initialize course module accordions
  initAccordion();

  // Hide university preloader with high-end fade out
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.remove();
      }, 500);
    }, 1200);
  }
});
