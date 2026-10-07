import { useMutation } from '@tanstack/react-query';
import { authApi } from './auth.api';
import { saveSession } from '../helpers/session.storage';
import type { LoginRequest } from '../types/auth.types';

export const useLogin = () =>
  useMutation({
    mutationFn: (credenciales: LoginRequest) => authApi.login(credenciales),
    onSuccess: (session) => saveSession(session),
  });
