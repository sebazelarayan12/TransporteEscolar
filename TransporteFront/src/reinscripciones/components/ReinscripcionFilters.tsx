import { SearchInput } from '../../shared/ui';

interface ReinscripcionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
  matchingCount: number;
}

export const ReinscripcionFilters = ({ searchQuery, onSearchChange, totalCount, matchingCount }: ReinscripcionFiltersProps) => {
  return (
    <section className="rounded-3xl border border-[#e1e8ec] bg-white px-5 py-6 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
      <div className="grid gap-4 md:grid-cols-[1.8fr,1fr]">
        <div className="space-y-4">
          <SearchInput value={searchQuery} onChange={onSearchChange} placeholder="Buscar alumno, titular o colegio" />
          <div className="flex flex-wrap gap-2">
            {['Todos', 'St. George', 'San Patricio', 'Turno mañana', 'Turno tarde'].map((chip, index) => (
              <button
                key={chip}
                type="button"
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  index === 0
                    ? 'border-transparent bg-[#1d8ca5]/10 text-[#1d8ca5] shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-[#1d8ca5] dark:border-white/10 dark:text-gray-300'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-[#f6f8f8] p-4 text-sm dark:bg-white/5">
          <div className="flex items-center justify-between text-gray-500">
            <span>Total de familias activas</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#1d8ca5]">Listado</span>
          </div>
          <p className="mt-2 text-4xl font-extrabold text-[#0f181a] dark:text-white">{totalCount}</p>
          <p className="text-xs text-gray-500">Mostrando {matchingCount} registros</p>
        </div>
      </div>
    </section>
  );
};
