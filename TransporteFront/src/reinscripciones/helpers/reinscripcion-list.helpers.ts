import type { ReinscripcionDetallada } from '../types/reinscripcion.types';

export interface ResumenStat {
  label: string;
  value: number;
  trend: string;
  color: string;
  badge: string;
}

const STAT_DEFINITIONS = [
  { label: 'Confirmados', estado: 'Confirmado', color: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  { label: 'Pendientes', estado: 'Pendiente', color: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  { label: 'No continúa', estado: 'NoContinua', color: 'text-slate-600', badge: 'bg-slate-200 text-slate-700' },
] as const;

export const filterReinscripciones = (
  reinscripciones: ReinscripcionDetallada[],
  searchQuery: string,
): ReinscripcionDetallada[] => {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  if (!normalizedSearch) return reinscripciones;

  return reinscripciones.filter((registro) => {
    const target = `${registro.pasajeroNombre} ${registro.titularNombre} ${registro.colegio} ${registro.curso}`.toLowerCase();
    return target.includes(normalizedSearch);
  });
};

export const buildResumenStats = (reinscripciones: ReinscripcionDetallada[]): ResumenStat[] =>
  STAT_DEFINITIONS.map(({ label, estado, color, badge }) => {
    const value = reinscripciones.filter((registro) => registro.estado === estado).length;
    return { label, value, trend: `${value} en esta página`, color, badge };
  });
