import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config/env';
import type { ApiError } from '../shared/types/api.types';
import { clearSession, getSession } from '../auth/helpers/session.storage';

type RequestParams = Record<string, string | number | boolean | undefined>;

/**
 * Cliente HTTP centralizado usando Axios
 * Configurado con baseURL e interceptors: agrega el Bearer de la sesión y
 * limpia la sesión ante un 401 (salvo el del propio login)
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - agrega el token de la sesión vigente
    this.client.interceptors.request.use(
      (config) => {
        const session = getSession();
        if (session) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - manejo centralizado de errores
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError<unknown>) => {
        const esLogin = error.config?.url?.endsWith('/auth/login') ?? false;
        if (error.response?.status === 401 && !esLogin) {
          clearSession();
        }
        throw this.normalizeError(error);
      }
    );
  }

  /**
   * GET request
   */
  async get<TResponse>(url: string, params?: RequestParams): Promise<TResponse> {
    const response = await this.client.get<TResponse>(url, { params });
    return response.data;
  }

  /**
   * POST request
   */
  async post<TResponse, TPayload = unknown>(url: string, data?: TPayload): Promise<TResponse> {
    const response = await this.client.post<TResponse>(url, data);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<TResponse, TPayload = unknown>(url: string, data?: TPayload): Promise<TResponse> {
    const response = await this.client.put<TResponse>(url, data);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<TResponse, TPayload = unknown>(url: string, data?: TPayload): Promise<TResponse> {
    const response = await this.client.patch<TResponse>(url, data);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<TResponse>(url: string): Promise<TResponse> {
    const response = await this.client.delete<TResponse>(url);
    return response.data;
  }

  /**
   * Acceso directo al cliente Axios para casos especiales
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }

  private normalizeError(error: AxiosError<unknown>): ApiError {
    if (error.response) {
      const payload = this.parseErrorPayload(error.response.data);
      return {
        status: error.response.status,
        message: payload.message ?? 'Error en la solicitud',
        errors: payload.errors ?? {},
        originalError: error,
      };
    }

    if (error.request) {
      return {
        status: 0,
        message: 'No se pudo conectar con el servidor',
        errors: {},
        originalError: error,
      };
    }

    return {
      status: -1,
      message: error.message || 'Error desconocido',
      errors: {},
      originalError: error,
    };
  }

  private parseErrorPayload(data: unknown): { message?: string; errors?: Record<string, string[]> } {
    if (!this.isRecord(data)) {
      return {};
    }

    const message = typeof data.message === 'string' ? data.message : undefined;
    const errors = this.extractErrorBag(data.errors);

    return { message, errors };
  }

  private extractErrorBag(value: unknown): Record<string, string[]> | undefined {
    if (!this.isRecord(value)) {
      return undefined;
    }

    const parsedErrors = Object.entries(value).reduce<Record<string, string[]>>((acc, [key, rawValue]) => {
      if (Array.isArray(rawValue)) {
        const messages = rawValue.filter((item): item is string => typeof item === 'string');
        if (messages.length > 0) {
          acc[key] = messages;
        }
      }
      return acc;
    }, {});

    return Object.keys(parsedErrors).length > 0 ? parsedErrors : undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}

export const apiClient = new ApiClient();
