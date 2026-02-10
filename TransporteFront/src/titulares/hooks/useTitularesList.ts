import { useMemo, useState } from 'react';
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
  const [selectedTitularId, setSelectedTitularId] = useState<number | null>(null);

  const filteredTitulares = useMemo(() => {
    if (!titulares || titulares.length === 0) return [];
    return filterTitulares(titulares, searchQuery);
  }, [titulares, searchQuery]);

  const selectedTitular = (() => {
    if (filteredTitulares.length === 0) {
      return null;
    }

    if (selectedTitularId === null) {
      return filteredTitulares[0];
    }

    return filteredTitulares.find((titular) => titular.id === selectedTitularId) ?? filteredTitulares[0];
  })();

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    setSelectedTitularId(null);
  };

  const selectTitular = (titular: TitularResponse) => {
    setSelectedTitularId(titular.id);
  };

  return {
    searchQuery,
    setSearchQuery: handleSearchQueryChange,
    filteredTitulares,
    selectedTitular,
    selectTitular,
    stats: {
      total: titulares?.length ?? 0,
      matching: filteredTitulares.length,
    },
  };
};
