import { useState } from 'react';
import { useReinscripciones } from '../services/reinscripciones.queries';
import type { ReinscripcionEstado } from '../types/reinscripcion.types';

const PAGE_SIZE = 20;

export const useReinscripcionesPaginadas = () => {
  const currentDate = new Date();
  const [mes, setMes] = useState(currentDate.getMonth() + 1);
  const [anio, setAnio] = useState(currentDate.getFullYear());
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<ReinscripcionEstado | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const queryParams = estadoSeleccionado
    ? {
        anio,
        mes,
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

  const handlePeriodoChange = (nuevoMes: number, nuevoAnio: number) => {
    setMes(nuevoMes);
    setAnio(nuevoAnio);
    setPageNumber(1);
  };

  return {
    mes,
    anio,
    estadoSeleccionado,
    selectEstado: handleEstadoSelect,
    handlePeriodoChange,
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
