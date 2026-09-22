import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarDirecciones } from './geocoding.api';
import { recorridosApi } from './recorridos.api';
import { recorridosKeys } from './recorridos.keys';
import type { TransporteTipo } from '../../shared/types/transporte.types';
import type { ParadaFijaRequest, UbicacionRequest } from '../types/recorrido.types';

export { recorridosKeys } from './recorridos.keys';

const UN_DIA_MS = 24 * 60 * 60 * 1000;

export const useUbicacionTitular = (titularId: number | undefined) => {
  return useQuery({
    queryKey: recorridosKeys.ubicacion(titularId ?? 0),
    queryFn: () => recorridosApi.getUbicacion(titularId!),
    enabled: Boolean(titularId),
  });
};

export const useRecorridosTitular = (titularId: number | undefined) => {
  return useQuery({
    queryKey: recorridosKeys.recorridos(titularId ?? 0),
    queryFn: () => recorridosApi.getRecorridos(titularId!),
    enabled: Boolean(titularId),
  });
};

export const useAnalisisKilometros = () => {
  return useQuery({
    queryKey: recorridosKeys.analisis(),
    queryFn: () => recorridosApi.getAnalisis(),
  });
};

export const useColegios = () => {
  return useQuery({
    queryKey: recorridosKeys.colegios(),
    queryFn: () => recorridosApi.getColegios(),
    // Los colegios casi nunca cambian: no tiene sentido refrescarlos seguido.
    staleTime: 60 * 60 * 1000,
  });
};

/**
 * Autocompletado de direcciones contra Nominatim. Va por TanStack Query para cumplir la política de
 * Nominatim (los resultados se cachean del lado del cliente) y porque `signal` cancela solo el pedido
 * viejo cuando el usuario sigue escribiendo.
 */
export const useBuscarDirecciones = (consulta: string, options?: { enabled?: boolean }) => {
  const texto = consulta.trim();

  return useQuery({
    queryKey: recorridosKeys.direcciones(texto.toLowerCase()),
    queryFn: ({ signal }) => buscarDirecciones(texto, signal),
    enabled: texto.length >= 3 && (options?.enabled ?? true),
    staleTime: UN_DIA_MS,
    gcTime: UN_DIA_MS,
    // Reintentar de inmediato ante un 429 de Nominatim empeora el bloqueo.
    retry: false,
  });
};

interface GuardarUbicacionVariables {
  titularId: number;
  data: UbicacionRequest;
}

export const useGuardarUbicacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ titularId, data }: GuardarUbicacionVariables) =>
      recorridosApi.putUbicacion(titularId, data),
    onSuccess: async (_, variables) => {
      // Guardar el pin recalcula los recorridos en el backend, así que hay que refrescarlos.
      queryClient.invalidateQueries({ queryKey: recorridosKeys.recorridos(variables.titularId) });
      // Se espera el refetch de la ubicación: la tarjeta descarta el pin editado apenas termina la
      // mutación, y si el cache todavía tuviera el pin viejo se vería saltar hacia atrás un instante.
      await queryClient.invalidateQueries({ queryKey: recorridosKeys.ubicacion(variables.titularId) });
    },
  });
};

export const useEliminarUbicacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (titularId: number) => recorridosApi.deleteUbicacion(titularId),
    onSuccess: (_, titularId) => {
      queryClient.invalidateQueries({ queryKey: recorridosKeys.ubicacion(titularId) });
      queryClient.invalidateQueries({ queryKey: recorridosKeys.recorridos(titularId) });
    },
  });
};

export const useRecalcularReparto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recorridosApi.recalcularReparto(),
    onSuccess: () => {
      // El reparto recalcula el análisis y los tramos de cada viaje: invalida todo el dominio para que
      // el panel de recorrido de Horarios no quede mostrando datos viejos.
      queryClient.invalidateQueries({ queryKey: recorridosKeys.all });
    },
  });
};

export const useRecalcularRecorridos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recorridosApi.recalcularTodos(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recorridosKeys.all });
    },
  });
};

export const useParadasFijas = () => {
  return useQuery({
    queryKey: recorridosKeys.paradasFijas(),
    queryFn: () => recorridosApi.getParadasFijas(),
  });
};

interface AsignarParadaFijaVariables {
  horarioId: number;
  transporte: TransporteTipo;
  data: ParadaFijaRequest;
}

export const useAsignarParadaFija = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ horarioId, transporte, data }: AsignarParadaFijaVariables) =>
      recorridosApi.putParadaFija(horarioId, transporte, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recorridosKeys.paradasFijas() });
    },
  });
};

interface EliminarParadaFijaVariables {
  horarioId: number;
  transporte: TransporteTipo;
}

export const useEliminarParadaFija = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ horarioId, transporte }: EliminarParadaFijaVariables) =>
      recorridosApi.deleteParadaFija(horarioId, transporte),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recorridosKeys.paradasFijas() });
    },
  });
};

/** Recorrido calculado de un viaje concreto. `null` cuando el backend respondió 204 (todavía no se repartió). */
export const useRecorridoViaje = (horarioId: number | null, transporte: TransporteTipo) => {
  return useQuery({
    queryKey: recorridosKeys.recorridoViaje(horarioId ?? 0, transporte),
    queryFn: () => recorridosApi.getRecorridoViaje(horarioId!, transporte),
    enabled: Boolean(horarioId) && Boolean(transporte),
  });
};
