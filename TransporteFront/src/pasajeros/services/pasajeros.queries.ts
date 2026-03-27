import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pasajerosApi } from './pasajeros.api';
import type {
  PasajeroRequest,
  PasajeroUpdateRequest,
  PasajeroFilterRequest,
  PasajeroHorarioAsignacionPayload,
  PasajeroResponse,
} from '../types/pasajero.types';
import { pasajerosKeys } from './pasajeros.keys';
import { horariosKeys } from '../../horarios/services/horarios.keys';

export { pasajerosKeys } from './pasajeros.keys';

const invalidateHorarioById = (queryClient: ReturnType<typeof useQueryClient>, horarioId: number) => {
  queryClient.invalidateQueries({ queryKey: horariosKeys.detail(horarioId) });
  queryClient.invalidateQueries({ queryKey: horariosKeys.pasajeros(horarioId) });
};

const invalidateHorariosFromPasajero = (
  queryClient: ReturnType<typeof useQueryClient>,
  pasajero?: PasajeroResponse,
) => {
  if (!pasajero) return;
  for (const asignacion of pasajero.horariosAsignados ?? []) {
    invalidateHorarioById(queryClient, asignacion.horarioId);
  }
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
 * Hook para obtener pasajeros sin horarios asignados
 */
export const usePasajerosSinHorarios = () => {
  return useQuery({
    queryKey: pasajerosKeys.sinHorarios(),
    queryFn: () => pasajerosApi.getSinHorarios(),
    staleTime: 60000,
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
      queryClient.invalidateQueries({ queryKey: horariosKeys.list() });
      queryClient.invalidateQueries({ queryKey: horariosKeys.all });
      invalidateHorariosFromPasajero(queryClient, newPasajero);
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
      queryClient.invalidateQueries({ queryKey: horariosKeys.all });
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
      queryClient.invalidateQueries({ queryKey: horariosKeys.all });
    },
  });
};

interface AgregarHorarioVariables extends PasajeroHorarioAsignacionPayload {
  pasajeroId: number;
}

interface EliminarHorarioVariables {
  pasajeroId: number;
  horarioId: number;
}

export const useAgregarHorarioPasajero = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pasajeroId, ...payload }: AgregarHorarioVariables) =>
      pasajerosApi.addHorario(pasajeroId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.detail(variables.pasajeroId) });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.all });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.activos() });
      queryClient.invalidateQueries({ queryKey: horariosKeys.list() });
      queryClient.invalidateQueries({ queryKey: horariosKeys.all });
      invalidateHorarioById(queryClient, variables.horarioId);
    },
  });
};

export const useEliminarHorarioPasajero = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pasajeroId, horarioId }: EliminarHorarioVariables) =>
      pasajerosApi.deleteHorario(pasajeroId, horarioId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.detail(variables.pasajeroId) });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.all });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.activos() });
      queryClient.invalidateQueries({ queryKey: horariosKeys.list() });
      queryClient.invalidateQueries({ queryKey: horariosKeys.all });
      invalidateHorarioById(queryClient, variables.horarioId);
    },
  });
};
