import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarDirecciones } from './geocoding.api';
import { recorridosApi } from './recorridos.api';
import { recorridosKeys } from './recorridos.keys';
import type { UbicacionRequest } from '../types/recorrido.types';

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recorridosKeys.ubicacion(variables.titularId) });
      // Guardar el pin recalcula los recorridos en el backend, así que hay que refrescarlos.
      queryClient.invalidateQueries({ queryKey: recorridosKeys.recorridos(variables.titularId) });
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

export const useRecalcularRecorridos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recorridosApi.recalcularTodos(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recorridosKeys.all });
    },
  });
};
