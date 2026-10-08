import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiClient } from '../client';
import { SESSION_EVENT, saveSession } from '../../auth/helpers/session.storage';

const instancia = apiClient.getAxiosInstance();
let ultimaConfig: InternalAxiosRequestConfig | undefined;

const usarAdapter = (status: number, data: unknown = {}) => {
  const adapter: AxiosAdapter = (config) => {
    ultimaConfig = config;
    const response = { data, status, statusText: '', headers: {}, config } as AxiosResponse;
    if (status >= 400) {
      return Promise.reject(Object.assign(new Error('fallo'), { isAxiosError: true, config, response }));
    }
    return Promise.resolve(response);
  };
  instancia.defaults.adapter = adapter;
};

const iniciarSesion = () => saveSession({ token: 'token-de-prueba', expiraEn: new Date(Date.now() + 3600_000).toISOString() });

beforeEach(() => {
  localStorage.clear();
  ultimaConfig = undefined;
});

describe('apiClient: sesión', () => {
  it('con sesión agrega el header Authorization Bearer', async () => {
    usarAdapter(200);
    iniciarSesion();

    await apiClient.get('/titulares');

    expect(ultimaConfig?.headers.get('Authorization')).toBe('Bearer token-de-prueba');
  });

  it('sin sesión no agrega el header Authorization', async () => {
    usarAdapter(200);

    await apiClient.get('/titulares');

    expect(ultimaConfig?.headers.get('Authorization')).toBeFalsy();
  });

  it('un 401 en un pedido normal limpia la sesión y avisa', async () => {
    usarAdapter(401);
    iniciarSesion();
    const listener = vi.fn();
    window.addEventListener(SESSION_EVENT, listener);

    await expect(apiClient.get('/titulares')).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem('transporte.sesion')).toBeNull();
    expect(listener).toHaveBeenCalled();
    window.removeEventListener(SESSION_EVENT, listener);
  });

  it('un 401 del propio login no limpia la sesión', async () => {
    usarAdapter(401);
    iniciarSesion();

    await expect(apiClient.post('/auth/login', { usuario: 'a', password: 'b' })).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem('transporte.sesion')).not.toBeNull();
  });

  it.each([400, 403, 404, 500])('un %i no limpia la sesión', async (status) => {
    usarAdapter(status);
    iniciarSesion();

    await expect(apiClient.get('/titulares')).rejects.toMatchObject({ status });

    expect(localStorage.getItem('transporte.sesion')).not.toBeNull();
  });
});
