import { useEffect, useMemo, useState } from 'react';
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
  const [selectedPasajero, setSelectedPasajero] = useState<PasajeroResponse | null>(null);

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
        ].join(' '),
      ).includes(query),
    );
  }, [pasajeros, searchQuery]);

  useEffect(() => {
    if (filteredPasajeros.length === 0) {
      setSelectedPasajero(null);
      return;
    }

    setSelectedPasajero((current) => {
      if (current && filteredPasajeros.some((pasajero) => pasajero.id === current.id)) {
        return current;
      }
      return filteredPasajeros[0];
    });
  }, [filteredPasajeros]);

  const selectPasajero = (pasajero: PasajeroResponse) => {
    setSelectedPasajero(pasajero);
  };

  return {
    searchQuery,
    setSearchQuery,
    filteredPasajeros,
    selectedPasajero,
    selectPasajero,
    stats: {
      total: pasajeros?.length ?? 0,
      matching: filteredPasajeros.length,
    },
  };
};
