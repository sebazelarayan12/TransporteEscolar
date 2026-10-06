import { keepPreviousData, useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { horariosApi } from './horarios.api';
import { horariosKeys } from './horarios.keys';
import { pasajerosKeys } from '../../pasajeros/services/pasajeros.keys';
import { recorridosKeys } from '../../recorridos/services/recorridos.keys';
import type {
  HorarioActualizarRequest,
  HorarioCrearRequest,
  HorarioResponse,
  HorarioPasajerosResponse,
  HorarioAsignacionDetalle,
} from '../types/horario.types';
import type { TransporteTipo } from '../../shared/types/transporte.types';

export { horariosKeys } from './horarios.keys';

const idlePasajerosKey = [...horariosKeys.all, 'pasajeros', 'idle'] as const;

export const useHorarios = (options?: { incluirInactivos?: boolean }) => {
  const incluirInactivos = options?.incluirInactivos ?? false;

  return useQuery({
    queryKey: incluirInactivos ? horariosKeys.listConInactivos() : horariosKeys.list(),
    queryFn: () => horariosApi.getHorarios(incluirInactivos),
    // Al alternar "Mostrar inactivos" se mantiene la lista a la vista mientras llega la otra.
    placeholderData: keepPreviousData,
  });
};

export const useHorariosOptions = () => {
  const query = useHorarios();
  const options = query.data?.map((horario) => ({ value: horario.id, label: horario.etiqueta })) ?? [];

  return {
    ...query,
    options,
    hasHorarios: options.length > 0,
  };
};

const invalidarHorarios = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: horariosKeys.all });
  // La etiqueta, el colegio y el orden se muestran en recorridos y pasajeros.
  queryClient.invalidateQueries({ queryKey: pasajerosKeys.all });
  queryClient.invalidateQueries({ queryKey: recorridosKeys.all });
};

export const useCrearHorario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: HorarioCrearRequest) => horariosApi.crear(data),
    onSuccess: () => invalidarHorarios(queryClient),
  });
};

export const useActualizarHorario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: HorarioActualizarRequest }) => horariosApi.actualizar(id, data),
    onSuccess: () => invalidarHorarios(queryClient),
  });
};

export const useDesactivarHorario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => horariosApi.desactivar(id),
    onSuccess: () => invalidarHorarios(queryClient),
  });
};

export const useReactivarHorario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => horariosApi.reactivar(id),
    onSuccess: () => invalidarHorarios(queryClient),
  });
};

export const useHorarioPasajeros = (horarioId: number | null, options?: { enabled?: boolean }) => {
  const enabled = Boolean(horarioId) && (options?.enabled ?? true);

  return useQuery<HorarioPasajerosResponse>({
    queryKey: horarioId ? horariosKeys.pasajeros(horarioId) : idlePasajerosKey,
    queryFn: () => horariosApi.getPasajeros(horarioId!),
    enabled,
  });
};

interface AsignarPasajerosVariables {
  horarioId: number;
  pasajeros: HorarioAsignacionDetalle[];
  transporte?: TransporteTipo;
}

export const useAsignarPasajerosAHorario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ horarioId, pasajeros, transporte }: AsignarPasajerosVariables) =>
      horariosApi.asignarPasajeros(horarioId, {
        pasajeros,
        pasajeroIds: pasajeros.map((pasajero) => pasajero.pasajeroId),
        transporte,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: horariosKeys.list() });
      queryClient.invalidateQueries({ queryKey: horariosKeys.detail(variables.horarioId) });
      queryClient.invalidateQueries({ queryKey: horariosKeys.pasajeros(variables.horarioId) });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.all });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pasajerosKeys.activos() });
    },
  });
};

export const sortHorariosByOrden = (items: HorarioResponse[] = []) =>
  [...items].sort((a, b) => a.orden - b.orden);
