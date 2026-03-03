import { useState } from 'react';
import { Button } from '../../../shared/ui';
import { MovimientosTitularSearch } from './MovimientosTitularSearch';
import { MEDIOS_PAGO, type FiltersDraft, type MedioPagoFiltro, isValidDateInput } from './movimientosFilters.shared';

interface MovimientosFiltersCardProps {
  initialFilters: FiltersDraft;
  defaultFilters: FiltersDraft;
  onApply: (filters: FiltersDraft) => void;
  onReset: () => void;
  isFetching: boolean;
}

export const MovimientosFiltersCard = ({
  initialFilters,
  defaultFilters,
  onApply,
  onReset,
  isFetching,
}: MovimientosFiltersCardProps) => {
  const [fechaDesde, setFechaDesde] = useState(initialFilters.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(initialFilters.fechaHasta);
  const [medioPago, setMedioPago] = useState<MedioPagoFiltro>(initialFilters.medioPago);
  const [titular, setTitular] = useState<FiltersDraft['titular']>(initialFilters.titular);

  const handleFechaDesdeChange = (value: string) => {
    if (!value || !isValidDateInput(value)) {
      return;
    }
    setFechaDesde(value);
    setFechaHasta((prev) => (value > prev ? value : prev));
  };

  const handleFechaHastaChange = (value: string) => {
    if (!value || !isValidDateInput(value)) {
      return;
    }
    setFechaHasta(value);
    setFechaDesde((prev) => (value < prev ? value : prev));
  };

  const handleApply = () => {
    onApply({
      fechaDesde,
      fechaHasta,
      medioPago,
      titular,
    });
  };

  const handleClear = () => {
    setFechaDesde(defaultFilters.fechaDesde);
    setFechaHasta(defaultFilters.fechaHasta);
    setMedioPago(defaultFilters.medioPago);
    setTitular(defaultFilters.titular);
    onReset();
  };

  return (
    <section className="rounded-3xl border border-dashed border-gray-300 bg-white/90 p-5 shadow-sm dark:border-gray-700 dark:bg-[#1f1f24]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#0f181a] dark:text-white">Filtros</h2>
          <p className="text-sm text-gray-500">Personalizá el rango de fechas y seleccioná un titular o medio.</p>
        </div>
        {isFetching && (
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f0fbfd] px-3 py-1 text-xs font-semibold text-[#1d8ca5] dark:bg-cyan-900/20 dark:text-cyan-200">
            <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
            Actualizando datos...
          </div>
        )}
      </div>

      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fechaDesde" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Fecha desde
            </label>
            <input
              id="fechaDesde"
              type="date"
              value={fechaDesde}
              onChange={(event) => handleFechaDesdeChange(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="fechaHasta" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Fecha hasta
            </label>
            <input
              id="fechaHasta"
              type="date"
              value={fechaHasta}
              onChange={(event) => handleFechaHastaChange(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="medioPago" className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Medio de pago
          </label>
          <select
            id="medioPago"
            value={medioPago}
            onChange={(event) => setMedioPago(event.target.value as MedioPagoFiltro)}
            className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-100"
          >
            {MEDIOS_PAGO.map((medio) => (
              <option key={medio} value={medio}>
                {medio === 'todos' ? 'Todos los medios' : medio}
              </option>
            ))}
          </select>
        </div>

        <MovimientosTitularSearch value={titular} onSelect={(option) => setTitular(option)} onClear={() => setTitular(null)} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="brand" className="rounded-full" onClick={handleApply}>
            Aplicar filtros
          </Button>
          <Button type="button" variant="ghost" onClick={handleClear}>
            Limpiar
          </Button>
        </div>
      </div>
    </section>
  );
};
