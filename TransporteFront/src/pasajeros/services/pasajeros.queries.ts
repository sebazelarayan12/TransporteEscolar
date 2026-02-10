import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pasajerosApi } from './pasajeros.api';
import type { PasajeroRequest, PasajeroUpdateRequest, PasajeroFilterRequest } from '../types/pasajero.types';

/**
 * Query keys para cache de Pasajeros
 */
export const pasajerosKeys = {
  all: ['pasajeros'] as const,
  lists: () => [...pasajerosKeys.all, 'list'] as const,
  list: (filters?: string) => [...pasajerosKeys.lists(), { filters }] as const,
  activos: () => [...pasajerosKeys.all, 'activos'] as const,
  disponibles: (anio: number) => [...pasajerosKeys.all, 'disponibles', anio] as const,
  paginados: (filter: PasajeroFilterRequest) => [...pasajerosKeys.all, 'paginados', filter] as const,
  byTitular: (titularId: number) => [...pasajerosKeys.all, 'titular', titularId] as const,
  details: () => [...pasajerosKeys.all, 'detail'] as const,
  detail: (id: number) => [...pasajerosKeys.details(), id] as const,
};

/**
 * Hook para obtener todos los pasajeros
 */
export const usePasajeros = () => {
  return useQuery({
    queryKey: pasajerosKeys.lists(),
    queryFn: () => pasajerosApi.getAll(),
  });
};

/**
 * Hook para obtener pasajeros activos
 */
export const usePasajerosActivos = () => {
  return useQuery({
    queryKey: pasajerosKeys.activos(),
    queryFn: () => pasajerosApi.getActivos(),
  });
};

/**
 * Hook para obtener pasajeros disponibles para reinscripción por año
 */
export const usePasajerosDisponibles = (anio: number) => {
  return useQuery({
    queryKey: pasajerosKeys.disponibles(anio),
    queryFn: () => pasajerosApi.getActivosDisponibles(anio),
    enabled: !!anio,
  });
};

/**
 * Hook para obtener pasajeros con paginación
 */
export const usePasajerosPaginados = (filter: PasajeroFilterRequest) => {
  return useQuery({
    queryKey: pasajerosKeys.paginados(filter),
    queryFn: () => pasajerosApi.getPaginados(filter),
    placeholderData: (previousData) => previousData, // Mantiene datos previos mientras carga
    staleTime: 30000, // Considera datos frescos por 30 segundos
  });
};

/**
 * Hook para obtener pasajeros por titular
 */
export const usePasajerosByTitular = (titularId: number) => {
  return useQuery({
    queryKey: pasajerosKeys.byTitular(titularId),
    queryFn: () => pasajerosApi.getByTitular(titularId),
    enabled: !!titularId,
  });
};

/**
 * Hook para obtener un pasajero por ID
 */
export const usePasajero = (id: number) => {
  return useQuery({
    queryKey: pasajerosKeys.detail(id),
    queryFn: () => pasajerosApi.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook para crear un pasajero
 */
export const useCreatePasajero = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PasajeroRequest) => pasajerosApi.create(data),
    onSuccess: (newPasajero) => {
      // Invalidar cache para refrescar listados
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.activos() });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.all }); // Invalida paginados también
      queryClient.invalidateQueries({
        queryKey: pasajerosKeys.byTitular(newPasajero.titularId),
      });
    },
  });
};

/**
 * Hook para actualizar un pasajero
 */
export const useUpdatePasajero = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PasajeroUpdateRequest }) =>
      pasajerosApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidar cache del detalle y listados
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.activos() });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.all }); // Invalida paginados también
    },
  });
};

/**
 * Hook para dar de baja un pasajero
 */
export const useDeletePasajero = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => pasajerosApi.delete(id),
    onSuccess: () => {
      // Invalidar cache completo de pasajeros
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.all });
    },
  });
};
