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

function getPeriodoSiguiente() {
  const now = new Date();
  const mes = now.getMonth() === 11 ? 1 : now.getMonth() + 2;
  const anio = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
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

async function fetchLinkMP(pagoId) {
  try {
    const { data } = await axios.post(
      `${env.API_BASE_URL}/pagosmensuales/${pagoId}/mercadopago-link`
    );
    return data.url ?? null;
  } catch (err) {
    console.warn(`⚠️  No se pudo generar link MP para pago ${pagoId}: ${err.message}`);
    return null;
  }
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
      pagoId: pago.id,
    });
  }

  const sinTelefono = new Set(pagosUnicos.map((p) => p.titularId)).size - destinatarios.length;
  if (sinTelefono > 0) console.log(`⚠️  ${sinTelefono} titular(es) sin teléfono activo, omitidos.`);
  console.log(`📤 Destinatarios listos: ${destinatarios.length}`);

  console.log('💳 Generando links de Mercado Pago...');
  await Promise.all(
    destinatarios.map(async (dest) => {
      if (!dest.pagoId) return;
      dest.linkMP = await fetchLinkMP(dest.pagoId);
    })
  );
  const conLink = destinatarios.filter((d) => d.linkMP).length;
  console.log(`🔗 Links generados: ${conLink}/${destinatarios.length}`);

  return destinatarios;
}

function buildMensajePendientes(destinatario) {
  const periodoNatural = formatPeriodoNatural(destinatario.periodo);
  const linkLinea = destinatario.linkMP
    ? `\n💳 Pagá con Mercado Pago:\n${destinatario.linkMP}\n`
    : '';
  return (
    `Hola! 🚌\n\n` +
    `Te recordamos que tenés la cuota del mes *${periodoNatural}* pendiente por *${formatMonto(destinatario.saldoPendiente)}*.` +
    `${linkLinea}\n` +
    `¡Muchas gracias! 😊`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Comando: recordatorio
// ─────────────────────────────────────────────────────────────────────────────

async function fetchDestinatariosRecordatorio() {
  const periodo = getPeriodoSiguiente();
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
    `¡Buen dia! 🚌\n\n` +
    `Los pagos son por adelantado del 1 al 10 de cada mes. Te recordamos que la cuota del servicio de transporte escolar correspondiente al mes de *${periodoNatural}* es de *${formatMonto(destinatario.monto)}*.\n\n` +
    `Podés abonar por transferencia o en efectivo. ¡Gracias por confiar en nosotros! 😊`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Comando: personalizado
// ─────────────────────────────────────────────────────────────────────────────

async function fetchDestinatariosPersonalizado() {
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
      return { telefono };
    })
    .filter(Boolean);

  const sinTelefono = titulares.length - destinatarios.length;
  if (sinTelefono > 0) console.log(`⚠️  ${sinTelefono} titular(es) sin teléfono activo, omitidos.`);
  console.log(`📤 Destinatarios listos: ${destinatarios.length}`);

  return destinatarios;
}

// ─────────────────────────────────────────────────────────────────────────────
// Comando: prueba
// ─────────────────────────────────────────────────────────────────────────────

const TELEFONO_PRUEBA = '543814488860';

async function fetchDestinatariosPrueba() {
  const periodo = getPeriodoActual();
  console.log(`\n🧪 Modo prueba — destinatario: ${TELEFONO_PRUEBA}`);

  const [{ data: pendientes }, { data: vencidos }] = await Promise.all([
    axios.get(`${env.API_BASE_URL}/pagosmensuales/pendientes`),
    axios.get(`${env.API_BASE_URL}/pagosmensuales/vencidos`),
  ]);

  const todos = [...(pendientes ?? []), ...(vencidos ?? [])];
  const delMes = todos.filter(
    (p) => p.mes === periodo.mes && p.anio === periodo.anio && p.saldoPendiente > 0
  );

  // Buscar el pago del titular de prueba por teléfono
  const titularIds = [...new Set(delMes.map((p) => p.titularId))];
  const telefonos = await cargarTelefonosPrincipales(titularIds);
  const pagoEncontrado = delMes.find(
    (p) => normalizeWhatsappNumber(telefonos[p.titularId]) === normalizeWhatsappNumber(TELEFONO_PRUEBA)
  );

  if (pagoEncontrado) {
    console.log('✅ Pago pendiente encontrado. Generando link MP...');
    const dest = {
      telefono: TELEFONO_PRUEBA,
      periodo: periodo.label,
      saldoPendiente: pagoEncontrado.saldoPendiente,
      pagoId: pagoEncontrado.id,
    };
    dest.linkMP = await fetchLinkMP(dest.pagoId);
    return [dest];
  }

  console.log('⚠️  Sin pago pendiente para ese número. Enviando mensaje básico de prueba.');
  return [{ telefono: TELEFONO_PRUEBA, periodo: periodo.label, saldoPendiente: 0 }];
}

function buildMensajePrueba(destinatario) {
  const periodoNatural = formatPeriodoNatural(destinatario.periodo);
  const linkLinea = destinatario.linkMP
    ? `\n💳 Pagá con Mercado Pago:\n${destinatario.linkMP}\n`
    : '';
  return (
    `🧪 *MENSAJE DE PRUEBA*\n\n` +
    `Hola Sebastian! 🚌\n` +
    `Cuota *${periodoNatural}* — *${formatMonto(destinatario.saldoPendiente)}*` +
    `${linkLinea}\n` +
    `(Este es un mensaje de prueba del sistema)`
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
  personalizado: {
    description: 'Mensaje personalizado a todos los titulares activos. Uso: node index.js personalizado "mensaje"',
    fetchDestinatarios: fetchDestinatariosPersonalizado,
    buildMensaje: null, // se asigna en main() con el texto del argumento
  },
  prueba: {
    description: 'Envía mensaje de prueba solo a Sebastian Zelarayan (+54 381448 8860).',
    fetchDestinatarios: fetchDestinatariosPrueba,
    buildMensaje: buildMensajePrueba,
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
      if (!numberId) {
        console.warn(`⚠️  ${destinatario.telefono} (${numeroWA}) no tiene WhatsApp activo, omitido.`);
        errores++;
        continue;
      }
      await client.sendMessage(numberId._serialized, buildMensaje(destinatario));
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
  const [, , commandName, mensajeArg] = process.argv;
  if (!commandName || !commands[commandName]) {
    printHelp();
    process.exit(1);
  }

  const commandConfig = { ...commands[commandName] };

  if (commandName === 'personalizado') {
    if (!mensajeArg || !mensajeArg.trim()) {
      console.error('❌ Debés pasar el mensaje como segundo argumento.');
      console.error('   Ejemplo: node index.js personalizado "Tu mensaje aquí"');
      process.exit(1);
    }
    const texto = mensajeArg.trim();
    commandConfig.buildMensaje = () => texto;
  }

  await runCommand(commandName, commandConfig);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Error fatal:', err.message);
    process.exit(1);
  });
