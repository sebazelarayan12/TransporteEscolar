import type { TitularResponse } from '../types/titular.types';

export const filterTitulares = (titulares: TitularResponse[], searchQuery: string): TitularResponse[] => {
  if (!searchQuery.trim()) return titulares;
  
  const searchLower = searchQuery.toLowerCase();
  return titulares.filter((titular) =>
    titular.apellido.toLowerCase().includes(searchLower) ||
    titular.nombreContacto.toLowerCase().includes(searchLower) ||
    titular.direccion.toLowerCase().includes(searchLower) ||
    titular.id.toString().includes(searchLower)
  );
};
