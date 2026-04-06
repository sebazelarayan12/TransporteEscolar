/**
 * TitularSelector component
 * Handles search, pagination, and selection of titulares with generated payments
 */

import type { ReactNode } from 'react';
import type { TitularResponse } from '../../../titulares/types/titular.types';
import { SearchInput } from '../../../shared/ui';
import { formatCurrency } from '../../../shared/utils/currency.helpers';
import { getTitularApellidoDisplay } from '../../../shared/utils/titulares.helpers';

const titularButtonBaseClasses =
  'w-full rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d8ca5] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1f1f24]';

interface TitularSelectorProps {
  titulares: TitularResponse[];
  selectedTitularId: number | null;
  search: string;
  onSearchChange: (value: string) => void;
  onTitularSelect: (titular: TitularResponse) => void;
  pageNumber: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  pageSize: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
}

export const TitularSelector = ({
  titulares,
  selectedTitularId,
  search,
  onSearchChange,
  onTitularSelect,
  pageNumber,
  onPageChange,
  totalCount,
  pageSize,
  isLoading,
  isFetching,
  isError,
  error,
}: TitularSelectorProps) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPreviousPage = pageNumber > 1;
  const hasNextPage = pageNumber < totalPages;
  const startItem = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const endItem = Math.min(pageNumber * pageSize, totalCount);

  let content: ReactNode;
  if (isLoading && !titulares.length) {
    content = (
      <div className="flex h-40 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        <span className="material-symbols-outlined mr-2 animate-spin text-[20px] text-[#1d8ca5]">progress_activity</span>
        Cargando titulares con cuotas generadas...
      </div>
    );
  } else if (isError) {
    content = (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-400">
        {error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'No se pudieron cargar los titulares. Intentá nuevamente en unos segundos.'}
      </div>
    );
  } else if (!titulares.length) {
    content = (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-400">
        {search.trim() ? 'No hay resultados para tu búsqueda.' : 'No hay titulares con cuotas generadas.'}
      </div>
    );
  } else {
    content = (
      <>
        <div className="mt-4 flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
          {titulares.map((titular) => {
            const isSelected = titular.id === selectedTitularId;
            const titularLabel = getTitularApellidoDisplay(titular.apellido, titular.nombreContacto);
            return (
              <button
                key={titular.id}
                type="button"
                onClick={() => onTitularSelect(titular)}
                className={`${titularButtonBaseClasses} ${
                  isSelected
                    ? 'border-[#1d8ca5] bg-white text-[#0f181a] dark:bg-[#fdfcfb]/10 dark:text-white'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-[#1d8ca5]/70 dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-100'
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{titularLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Cuota</p>
                    <p className="text-sm font-semibold text-[#1d8ca5]">{formatCurrency(titular.montoMensualPactado)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-col gap-2 text-xs text-gray-500 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Mostrando <span className="font-semibold text-gray-900 dark:text-gray-100">{startItem}</span> -{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{endItem}</span> de{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{totalCount}</span> titulares con cuotas generadas registrados
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, pageNumber - 1))}
              disabled={!hasPreviousPage}
              className="inline-flex items-center gap-1 rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:border-[#1d8ca5]/70 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-200"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              Anterior
            </button>
            <button
              type="button"
              onClick={() => onPageChange(pageNumber + 1)}
              disabled={!hasNextPage}
              className="inline-flex items-center gap-1 rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:border-[#1d8ca5]/70 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-200"
            >
              Siguiente
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-gray-50/70 p-4 dark:border-[#3f3f46] dark:bg-[#1f1f24]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1d8ca5]">Paso 1</p>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Seleccioná al titular</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            El listado muestra solo titulares con cuotas generadas.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{pageSize} por página</span>
          {isFetching && !isLoading && (
            <span className="flex items-center gap-1 text-[#1d8ca5]">
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              Actualizando
            </span>
          )}
        </div>
      </div>
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Buscar por apellido o nombre..."
        className="mt-4"
      />
      {content}
    </div>
  );
};
