import { useMemo, useState } from 'react';
import type { ReinscripcionDetallada, ReinscripcionEstado } from '../types/reinscripcion.types';

type FilterEstado = 'todos' | ReinscripcionEstado;

export function useReinscripcionesList(reinscripciones: ReinscripcionDetallada[] = []) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<FilterEstado>('todos');

  // Aplicar filtros
  const filteredReinscripciones = useMemo(() => {
    let result = reinscripciones;

    // Filtro por estado
    if (filterEstado !== 'todos') {
      result = result.filter((r) => r.estado === filterEstado);
    }

    // Búsqueda por nombre de pasajero, titular o colegio
    if (searchQuery) {
      const normalized = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.pasajeroNombre.toLowerCase().includes(normalized) ||
          r.titularNombre.toLowerCase().includes(normalized) ||
          r.colegio.toLowerCase().includes(normalized)
      );
    }

    return result;
  }, [reinscripciones, filterEstado, searchQuery]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const confirmados = reinscripciones.filter((r) => r.estado === 'Confirmado').length;
    const pendientes = reinscripciones.filter((r) => r.estado === 'Pendiente').length;
    const noContinua = reinscripciones.filter((r) => r.estado === 'NoContinua').length;

    return {
      total: reinscripciones.length,
      matching: filteredReinscripciones.length,
      confirmados,
      pendientes,
      noContinua,
    };
  }, [reinscripciones, filteredReinscripciones]);

  return {
    filteredReinscripciones,
    stats,
    searchQuery,
    setSearchQuery,
    filterEstado,
    setFilterEstado,
  };
}
