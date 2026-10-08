// Genera las variables de entorno de autenticacion para pegar en Dokploy.
// Uso: node scripts/generar-credenciales-auth.mjs ["contrasena"] ["usuario"]
//   - contrasena: opcional; si no se pasa se genera una de 24 caracteres alfanumericos aleatorios.
//   - usuario: opcional; por defecto "admin".
// Imprime secretos en stdout. No escribe archivos ni guarda nada.
// El hash usa exactamente el formato de PasswordHasher (PBKDF2-SHA256, 600000 iteraciones, sal 16 bytes, hash 32 bytes).
import { randomBytes, randomInt, pbkdf2Sync } from 'node:crypto';

const ITERACIONES = 600000;
const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const [, , passwordArg, usuarioArg] = process.argv;
const generada = !passwordArg;
const password = passwordArg ?? Array.from({ length: 24 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('');
const usuario = usuarioArg || 'admin';

const sal = randomBytes(16);
const hash = pbkdf2Sync(Buffer.from(password, 'utf8'), sal, ITERACIONES, 32, 'sha256');
const secreto = randomBytes(48).toString('base64url');

const lineas = [
  `Auth__Usuario=${usuario}`,
  `Auth__PasswordHash=pbkdf2-sha256$${ITERACIONES}$${sal.toString('base64')}$${hash.toString('base64')}`,
  `Jwt__Secret=${secreto}`,
  'Auth__Enforce=false',
];
if (generada) {
  lineas.push(`# Contraseña en claro (guardala en tu gestor y no la compartas): ${password}`);
}
console.log(lineas.join('\n'));
