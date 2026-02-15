import { useMemo, useState } from 'react';
import type { PasajeroResponse } from '../types/pasajero.types';

interface PasajerosListState {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filteredPasajeros: PasajeroResponse[];
  selectedPasajero: PasajeroResponse | null;
  selectPasajero: (pasajero: PasajeroResponse) => void;
  stats: {
    total: number;
    matching: number;
  };
}

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export const usePasajerosList = (pasajeros?: PasajeroResponse[]): PasajerosListState => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPasajeroId, setSelectedPasajeroId] = useState<number | null>(null);

  const filteredPasajeros = useMemo(() => {
    if (!pasajeros || pasajeros.length === 0) return [];
    if (!searchQuery.trim()) return pasajeros;

    const query = normalize(searchQuery.trim());
    return pasajeros.filter((pasajero) =>
      normalize(
        [
          pasajero.nombreCompleto,
          pasajero.titularApellido ?? '',
          pasajero.colegio,
          pasajero.gradoCurso,
          pasajero.turno,
          pasajero.horarioDescripcion ?? '',
        ].join(' '),
      ).includes(query),
    );
  }, [pasajeros, searchQuery]);

  const selectedPasajero = (() => {
    if (filteredPasajeros.length === 0) {
      return null;
    }

    if (selectedPasajeroId === null) {
      return filteredPasajeros[0];
    }

    return filteredPasajeros.find((pasajero) => pasajero.id === selectedPasajeroId) ?? filteredPasajeros[0];
  })();

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    setSelectedPasajeroId(null);
  };

  const selectPasajero = (pasajero: PasajeroResponse) => {
    setSelectedPasajeroId(pasajero.id);
  };

  return {
    searchQuery,
    setSearchQuery: handleSearchQueryChange,
    filteredPasajeros,
    selectedPasajero,
    selectPasajero,
    stats: {
      total: pasajeros?.length ?? 0,
      matching: filteredPasajeros.length,
    },
  };
};
