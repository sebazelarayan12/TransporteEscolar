import { useState, type ReactNode } from 'react';
import type { TitularResponse } from '../../../titulares/types/titular.types';
import { useTitularesConPagos } from '../../services/pagos.queries';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { getTitularApellidoDisplay } from '../../../shared/utils/titulares.helpers';

export interface TitularOption {
  id: number;
  label: string;
}

interface MovimientosTitularSearchProps {
  value: TitularOption | null;
  onSelect: (option: TitularOption) => void;
  onClear: () => void;
}

export const MovimientosTitularSearch = ({ value, onSelect, onClear }: MovimientosTitularSearchProps) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 300);
  const shouldSearch = debouncedQuery.length >= 2;

  const { data, isLoading, isFetching, isError } = useTitularesConPagos(
    debouncedQuery,
    1,
    6,
    { enabled: shouldSearch }
  );

  const results = data?.data ?? [];

  const handleSelect = (titular: TitularResponse) => {
    const label = getTitularApellidoDisplay(titular.apellido, titular.nombreContacto);
    onSelect({
      id: titular.id,
      label,
    });
    setQuery('');
  };

  let resultsContent: ReactNode;
  if (!shouldSearch) {
    resultsContent = (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Escribí al menos 2 caracteres para buscar titulares con cuotas generadas.
      </p>
    );
  } else if (isError) {
    resultsContent = (
      <p className="text-sm text-red-500">No pudimos cargar el listado. Intentá nuevamente.</p>
    );
  } else if (isLoading && !results.length) {
    resultsContent = (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="material-symbols-outlined animate-spin text-[18px] text-[#1d8ca5]">progress_activity</span>
        Buscando titulares...
      </div>
    );
  } else if (!results.length) {
    resultsContent = (
      <p className="text-sm text-gray-500">No encontramos coincidencias para "{debouncedQuery}".</p>
    );
  } else {
    resultsContent = (
      <ul className="space-y-2" role="listbox" aria-label="Resultados de titulares">
        {results.map((titular) => {
          const label = getTitularApellidoDisplay(titular.apellido, titular.nombreContacto);
          return (
            <li key={titular.id}>
              <button
                type="button"
                onClick={() => handleSelect(titular)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-900 shadow-sm transition hover:border-[#1d8ca5]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d8ca5] dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-100"
                aria-label={`Seleccionar titular ${label}`}
              >
                <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-400">ID #{titular.id}</p>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="titularSearch" className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Titular (opcional)
        </label>
        {isFetching && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <span className="material-symbols-outlined animate-spin text-[16px] text-[#1d8ca5]">progress_activity</span>
            Actualizando
          </span>
        )}
      </div>
      <input
        id="titularSearch"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por apellido o nombre"
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-100"
      />
      <p className="text-xs text-gray-500">Los resultados muestran únicamente titulares con pagos generados.</p>

      {value ? (
        <div className="flex items-center justify-between rounded-2xl border border-[#1d8ca5]/20 bg-[#f0fbfd] px-4 py-3 text-sm text-[#0f181a] dark:border-cyan-900/40 dark:bg-cyan-900/10 dark:text-white">
          <div>
            <p className="font-semibold">{value.label}</p>
            <p className="text-[11px] uppercase tracking-wide text-[#1d8ca5] dark:text-cyan-300">Filtro aplicado</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClear();
              setQuery('');
            }}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1d8ca5] shadow-sm transition hover:bg-white/80 dark:bg-transparent dark:text-cyan-300"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            Limpiar
          </button>
        </div>
      ) : null}

      <div className="rounded-3xl border border-dashed border-gray-300 bg-white/80 p-4 dark:border-gray-700 dark:bg-[#1f1f24]">
        {resultsContent}
      </div>
    </div>
  );
};
