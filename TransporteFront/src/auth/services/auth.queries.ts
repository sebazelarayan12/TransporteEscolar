import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from './auth.api';
import { saveSession } from '../helpers/session.storage';
import type { LoginRequest } from '../types/auth.types';

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credenciales: LoginRequest) => authApi.login(credenciales),
    onSuccess: (session) => {
      saveSession(session);
      // Con sesión nueva, nada de lo cacheado antes del login debe darse por bueno.
      void queryClient.invalidateQueries();
    },
  });
};
