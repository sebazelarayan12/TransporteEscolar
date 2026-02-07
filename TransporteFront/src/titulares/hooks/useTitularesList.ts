import { useEffect, useMemo, useState } from 'react';
import type { TitularResponse } from '../types/titular.types';
import { filterTitulares } from '../helpers/search.helpers';

interface TitularesListState {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filteredTitulares: TitularResponse[];
  selectedTitular: TitularResponse | null;
  selectTitular: (titular: TitularResponse) => void;
  stats: {
    total: number;
    matching: number;
  };
}

export const useTitularesList = (titulares?: TitularResponse[]): TitularesListState => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTitular, setSelectedTitular] = useState<TitularResponse | null>(null);

  const filteredTitulares = useMemo(() => {
    if (!titulares || titulares.length === 0) return [];
    return filterTitulares(titulares, searchQuery);
  }, [titulares, searchQuery]);

  useEffect(() => {
    if (filteredTitulares.length === 0) {
      setSelectedTitular(null);
      return;
    }

    setSelectedTitular((current) => {
      if (current && filteredTitulares.some((titular) => titular.id === current.id)) {
        return current;
      }
      return filteredTitulares[0];
    });
  }, [filteredTitulares]);

  const selectTitular = (titular: TitularResponse) => {
    setSelectedTitular(titular);
  };

  return {
    searchQuery,
    setSearchQuery,
    filteredTitulares,
    selectedTitular,
    selectTitular,
    stats: {
      total: titulares?.length ?? 0,
      matching: filteredTitulares.length,
    },
  };
};
