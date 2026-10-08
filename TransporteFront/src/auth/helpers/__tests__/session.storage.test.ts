import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_EVENT, clearSession, getSession, saveSession } from '../session.storage';

const futuro = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();
const pasado = () => new Date(Date.now() - 60 * 1000).toISOString();

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('session.storage', () => {
  it('guarda y lee la sesión vigente', () => {
    const expiraEn = futuro();
    saveSession({ token: 'abc', expiraEn });

    expect(getSession()).toEqual({ token: 'abc', expiraEn });
  });

  it('devuelve null y limpia cuando la sesión venció', () => {
    localStorage.setItem('transporte.sesion', JSON.stringify({ token: 'abc', expiraEn: pasado() }));

    expect(getSession()).toBeNull();
    expect(localStorage.getItem('transporte.sesion')).toBeNull();
  });

  it('devuelve null y limpia cuando el JSON está roto', () => {
    localStorage.setItem('transporte.sesion', '{no-es-json');

    expect(getSession()).toBeNull();
    expect(localStorage.getItem('transporte.sesion')).toBeNull();
  });

  it('devuelve null y limpia cuando la forma es inválida', () => {
    localStorage.setItem('transporte.sesion', JSON.stringify({ token: 123 }));

    expect(getSession()).toBeNull();
    expect(localStorage.getItem('transporte.sesion')).toBeNull();
  });

  it('no rompe si localStorage lanza al leer, guardar o limpiar', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });

    expect(getSession()).toBeNull();
    expect(() => saveSession({ token: 'abc', expiraEn: futuro() })).not.toThrow();
    expect(() => clearSession()).not.toThrow();
  });

  it('dispara el evento al guardar y al limpiar', () => {
    const listener = vi.fn();
    window.addEventListener(SESSION_EVENT, listener);

    saveSession({ token: 'abc', expiraEn: futuro() });
    expect(listener).toHaveBeenCalledTimes(1);

    clearSession();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(getSession()).toBeNull();

    window.removeEventListener(SESSION_EVENT, listener);
  });
});
