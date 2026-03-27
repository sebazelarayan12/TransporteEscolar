import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pasajerosKeys } from '../../pasajeros/services/pasajeros.keys';
import { titularesApi } from './titulares.api';
import type {
  TitularRequest,
  TitularUpdateRequest,
  TitularTelefonoRequest,
  TitularFilterRequest,
} from '../types/titular.types';

/**
 * Query keys para cache de Titulares
 */
export const titularesKeys = {
  all: ['titulares'] as const,
  lists: () => [...titularesKeys.all, 'list'] as const,
  list: (filters?: string) => [...titularesKeys.lists(), { filters }] as const,
  activos: () => [...titularesKeys.all, 'activos'] as const,
  sinTelefonos: () => [...titularesKeys.all, 'sin-telefonos'] as const,
  paginados: (filter: TitularFilterRequest) => [...titularesKeys.all, 'paginados', filter] as const,
  selector: () => [...titularesKeys.all, 'selector'] as const,
  details: () => [...titularesKeys.all, 'detail'] as const,
  detail: (id: number) => [...titularesKeys.details(), id] as const,
  telefonos: (id: number) => [...titularesKeys.detail(id), 'telefonos'] as const,
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
 * Hook para obtener titulares sin teléfonos cargados
 */
export const useTitularesSinTelefonos = () => {
  return useQuery({
    queryKey: titularesKeys.sinTelefonos(),
    queryFn: () => titularesApi.getSinTelefonos(),
    staleTime: 60000,
  });
};

/**
 * Hook para obtener titulares con paginación
 */
export const useTitularesPaginados = (filter: TitularFilterRequest) => {
  return useQuery({
    queryKey: titularesKeys.paginados(filter),
    queryFn: () => titularesApi.getPaginados(filter),
    placeholderData: (previousData) => previousData, // Mantiene datos previos mientras carga
    staleTime: 30000, // Considera datos frescos por 30 segundos
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
 * Hook para obtener teléfonos de un titular
 */
export const useTitularTelefonos = (id?: number) => {
  return useQuery({
    queryKey: titularesKeys.telefonos(id ?? 0),
    queryFn: () => titularesApi.getTelefonos(id!),
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
      queryClient.invalidateQueries({ queryKey: titularesKeys.all }); // Invalida paginados también
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
      queryClient.invalidateQueries({ queryKey: titularesKeys.all }); // Invalida paginados también
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
    onSuccess: (_, id) => {
      if (typeof id === 'number') {
        queryClient.invalidateQueries({ queryKey: titularesKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: titularesKeys.telefonos(id) });
      }
      queryClient.invalidateQueries({ queryKey: titularesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: titularesKeys.activos() });
      queryClient.invalidateQueries({ queryKey: titularesKeys.selector() });
      queryClient.invalidateQueries({ queryKey: titularesKeys.all });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.all });
    },
  });
};

/**
 * Hook para reactivar un titular dado de baja
 */
export const useReactivarTitular = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => titularesApi.reactivate(id),
    onSuccess: (_, id) => {
      if (typeof id === 'number') {
        queryClient.invalidateQueries({ queryKey: titularesKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: titularesKeys.telefonos(id) });
      }
      queryClient.invalidateQueries({ queryKey: titularesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: titularesKeys.activos() });
      queryClient.invalidateQueries({ queryKey: titularesKeys.selector() });
      queryClient.invalidateQueries({ queryKey: titularesKeys.all });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.all });
    },
  });
};

/**
 * Hook para agregar un teléfono a un titular
 */
export const useAddTitularTelefono = (titularId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TitularTelefonoRequest) => titularesApi.addTelefono(titularId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: titularesKeys.telefonos(titularId) });
      queryClient.invalidateQueries({ queryKey: titularesKeys.detail(titularId) });
    },
  });
};

/**
 * Hook para actualizar un teléfono de un titular
 */
export const useUpdateTitularTelefono = (titularId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ telefonoId, numeroE164 }: { telefonoId: number; numeroE164: string }) =>
      titularesApi.updateTelefono(titularId, telefonoId, numeroE164),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: titularesKeys.telefonos(titularId) });
      queryClient.invalidateQueries({ queryKey: titularesKeys.detail(titularId) });
    },
  });
};

/**
 * Hook para marcar un teléfono como principal
 */
export const useMarkTitularTelefonoPrincipal = (titularId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (telefonoId: number) => titularesApi.markTelefonoPrincipal(titularId, telefonoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: titularesKeys.telefonos(titularId) });
      queryClient.invalidateQueries({ queryKey: titularesKeys.detail(titularId) });
    },
  });
};
