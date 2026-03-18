const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const config = require('./config.js');

const env = config.environments[config.activeEnvironment];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades compartidas
// ─────────────────────────────────────────────────────────────────────────────

function getPeriodoActual() {
  const now = new Date();
  const mes = now.getMonth() + 1;
  const anio = now.getFullYear();
  return { mes, anio, label: `${String(mes).padStart(2, '0')}/${anio}` };
}

function formatPeriodoNatural(label) {
  if (typeof label !== 'string') return label;
  const [mesRaw, anioRaw] = label.split('/').map((part) => part?.trim());
  const mesNumero = Number(mesRaw);
  const anio = Number(anioRaw);
  if (!Number.isInteger(mesNumero) || mesNumero < 1 || mesNumero > 12 || !Number.isInteger(anio)) {
    return label;
  }

  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

  const nombreMes = meses[mesNumero - 1];
  if (!nombreMes) return label;
  return `${nombreMes} ${anio}`;
}

function formatMonto(monto) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(monto ?? 0);
}

function normalizeWhatsappNumber(raw) {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('54') && !digits.startsWith('549')) {
    return `549${digits.slice(2)}`;
  }
  return digits;
}

async function cargarTelefonosPrincipales(titularIds = []) {
  const telefonos = {};
  await Promise.all(
    [...new Set(titularIds)].map(async (id) => {
      try {
        const { data } = await axios.get(`${env.API_BASE_URL}/titulares/${id}/telefonos`);
        const principal = seleccionarTelefonoPrincipal(data ?? []);
        const numero = principal?.numeroE164 ?? principal?.numero ?? null;
        if (numero) telefonos[id] = numero;
      } catch {
        // sin teléfono disponible
      }
    })
  );
  return telefonos;
}

function seleccionarTelefonoPrincipal(telefonos) {
  return (
    telefonos.find((t) => t.esPrincipal && t.activo) ||
    telefonos.find((t) => t.activo) ||
    null
  );
}

function printHeader(commandName, description) {
  console.log('='.repeat(60));
  console.log('  🚌 Bot WhatsApp — Transporte Escolar');
  console.log(`  Entorno: ${env.label}`);
  console.log(`  Comando: ${commandName}`);
  console.log(`  Acción: ${description}`);
  if (config.dryRun) console.log('  ⚠️  MODO SIMULACIÓN — no se enviará nada');
  console.log('='.repeat(60));
}

