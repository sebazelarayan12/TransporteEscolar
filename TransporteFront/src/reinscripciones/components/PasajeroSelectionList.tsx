import type { PasajeroResponse } from '../../pasajeros/types/pasajero.types';
import { formatPasajeroHorariosListado } from '../../pasajeros/helpers/horario.helpers';
import { Button, Spinner } from '../../shared/ui';

interface PasajeroSelectionListProps {
  pasajeros: PasajeroResponse[];
  selectedPasajeroId: number | null;
  onSelect: (id: number) => void;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  emptyMessage: string;
  onRetry: () => void | Promise<unknown>;
}

export const PasajeroSelectionList = ({
  pasajeros,
  selectedPasajeroId,
  onSelect,
  isLoading,
  isError,
  errorMessage,
  emptyMessage,
  onRetry,
}: PasajeroSelectionListProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Spinner />
        <p className="text-sm text-gray-500">Buscando pasajeros disponibles...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm font-medium text-red-600">{errorMessage}</p>
        <Button variant="ghost" onClick={() => onRetry()} className="border border-gray-200 text-[#1d8ca5]">
          Reintentar
        </Button>
      </div>
    );
  }

  if (pasajeros.length === 0) {
    return <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</div>;
  }

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
      {pasajeros.map((pasajero) => {
        const isSelected = selectedPasajeroId === pasajero.id;
        const horariosTexto = formatPasajeroHorariosListado(pasajero.horariosAsignados) || 'Sin horarios';

        return (
          <button
            type="button"
            key={pasajero.id}
            onClick={() => onSelect(pasajero.id)}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d8ca5] focus-visible:ring-offset-2 dark:bg-[#1f1f24] ${
              isSelected
                ? 'border-[#1d8ca5] bg-[#1d8ca5]/10 shadow-sm'
                : 'border-gray-200 hover:border-[#1d8ca5]/40 hover:bg-slate-50 dark:border-white/10 dark:hover:border-[#1d8ca5]/60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-white">{pasajero.nombreCompleto}</p>
                <p className="text-sm text-gray-500 dark:text-gray-300">{pasajero.colegio}</p>
              </div>
              {isSelected ? (
                <span className="material-symbols-outlined text-[22px] text-[#1d8ca5]">check_circle</span>
              ) : (
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">#{pasajero.id}</span>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {pasajero.gradoCurso} • {horariosTexto}
            </p>
          </button>
        );
      })}
    </div>
  );
};
