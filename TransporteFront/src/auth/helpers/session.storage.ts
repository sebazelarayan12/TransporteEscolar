import type { Session } from '../types/auth.types';

const SESSION_KEY = 'transporte.sesion';

/** Evento de `window` que se dispara cuando la sesión se guarda o se limpia. */
export const SESSION_EVENT = 'transporte:sesion';

const notificar = () => {
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
};

const esSesionValida = (valor: unknown): valor is Session => {
  if (typeof valor !== 'object' || valor === null) return false;
  const { token, expiraEn } = valor as Record<string, unknown>;
  if (typeof token !== 'string' || token === '') return false;
  if (typeof expiraEn !== 'string') return false;
  return !Number.isNaN(Date.parse(expiraEn));
};

const borrarSilencioso = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // localStorage bloqueado: no hay nada que limpiar.
  }
};

/** Devuelve la sesión vigente; si venció o está malformada la limpia y devuelve null. */
export const getSession = (): Session | null => {
  let raw: string | null;
  try {
    raw = localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (esSesionValida(parsed) && Date.parse(parsed.expiraEn) > Date.now()) {
      return { token: parsed.token, expiraEn: parsed.expiraEn };
    }
  } catch {
    // JSON roto: se trata como sesión inexistente.
  }

  borrarSilencioso();
  return null;
};

export const saveSession = (session: Session): void => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: session.token, expiraEn: session.expiraEn }));
  } catch {
    // Sin almacenamiento la sesión no persiste; el evento igual avisa del cambio.
  }
  notificar();
};

export const clearSession = (): void => {
  borrarSilencioso();
  notificar();
};
