import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reinscripcionesApi } from './reinscripciones.api';
import type { CrearReinscripcionRequest } from '../types/reinscripcion.types';

export const QUERY_KEYS = {
  reinscripciones: (anio: number) => ['reinscripciones', anio] as const,
  reinscripcionById: (id: number) => ['reinscripciones', id] as const,
};

/**
 * Hook para obtener todas las reinscripciones de un año
 */
export function useReinscripciones(anio: number = new Date().getFullYear()) {
  return useQuery({
    queryKey: QUERY_KEYS.reinscripciones(anio),
    queryFn: async () => {
      return await reinscripcionesApi.getAll(anio);
    },
  });
}

/**
 * Hook para obtener una reinscripción por ID
 */
export function useReinscripcionById(id: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.reinscripcionById(id!),
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
      // Invalidar cache para el año correspondiente
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reinscripciones(variables.anio) });
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
      // Invalidar todas las queries de reinscripciones
      queryClient.invalidateQueries({ queryKey: ['reinscripciones'] });
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
      // Invalidar todas las queries de reinscripciones
      queryClient.invalidateQueries({ queryKey: ['reinscripciones'] });
    },
  });
}
