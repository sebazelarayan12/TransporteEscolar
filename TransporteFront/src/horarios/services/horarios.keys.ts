export const horariosKeys = {
  all: ['horarios'] as const,
  list: () => [...horariosKeys.all, 'list'] as const,
  listConInactivos: () => [...horariosKeys.list(), 'con-inactivos'] as const,
  detail: (id: number) => [...horariosKeys.all, 'detail', id] as const,
  pasajeros: (id: number) => [...horariosKeys.detail(id), 'pasajeros'] as const,
};
