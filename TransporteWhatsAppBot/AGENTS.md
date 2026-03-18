# TransporteWhatsAppBot – AI Agent Ruleset

## Rol y Alcance
Este agente cubre el bot CLI construido con Node.js 22 + `whatsapp-web.js` que vive en `TransporteWhatsAppBot/`. Solo recibe tareas delegadas por el orquestador. Antes de modificar cualquier archivo:
1. Lee este documento completo para conocer el contexto vigente.
2. Invoca los skills requeridos (tabla de Auto-invoke) cuando la tarea coincida con la acción descrita.
3. Después de cada cambio, actualiza la sección **Context Snapshot** (subapartados “Recent Bot Changes” y “Key Files & Config”) con la nueva información.

## Skills Reference
- **brainstorming** – Cuando se diseñen nuevos flujos de mensajes, plantillas o estrategias de envío.
- **systematic-debugging** – Diagnóstico de errores en la CLI, dependencias o integración HTTP.

*(El bot comparte las mismas skills globales que el repositorio; sólo se enumeran aquí las imprescindibles para su naturaleza.)*

## Auto-invoke Skills
| Acción | Skill |
| --- | --- |
| Definir nuevos comandos, plantillas o comportamiento del bot | brainstorming |
| Investigar fallas (errores de Node, sesión, API, WhatsApp) | systematic-debugging |

## Context Snapshot (marzo 2026) – mantener actualizado
### Bot Overview
- CLI escrita en CommonJS (`index.js`) que usa `whatsapp-web.js` con `LocalAuth` y Puppeteer headless.
- Dependencias clave: `whatsapp-web.js`, `axios`, `qrcode-terminal`, `dotenv`.
- Configuración central en `config.js`: define `activeEnvironment`, `API_BASE_URL`, `API_TOKEN?`, `dryRun`, `sessionFolder` y delays.
- Node 22.20.0 y npm 10.x. Ejecutar desde `TransporteWhatsAppBot/`.

### Comandos actuales
1. `pendientes` – Consulta `GET /pagosmensuales/pendientes` y `/vencidos`, filtra el mes actual y notifica a titulares con saldo pendiente.
2. `recordatorio` – Consulta `GET /titulares/activos` y envía recordatorio del monto pactado para el mes actual.
Ambos comandos comparten utilidades: `getPeriodoActual`, `formatMonto`, `normalizeWhatsappNumber`, `cargarTelefonosPrincipales`.

### Recent Bot Changes
- mar 2026: Mensajes actualizados para mencionar “mes <nombre> <año>” y copy nuevo para recordatorio/pending.
- mar 2026: Dependencias reinstaladas (npm install) para incluir `whatsapp-web.js` y amigos.

### Key Files & Config
- `index.js` – Define comandos, plantillas de mensajes, login y loop de envío.
- `config.js` – Ambientes (Production, Testing) y flag `dryRun`.
- `package.json` – scripts (`npm start`), dependencias.
- `sesion_whatsapp/` – carpeta de LocalAuth (NO subir al repo).
- `.env` (si aplica) – API keys; excluido por `.gitignore`.

### Update Protocol
1. Documenta cada cambio funcional en “Recent Bot Changes” con fecha y descripción.
2. Si modificas plantillas o agregas comandos, explica su propósito y actualiza “Comandos actuales”.
3. Registra archivos nuevos/obsoletos en “Key Files & Config”.
4. No cierres una tarea delegada hasta reflejar estas notas.

## Guardrails
- Nunca comuniques o subas códigos QR fuera de la consola local.
- Mantén `dryRun` activado para pruebas a menos que el usuario solicite envío real.
- No agregues secretos en el repositorio; usa `config.js` solo para referencias y lee valores desde `.env` o variables de entorno.
- No borres carpetas de sesión sin avisar al usuario (se requiere reautenticación manual).
- Los mensajes deben mantenerse en español y alineados con el tono institucional.

## Comandos & Uso
```bash
# Instalar dependencias
cd TransporteWhatsAppBot
npm install

# Ejecutar comandos
node index.js pendientes
node index.js recordatorio

# Script package.json
npm start <comando>   # equivalente a node index.js <comando>
```

## QA Checklist
- [ ] `npm install` finalizado sin errores críticos.
- [ ] `node index.js <comando>` funciona en modo `dryRun` (muestra destinatarios y mensajes).
- [ ] Se validó que las plantillas incluyen mes en texto natural y montos formateados.
- [ ] API base URL apunta al entorno correcto en `config.js` o `.env`.
- [ ] No se añadieron archivos de sesión ni credenciales al repositorio.

Mantén este archivo como la fuente de verdad del bot. El orquestador exigirá su actualización cada vez que edites esta carpeta.
