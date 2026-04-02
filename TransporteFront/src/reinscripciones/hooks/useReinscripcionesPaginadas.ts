import { useState } from 'react';
import { useReinscripciones } from '../services/reinscripciones.queries';
import type { ReinscripcionEstado } from '../types/reinscripcion.types';

const PAGE_SIZE = 20;

export const useReinscripcionesPaginadas = () => {
  const [anio] = useState(() => new Date().getFullYear());
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<ReinscripcionEstado | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const queryParams = estadoSeleccionado
    ? {
        anio,
        estado: estadoSeleccionado,
        pageNumber,
        pageSize: PAGE_SIZE,
      }
    : null;

  const enabled = Boolean(queryParams);
  const query = useReinscripciones(queryParams, { enabled });

  const handleEstadoSelect = (estado: ReinscripcionEstado) => {
    setEstadoSeleccionado(estado);
    setPageNumber(1);
  };

  return {
    anio,
    estadoSeleccionado,
    selectEstado: handleEstadoSelect,
    reinscripciones: query.data?.data ?? [],
    totalCount: query.data?.totalCount ?? 0,
    enabled,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    pageNumber,
    pageSize: PAGE_SIZE,
    setPageNumber,
    refetch: query.refetch,
  };
};
