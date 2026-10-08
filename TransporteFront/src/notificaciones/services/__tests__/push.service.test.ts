import { beforeEach, describe, expect, it, vi } from 'vitest';

const postMessage = vi.fn();

const instalarServiceWorker = () => {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      getRegistration: () => Promise.resolve({ active: { postMessage } }),
      controller: null,
    },
  });
};

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  postMessage.mockClear();
  instalarServiceWorker();
});

describe('sincronización del token con el service worker', () => {
  it('envía el token vigente al iniciar y null al cerrar sesión', async () => {
    const { iniciarSincronizacionTokenPush } = await import('../push.service');
    const { saveSession, clearSession } = await import('../../../auth/helpers/session.storage');
    saveSession({ token: 'tok', expiraEn: new Date(Date.now() + 3600_000).toISOString() });

    iniciarSincronizacionTokenPush();
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledWith({ type: 'SET_AUTH_TOKEN', token: 'tok' }));

    clearSession();
    await vi.waitFor(() => expect(postMessage).toHaveBeenLastCalledWith({ type: 'SET_AUTH_TOKEN', token: null }));
  });

  it('es idempotente: iniciar dos veces registra un solo listener de sesión', async () => {
    const { iniciarSincronizacionTokenPush } = await import('../push.service');
    const { SESSION_EVENT } = await import('../../../auth/helpers/session.storage');
    const addSpy = vi.spyOn(window, 'addEventListener');

    iniciarSincronizacionTokenPush();
    iniciarSincronizacionTokenPush();

    const registros = addSpy.mock.calls.filter(([evento]) => evento === SESSION_EVENT);
    expect(registros).toHaveLength(1);
    addSpy.mockRestore();
  });
});
