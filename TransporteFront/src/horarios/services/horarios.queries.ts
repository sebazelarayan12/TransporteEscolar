import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { horariosApi } from './horarios.api';
import { horariosKeys } from './horarios.keys';
import { pasajerosKeys } from '../../pasajeros/services/pasajeros.keys';
import type {
  HorarioResponse,
  HorarioPasajerosResponse,
  HorarioAsignacionDetalle,
} from '../types/horario.types';

export { horariosKeys } from './horarios.keys';

const idlePasajerosKey = [...horariosKeys.all, 'pasajeros', 'idle'] as const;

export const useHorarios = () => {
  return useQuery({
    queryKey: horariosKeys.list(),
    queryFn: () => horariosApi.getHorarios(),
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

export const useHorarioPasajeros = (
  horarioId: number | null,
  options?: { enabled?: boolean; onSuccess?: (data: HorarioPasajerosResponse) => void },
) => {
  const enabled = Boolean(horarioId) && (options?.enabled ?? true);
  const onSuccessRef = useRef(options?.onSuccess);

  useEffect(() => {
    onSuccessRef.current = options?.onSuccess;
  }, [options?.onSuccess]);

  const query = useQuery<HorarioPasajerosResponse>({
    queryKey: horarioId ? horariosKeys.pasajeros(horarioId) : idlePasajerosKey,
    queryFn: () => horariosApi.getPasajeros(horarioId!),
    enabled,
  });

  useEffect(() => {
    if (query.data && onSuccessRef.current) {
      onSuccessRef.current(query.data);
    }
  }, [query.data]);

  return query;
};

interface AsignarPasajerosVariables {
  horarioId: number;
  pasajeros: HorarioAsignacionDetalle[];
}

export const useAsignarPasajerosAHorario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ horarioId, pasajeros }: AsignarPasajerosVariables) =>
      horariosApi.asignarPasajeros(horarioId, {
        pasajeros,
        pasajeroIds: pasajeros.map((pasajero) => pasajero.pasajeroId),
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
