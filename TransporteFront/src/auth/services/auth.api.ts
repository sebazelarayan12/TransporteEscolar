import { apiClient } from '../../api/client';
import type { LoginRequest, LoginResponse } from '../types/auth.types';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse, LoginRequest>('/auth/login', data);
  },
};
