const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const config = require('./config.js');

const env = config.environments[config.activeEnvironment];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// Mensaje de recordatorio
// ─────────────────────────────────────────────────────────────────────────────

function formatMonto(monto) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(monto);
}

function buildMensaje(saldoPendiente, periodo) {
  return (
    `Hola! 🚌\n\n` +
    `Te recordamos que tenés la cuota de *${periodo}* pendiente por *${formatMonto(saldoPendiente)}*.\n\n` +
    `Por favor realizá el pago lo antes posible. ¡Muchas gracias! 😊`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Obtener pendientes y vencidos del mes actual desde la API
// ─────────────────────────────────────────────────────────────────────────────

async function obtenerDestinatarios() {
  const ahora = new Date();
  const mes = ahora.getMonth() + 1;
  const anio = ahora.getFullYear();
  const periodo = `${String(mes).padStart(2, '0')}/${anio}`;

  console.log(`\n🌐 API [${env.label}]: ${env.API_BASE_URL}`);
  console.log(`📅 Mes a notificar: ${periodo}`);

  // Traer pendientes y vencidos en paralelo
  const [{ data: pendientes }, { data: vencidos }] = await Promise.all([
    axios.get(`${env.API_BASE_URL}/pagosmensuales/pendientes`),
    axios.get(`${env.API_BASE_URL}/pagosmensuales/vencidos`),
  ]);

  // Unir y deduplicar por ID de pago, filtrando solo el mes actual
  const todos = [...(pendientes ?? []), ...(vencidos ?? [])];
  const delMesActual = todos.filter(
    (p) => p.mes === mes && p.anio === anio && p.saldoPendiente > 0
  );
  const unicos = Object.values(
    Object.fromEntries(delMesActual.map((p) => [p.id, p]))
  );

  if (unicos.length === 0) {
    console.log('✅ No hay cuotas pendientes o vencidas este mes.');
    return [];
  }

  // Obtener teléfono principal de cada titular (en paralelo)
  const idsUnicos = [...new Set(unicos.map((p) => p.titularId))];
  const telefonosPorTitular = {};
  await Promise.all(
    idsUnicos.map(async (id) => {
      try {
        const { data: telefonos } = await axios.get(`${env.API_BASE_URL}/titulares/${id}/telefonos`);
        const principal =
          telefonos.find((t) => t.esPrincipal && t.activo) ??
          telefonos.find((t) => t.activo);
        if (principal) telefonosPorTitular[id] = principal.numeroE164;
      } catch { /* sin teléfono: se saltea */ }
    })
  );

  // Armar lista final (1 entrada por titular)
  const destinatarios = [];
  const titularesVistos = new Set();
  for (const p of unicos) {
    if (titularesVistos.has(p.titularId)) continue;
    const tel = telefonosPorTitular[p.titularId];
    if (!tel) continue;
    titularesVistos.add(p.titularId);
    destinatarios.push({ telefono: tel, saldoPendiente: p.saldoPendiente, periodo });
  }

  const sinTel = idsUnicos.length - destinatarios.length;
  if (sinTel > 0) console.log(`⚠️  ${sinTel} titular(es) sin teléfono activo, omitidos.`);
  console.log(`📤 Destinatarios: ${destinatarios.length}`);

  return destinatarios;
}

// ─────────────────────────────────────────────────────────────────────────────
// Enviar mensajes
// ─────────────────────────────────────────────────────────────────────────────

async function enviarMensajes(client, destinatarios) {
  let enviados = 0;
  let errores = 0;

  for (let i = 0; i < destinatarios.length; i++) {
    const { telefono, saldoPendiente, periodo } = destinatarios[i];

    // Argentina: WhatsApp requiere el 9 entre el código de país (54) y el prefijo de área
    const limpio = telefono.replace(/\D/g, '');
    const numeroWA = limpio.startsWith('54') && !limpio.startsWith('549')
      ? '549' + limpio.slice(2)
      : limpio;

    try {
      const numberId = await client.getNumberId(numeroWA);
      const chatId = numberId ? numberId._serialized : `${numeroWA}@c.us`;
      await client.sendMessage(chatId, buildMensaje(saldoPendiente, periodo));
      console.log(`✅ Enviado a ${telefono}`);
      enviados++;
    } catch (err) {
      console.error(`❌ Error al enviar a ${telefono}: ${err.message}`);
      errores++;
    }

    if (i < destinatarios.length - 1) {
      await sleep(config.delayBetweenMessagesMs);
    }
  }

  console.log(`\n📊 Resultado: ${enviados} enviados, ${errores} errores.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Bot principal
// ─────────────────────────────────────────────────────────────────────────────

async function iniciarBot() {
  console.log('='.repeat(60));
  console.log('  🚌 Bot WhatsApp — Transporte Escolar');
  console.log(`  Entorno: ${env.label}`);
  if (config.dryRun) console.log('  ⚠️  MODO SIMULACIÓN — no se enviará nada');
  console.log('='.repeat(60));

  const destinatarios = await obtenerDestinatarios();
  if (destinatarios.length === 0) process.exit(0);

  if (config.dryRun) {
    console.log('\n📋 Mensajes que se enviarían:\n');
    for (const { telefono, saldoPendiente, periodo } of destinatarios) {
      const limpio = telefono.replace(/\D/g, '');
      const numeroWA = limpio.startsWith('54') && !limpio.startsWith('549')
        ? '549' + limpio.slice(2) : limpio;
      console.log(`─── ${numeroWA} ───`);
      console.log(buildMensaje(saldoPendiente, periodo));
      console.log();
    }
    process.exit(0);
  }

  console.log('\n🔐 Iniciando sesión de WhatsApp...');

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: config.sessionFolder }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
  });

  client.on('qr', (qr) => {
    console.log('\n📱 Escaneá este QR (WhatsApp → Dispositivos vinculados → Vincular dispositivo):\n');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', async () => {
    console.log('\n✅ Conectado a WhatsApp.\n');
    await sleep(3000);
    await enviarMensajes(client, destinatarios);
    console.log('\n⏳ Esperando confirmación de entrega...');
    await sleep(8000);
    await client.destroy();
    process.exit(0);
  });

  client.on('auth_failure', () => {
    console.error('❌ Error de autenticación. Eliminá la carpeta "sesion_whatsapp" y volvé a correr.');
    process.exit(1);
  });

  client.on('disconnected', (reason) => {
    console.log(`🔌 Desconectado: ${reason}.`);
    process.exit(1);
  });

  client.initialize();
}

iniciarBot().catch((err) => {
  console.error('💥 Error fatal:', err.message);
  process.exit(1);
});
