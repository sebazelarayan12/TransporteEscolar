import type { PasajeroFilterRequest } from '../types/pasajero.types';

export const pasajerosKeys = {
  all: ['pasajeros'] as const,
  lists: () => [...pasajerosKeys.all, 'list'] as const,
  list: (filters?: string) => [...pasajerosKeys.lists(), { filters }] as const,
  activos: () => [...pasajerosKeys.all, 'activos'] as const,
  disponibles: (anio: number) => [...pasajerosKeys.all, 'disponibles', anio] as const,
  paginados: (filter: PasajeroFilterRequest) => [...pasajerosKeys.all, 'paginados', filter] as const,
  byTitular: (titularId: number) => [...pasajerosKeys.all, 'titular', titularId] as const,
  details: () => [...pasajerosKeys.all, 'detail'] as const,
  detail: (id: number) => [...pasajerosKeys.details(), id] as const,
};
