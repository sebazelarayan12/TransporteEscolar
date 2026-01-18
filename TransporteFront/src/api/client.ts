import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config/env';

/**
 * Cliente HTTP centralizado usando Axios
 * Configurado con baseURL y interceptors preparados para auth futura
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
    // Request interceptor - preparado para agregar Authorization header
    this.client.interceptors.request.use(
      (config) => {
        // TODO: Cuando se implemente auth, agregar token aquí
        // const token = getAuthToken();
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - manejo centralizado de errores
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        // Normalizar errores para consumo consistente
        if (error.response) {
          // Error del servidor (4xx, 5xx)
          const errorData = error.response.data as any;
          throw {
            status: error.response.status,
            message: errorData?.message || 'Error en la solicitud',
            errors: errorData?.errors || {},
            originalError: error,
          };
        } else if (error.request) {
          // Request enviado pero sin respuesta
          throw {
            status: 0,
            message: 'No se pudo conectar con el servidor',
            errors: {},
            originalError: error,
          };
        } else {
          // Error al configurar el request
          throw {
            status: -1,
            message: error.message || 'Error desconocido',
            errors: {},
            originalError: error,
          };
        }
      }
    );
  }

  /**
   * GET request
   */
  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  /**
   * Acceso directo al cliente Axios para casos especiales
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