function printHelp() {
  console.log('\nUso: node index.js <comando>');
  console.log('Comandos disponibles:');
  Object.entries(commands).forEach(([name, cfg]) => {
    console.log(`  • ${name.padEnd(12)} ${cfg.description}`);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Comando: pendientes
// ─────────────────────────────────────────────────────────────────────────────

async function fetchDestinatariosPendientes() {
  const periodo = getPeriodoActual();
  console.log(`\n🌐 API [${env.label}]: ${env.API_BASE_URL}`);
  console.log(`📅 Mes a notificar: ${periodo.label}`);

  const [{ data: pendientes }, { data: vencidos }] = await Promise.all([
    axios.get(`${env.API_BASE_URL}/pagosmensuales/pendientes`),
    axios.get(`${env.API_BASE_URL}/pagosmensuales/vencidos`),
  ]);

  const todos = [...(pendientes ?? []), ...(vencidos ?? [])];
  const delMes = todos.filter(
    (pago) => pago.mes === periodo.mes && pago.anio === periodo.anio && pago.saldoPendiente > 0
  );
  const pagosUnicos = Object.values(Object.fromEntries(delMes.map((p) => [p.id, p])));

  if (pagosUnicos.length === 0) {
    console.log('✅ No hay cuotas pendientes o vencidas este mes.');
    return [];
  }

  const telefonos = await cargarTelefonosPrincipales(pagosUnicos.map((p) => p.titularId));
  const vistos = new Set();
  const destinatarios = [];

  for (const pago of pagosUnicos) {
    if (vistos.has(pago.titularId)) continue;
    const telefono = telefonos[pago.titularId];
    if (!telefono) continue;
    vistos.add(pago.titularId);
    destinatarios.push({
      telefono,
      periodo: periodo.label,
      saldoPendiente: pago.saldoPendiente,
    });
  }

  const sinTelefono = new Set(pagosUnicos.map((p) => p.titularId)).size - destinatarios.length;
  if (sinTelefono > 0) console.log(`⚠️  ${sinTelefono} titular(es) sin teléfono activo, omitidos.`);
  console.log(`📤 Destinatarios listos: ${destinatarios.length}`);

  return destinatarios;
}

function buildMensajePendientes(destinatario) {
  const periodoNatural = formatPeriodoNatural(destinatario.periodo);
  return (
    `Hola! 🚌\n\n` +
    `Te recordamos que tenés la cuota del mes *${periodoNatural}* pendiente por *${formatMonto(destinatario.saldoPendiente)}*.\n\n` +
    `Por favor realizá el pago lo antes posible. ¡Muchas gracias! 😊`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Comando: recordatorio
// ─────────────────────────────────────────────────────────────────────────────

async function fetchDestinatariosRecordatorio() {
  const periodo = getPeriodoActual();
  console.log(`\n🌐 API [${env.label}]: ${env.API_BASE_URL}`);
  console.log('📋 Recuperando titulares activos...');

  const { data } = await axios.get(`${env.API_BASE_URL}/titulares/activos`);
  const titulares = Array.isArray(data) ? data : [];

  if (titulares.length === 0) {
    console.log('✅ No se encontraron titulares activos.');
    return [];
  }

  const telefonos = await cargarTelefonosPrincipales(titulares.map((t) => t.id));
  const destinatarios = titulares
    .map((titular) => {
      const telefono = telefonos[titular.id];
      if (!telefono) return null;
      return {
        telefono,
        periodo: periodo.label,
        monto: titular.montoMensualPactado ?? 0,
      };
    })
    .filter(Boolean);

  const sinTelefono = titulares.length - destinatarios.length;
  if (sinTelefono > 0) console.log(`⚠️  ${sinTelefono} titular(es) sin teléfono activo, omitidos.`);
  console.log(`📤 Recordatorios a enviar: ${destinatarios.length}`);

  return destinatarios;
}

function buildMensajeRecordatorio(destinatario) {
  const periodoNatural = formatPeriodoNatural(destinatario.periodo);
  return (
    `¡Hola! 🚌\n\n` +
    `Te recordamos que la cuota del servicio de transporte escolar correspondiente al mes de *${periodoNatural}* es de *${formatMonto(destinatario.monto)}*.\n\n` +
    `Podés abonar por transferencia o en efectivo. ¡Gracias por confiar en nosotros! 😊`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuración de comandos
// ─────────────────────────────────────────────────────────────────────────────

const commands = {
  pendientes: {
    description: 'Recordatorio de cuotas con saldo pendiente/vencido del mes actual.',
    fetchDestinatarios: fetchDestinatariosPendientes,
    buildMensaje: buildMensajePendientes,
  },
  recordatorio: {
    description: 'Aviso masivo con el monto mensual pactado para titulares activos.',
    fetchDestinatarios: fetchDestinatariosRecordatorio,
    buildMensaje: buildMensajeRecordatorio,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Ejecución de comandos
// ─────────────────────────────────────────────────────────────────────────────

async function runCommand(commandName, commandConfig) {
  printHeader(commandName, commandConfig.description);

  const destinatarios = await commandConfig.fetchDestinatarios();
  if (destinatarios.length === 0) {
    console.log('\n🏁 Nada para enviar.');
    return;
  }

  if (config.dryRun) {
    console.log('\n📋 Mensajes que se enviarían:\n');
    destinatarios.forEach((dest) => {
      const numero = normalizeWhatsappNumber(dest.telefono);
      console.log(`─── ${numero ?? 'SIN_NUMERO'} ───`);
      console.log(commandConfig.buildMensaje(dest));
      console.log();
    });
    return;
  }

  console.log('\n🔐 Iniciando sesión de WhatsApp...');
  await iniciarSesionWhatsApp(destinatarios, commandConfig.buildMensaje);
}

async function iniciarSesionWhatsApp(destinatarios, buildMensaje) {
  await new Promise((resolve, reject) => {
    const client = new Client({
      authStrategy: new LocalAuth({ dataPath: config.sessionFolder }),
      puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
    });

    client.on('qr', (qr) => {
      console.log('\n📱 Escaneá este QR (WhatsApp → Dispositivos vinculados → Vincular dispositivo):\n');
      qrcode.generate(qr, { small: true });
    });

    client.on('ready', async () => {
      try {
        console.log('\n✅ Conectado a WhatsApp.\n');
        await sleep(3000);
        await enviarMensajes(client, destinatarios, buildMensaje);
        console.log('\n⏳ Esperando confirmación de entrega...');
        await sleep(8000);
        await client.destroy();
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    client.on('auth_failure', () => {
      const err = new Error('Error de autenticación en WhatsApp.');
      console.error('❌ Error de autenticación. Eliminá la carpeta "sesion_whatsapp" y volvé a correr.');
      reject(err);
    });

    client.on('disconnected', (reason) => {
      console.log(`🔌 Desconectado: ${reason}.`);
      reject(new Error(`Sesión desconectada: ${reason}`));
    });

    client.initialize();
  });
}

async function enviarMensajes(client, destinatarios, buildMensaje) {
  let enviados = 0;
  let errores = 0;

  for (let i = 0; i < destinatarios.length; i++) {
    const destinatario = destinatarios[i];
    const numeroWA = normalizeWhatsappNumber(destinatario.telefono);
    if (!numeroWA) {
      console.warn(`⚠️  Número inválido para destinatario omitido.`);
      continue;
    }

    try {
      const numberId = await client.getNumberId(numeroWA);
      const chatId = numberId ? numberId._serialized : `${numeroWA}@c.us`;
      await client.sendMessage(chatId, buildMensaje(destinatario));
      console.log(`✅ Enviado a ${destinatario.telefono}`);
      enviados++;
    } catch (err) {
      console.error(`❌ Error al enviar a ${destinatario.telefono}: ${err.message}`);
      errores++;
    }

    if (i < destinatarios.length - 1) {
      await sleep(config.delayBetweenMessagesMs);
    }
  }

  console.log(`\n📊 Resultado: ${enviados} enviados, ${errores} errores.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Punto de entrada
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const [, , commandName] = process.argv;
  if (!commandName || !commands[commandName]) {
    printHelp();
    process.exit(1);
  }

  await runCommand(commandName, commands[commandName]);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Error fatal:', err.message);
    process.exit(1);
  });
