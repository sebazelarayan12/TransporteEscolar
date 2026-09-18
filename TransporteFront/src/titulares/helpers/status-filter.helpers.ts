import type { TitularResponse } from '../types/titular.types';

export const STATUS_FILTERS = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type StatusFilter = (typeof STATUS_FILTERS)[keyof typeof STATUS_FILTERS];

export interface StatusCounts {
  total: number;
  active: number;
  inactive: number;
}

export const filterByStatus = (titulares: TitularResponse[], status: StatusFilter): TitularResponse[] => {
  if (status === STATUS_FILTERS.ACTIVE) return titulares.filter((titular) => titular.activo);
  if (status === STATUS_FILTERS.INACTIVE) return titulares.filter((titular) => !titular.activo);
  return titulares;
};

export const countByStatus = (titulares: TitularResponse[]): StatusCounts => {
  const active = titulares.filter((titular) => titular.activo).length;
  return { total: titulares.length, active, inactive: titulares.length - active };
};
