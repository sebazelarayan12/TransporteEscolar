// ─────────────────────────────────────────────────────────────────────────────
// config.js — Configuración del bot
// Las URLs sensibles se cargan desde el archivo .env (no se sube a git)
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const config = {
  // Cambiar a 'production' cuando estés listo para el envío real
  activeEnvironment: 'testing',

  // true = solo muestra los mensajes en consola, NO envía nada por WhatsApp
  dryRun: false,

  environments: {
    testing: {
      API_BASE_URL: process.env.API_TESTING,
      label: 'TESTING',
    },
    production: {
      API_BASE_URL: process.env.API_PROD,
      label: 'PRODUCCIÓN',
    },
  },

  // Pausa entre mensajes para evitar detección de spam
  delayBetweenMessagesMs: 4000,

  // Carpeta donde se guarda la sesión (no se necesita escanear el QR cada vez)
  sessionFolder: './sesion_whatsapp',
};

// Validar que las variables de entorno estén cargadas
const urlActual = config.environments[config.activeEnvironment]?.API_BASE_URL;
if (!urlActual) {
  console.error(`❌ Falta la variable de entorno para el entorno "${config.activeEnvironment}". Revisá el archivo .env`);
  process.exit(1);
}

module.exports = config;
