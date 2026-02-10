import { SearchInput } from '../../shared/ui';
import type { ReinscripcionEstado } from '../types/reinscripcion.types';

interface ReinscripcionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
  matchingCount: number;
  estadoSeleccionado: ReinscripcionEstado | null;
  onEstadoSelect: (estado: ReinscripcionEstado) => void;
}

const ESTADOS: { value: ReinscripcionEstado; label: string; description: string; accent: string }[] = [
  {
    value: 'Pendiente',
    label: 'Pendiente',
    description: 'Esperando confirmación',
    accent: 'border-amber-200 text-amber-700 bg-amber-50 shadow-lg',
  },
  {
    value: 'Confirmado',
    label: 'Confirmado',
    description: 'Listo para el ciclo',
    accent: 'border-emerald-200 text-emerald-700 bg-emerald-50 shadow-lg',
  },
  {
    value: 'NoContinua',
    label: 'No Continúa',
    description: 'No sigue este año',
    accent: 'border-slate-200 text-slate-700 bg-slate-50 shadow-lg',
  },
];

export const ReinscripcionFilters = ({
  searchQuery,
  onSearchChange,
  totalCount,
  matchingCount,
  estadoSeleccionado,
  onEstadoSelect,
}: ReinscripcionFiltersProps) => {
  return (
    <section className="rounded-3xl border border-[#e1e8ec] bg-white px-5 py-6 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Buscar registros</p>
          <SearchInput value={searchQuery} onChange={onSearchChange} placeholder="Buscar alumno, titular o colegio" />
        </div>
        <div className="rounded-2xl bg-[#f6f8f8] p-4 text-sm dark:bg-white/5">
          <div className="flex items-center justify-between text-gray-500">
            <span>Registros encontrados</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#1d8ca5]">Listado</span>
          </div>
          <p className="mt-2 text-4xl font-extrabold text-[#0f181a] dark:text-white">{totalCount}</p>
          <p className="text-xs text-gray-500">Coincidencias actuales: {matchingCount}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Estado requerido</p>
          <p className="text-xs text-gray-500">La lista se habilita cuando eliges una opción</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {ESTADOS.map((estado) => {
            const isActive = estadoSeleccionado === estado.value;
            return (
              <button
                key={estado.value}
                type="button"
                onClick={() => onEstadoSelect(estado.value)}
                aria-pressed={isActive}
                className={`flex min-w-[180px] flex-1 items-center justify-between rounded-2xl border px-4 py-3 text-left transition lg:min-w-[200px] ${
                  isActive
                    ? `${estado.accent}`
                    : 'border-gray-200 text-gray-600 hover:border-[#1d8ca5] dark:border-white/10 dark:text-gray-300'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold">{estado.label}</p>
                  <p className="text-xs text-gray-500">{estado.description}</p>
                </div>
                {isActive && <span className="material-symbols-outlined text-base text-[#1d8ca5]">check</span>}
              </button>
            );
          })}
        </div>
        {!estadoSeleccionado && (
          <p className="text-xs font-medium text-amber-600">Selecciona un estado para iniciar la consulta.</p>
        )}
      </div>
    </section>
  );
};
