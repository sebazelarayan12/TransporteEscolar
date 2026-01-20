import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { titularesApi } from './titulares.api';
import type { TitularRequest, TitularUpdateRequest } from '../types/titular.types';

/**
 * Query keys para cache de Titulares
 */
export const titularesKeys = {
  all: ['titulares'] as const,
  lists: () => [...titularesKeys.all, 'list'] as const,
  list: (filters?: string) => [...titularesKeys.lists(), { filters }] as const,
  activos: () => [...titularesKeys.all, 'activos'] as const,
  selector: () => [...titularesKeys.all, 'selector'] as const,
  details: () => [...titularesKeys.all, 'detail'] as const,
  detail: (id: number) => [...titularesKeys.details(), id] as const,
};

/**
 * Hook para obtener todos los titulares
 */
export const useTitulares = () => {
  return useQuery({
    queryKey: titularesKeys.lists(),
    queryFn: () => titularesApi.getAll(),
  });
};

/**
 * Hook para obtener titulares activos
 */
export const useTitularesActivos = () => {
  return useQuery({
    queryKey: titularesKeys.activos(),
    queryFn: () => titularesApi.getActivos(),
  });
};

/**
 * Hook para obtener titulares para selector/dropdown
 */
export const useTitularesSelector = () => {
  return useQuery({
    queryKey: titularesKeys.selector(),
    queryFn: () => titularesApi.getSelector(),
  });
};

/**
 * Hook para obtener un titular por ID
 */
export const useTitular = (id: number) => {
  return useQuery({
    queryKey: titularesKeys.detail(id),
    queryFn: () => titularesApi.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook para crear un titular
 */
export const useCreateTitular = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TitularRequest) => titularesApi.create(data),
    onSuccess: () => {
      // Invalidar cache para refrescar listados
      queryClient.invalidateQueries({ queryKey: titularesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: titularesKeys.activos() });
      queryClient.invalidateQueries({ queryKey: titularesKeys.selector() });
    },
  });
};

/**
 * Hook para actualizar un titular
 */
export const useUpdateTitular = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TitularUpdateRequest }) =>
      titularesApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidar cache del detalle y listados
      queryClient.invalidateQueries({ queryKey: titularesKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: titularesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: titularesKeys.activos() });
      queryClient.invalidateQueries({ queryKey: titularesKeys.selector() });
    },
  });
};

/**
 * Hook para dar de baja un titular
 */
export const useDeleteTitular = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => titularesApi.delete(id),
    onSuccess: () => {
      // Invalidar cache completo de titulares
      queryClient.invalidateQueries({ queryKey: titularesKeys.all });
    },
  });
};
