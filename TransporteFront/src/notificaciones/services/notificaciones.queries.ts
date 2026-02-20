import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificacionesApi } from './notificaciones.api';
import type { NotificacionesFilterRequest } from '../types/notificacion.types';
import { POLLING_INTERVAL_MS } from '../constants/notificacion.constants';

/**
 * Query keys para el dominio de notificaciones
 */
export const notificacionesKeys = {
  all: ['notificaciones'] as const,
  lists: () => [...notificacionesKeys.all, 'list'] as const,
  list: (params: NotificacionesFilterRequest) => [...notificacionesKeys.lists(), params] as const,
  countNoLeidas: () => [...notificacionesKeys.all, 'count-no-leidas'] as const,
};

/**
 * Hook para obtener notificaciones paginadas
 */
export function useNotificaciones(params: NotificacionesFilterRequest = {}) {
  return useQuery({
    queryKey: notificacionesKeys.list(params),
    queryFn: () => notificacionesApi.getPaginadas(params),
    staleTime: 10000, // 10 segundos
  });
}

/**
 * Hook para obtener el contador de notificaciones no leídas
 * Utiliza polling automático cada 30 segundos
 */
export function useNotificacionesCountNoLeidas(enabled = true) {
  return useQuery({
    queryKey: notificacionesKeys.countNoLeidas(),
    queryFn: () => notificacionesApi.getCountNoLeidas(),
    refetchInterval: POLLING_INTERVAL_MS,
    enabled,
    staleTime: 5000, // 5 segundos
  });
}

/**
 * Hook para marcar una notificación como leída
 */
export function useMarcarNotificacionLeida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificacionesApi.marcarComoLeida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.all });
    },
  });
}

/**
 * Hook para marcar todas las notificaciones como leídas
 */
export function useMarcarTodasNotificacionesLeidas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificacionesApi.marcarTodasComoLeidas(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.all });
    },
  });
}

/**
 * Hook para eliminar una notificación
 */
export function useEliminarNotificacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificacionesApi.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.all });
    },
  });
}
