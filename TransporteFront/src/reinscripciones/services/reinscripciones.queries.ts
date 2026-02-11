import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reinscripcionesApi } from './reinscripciones.api';
import type { CrearReinscripcionRequest, ReinscripcionListParams } from '../types/reinscripcion.types';
import { pasajerosKeys } from '../../pasajeros/services/pasajeros.queries';

export const reinscripcionesKeys = {
  root: ['reinscripciones'] as const,
  list: (params: ReinscripcionListParams) => [...reinscripcionesKeys.root, 'list', params] as const,
  detail: (id: number) => [...reinscripcionesKeys.root, 'detail', id] as const,
};

const idleListKey = [...reinscripcionesKeys.root, 'list', 'idle'] as const;

/**
 * Hook para obtener las reinscripciones por año + estado con paginación
 */
export function useReinscripciones(params: ReinscripcionListParams | null, options?: { enabled?: boolean }) {
  const enabled = Boolean(params) && (options?.enabled ?? true);

  return useQuery({
    queryKey: params ? reinscripcionesKeys.list(params) : idleListKey,
    queryFn: async () => {
      return await reinscripcionesApi.getAll(params!);
    },
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook para obtener una reinscripción por ID
 */
export function useReinscripcionById(id: number | null) {
  return useQuery({
    queryKey: reinscripcionesKeys.detail(id!),
    queryFn: async () => {
      return await reinscripcionesApi.getById(id!);
    },
    enabled: !!id,
  });
}

/**
 * Hook para crear una nueva reinscripción
 */
export function useCrearReinscripcion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CrearReinscripcionRequest) => reinscripcionesApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reinscripcionesKeys.root });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.disponibles(variables.anio) });
    },
  });
}

/**
 * Hook para confirmar una reinscripción
 */
export function useConfirmarReinscripcion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reinscripcionesApi.confirmar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reinscripcionesKeys.root });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.all });
    },
  });
}

/**
 * Hook para marcar como "No Continúa"
 */
export function useMarcarComoNoContinua() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reinscripcionesApi.marcarComoNoContinua(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reinscripcionesKeys.root });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.all });
    },
  });
}

/**
 * Hook para marcar como "Pendiente"
 */
export function useMarcarComoPendiente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reinscripcionesApi.marcarComoPendiente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reinscripcionesKeys.root });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.all });
    },
  });
}

