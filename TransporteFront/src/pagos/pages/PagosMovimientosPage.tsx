import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, LoadingScreen, ErrorState, EmptyState, Pagination } from '../../shared/ui';
import { RegistrarPagoModal } from '../components/RegistrarPagoModal';
import { usePagosMovimientos } from '../services/pagos.queries';
import type { MovimientosFilterRequest } from '../types/movimientos.types';
import { formatCurrency } from '../../shared/utils/currency.helpers';
import { formatDateTime } from '../../shared/utils/date.helpers';
import { MovimientosTitularSearch, type TitularOption } from '../components/movimientos/MovimientosTitularSearch';
import { useTitular } from '../../titulares/services/titulares.queries';

const MOVIMIENTOS_PAGE_SIZE = 20;
const MEDIOS_PAGO = ['todos', 'Efectivo', 'Transferencia', 'Cheque'] as const;

type MedioPagoFiltro = (typeof MEDIOS_PAGO)[number];

interface FiltersDraft {
  fechaDesde: string;
  fechaHasta: string;
  medioPago: MedioPagoFiltro;
  titular: TitularOption | null;
}

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const subtractDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  return copy;
};

const isValidDateInput = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const medioPagoClasses: Record<string, string> = {
  Efectivo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Transferencia: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Cheque: 'bg-amber-100 text-amber-700 border-amber-200',
};

export const PagosMovimientosPage = () => {
  const today = new Date();
  const defaultFechaHasta = toInputDate(today);
  const defaultFechaDesde = toInputDate(subtractDays(today, 30));
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const rawDesde = searchParams.get('fechaDesde');
  const rawHasta = searchParams.get('fechaHasta');
  const medioPagoRaw = searchParams.get('medioPago');
  const medioPagoParam = MEDIOS_PAGO.includes(medioPagoRaw as MedioPagoFiltro)
    ? (medioPagoRaw as MedioPagoFiltro)
    : 'todos';
  const titularIdParam = searchParams.get('titularId');
  const titularIdFromParams = titularIdParam ? Number(titularIdParam) : null;
  const pageParam = Number(searchParams.get('page') ?? '1');
  const pageNumber = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const fechaDesdeParam = rawDesde && isValidDateInput(rawDesde) ? rawDesde : defaultFechaDesde;
  const fechaHastaParam = rawHasta && isValidDateInput(rawHasta) ? rawHasta : defaultFechaHasta;

  const safeFechaDesde = fechaDesdeParam > fechaHastaParam ? fechaHastaParam : fechaDesdeParam;
  const safeFechaHasta = fechaHastaParam;

  const shouldFetchTitular = typeof titularIdFromParams === 'number' && !Number.isNaN(titularIdFromParams);
  const { data: titularDetalle } = useTitular(shouldFetchTitular ? (titularIdFromParams as number) : 0);
  const titularLabelFromQuery = titularDetalle
    ? `${titularDetalle.apellido}, ${titularDetalle.nombreContacto}`.trim()
    : null;

  const titularOptionFromParams = shouldFetchTitular
    ? {
        id: titularIdFromParams as number,
        label: titularLabelFromQuery ?? `Titular #${titularIdFromParams}`,
      }
    : null;

  const filtersKey = [
    safeFechaDesde,
    safeFechaHasta,
    medioPagoParam,
    titularOptionFromParams?.id ?? 'none',
    titularOptionFromParams?.label ?? '',
  ].join('|');

  const appliedFilters: FiltersDraft = {
    fechaDesde: safeFechaDesde,
    fechaHasta: safeFechaHasta,
    medioPago: medioPagoParam,
    titular: titularOptionFromParams,
  };

  const defaultFilters: FiltersDraft = {
    fechaDesde: defaultFechaDesde,
    fechaHasta: defaultFechaHasta,
    medioPago: 'todos',
    titular: null,
  };

  const titularIdForQuery = shouldFetchTitular ? (titularIdFromParams as number) : undefined;

  const movimientosFilter: MovimientosFilterRequest = {
    fechaDesde: safeFechaDesde,
    fechaHasta: safeFechaHasta,
    pageNumber,
    pageSize: MOVIMIENTOS_PAGE_SIZE,
  };

  if (typeof titularIdForQuery === 'number') {
    movimientosFilter.titularId = titularIdForQuery;
  }

  if (medioPagoParam !== 'todos') {
    movimientosFilter.medioPago = medioPagoParam;
  }

  const { data, isLoading, isFetching, isError, error, refetch } = usePagosMovimientos(movimientosFilter);

  const movimientos = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const isEmpty = !movimientos.length;

  const totalMonto = movimientos.reduce((acc, movimiento) => acc + movimiento.monto, 0);
  const breakdown = movimientos.reduce<Record<string, number>>((acc, movimiento) => {
    const key = movimiento.medioPago;
    acc[key] = (acc[key] ?? 0) + movimiento.monto;
    return acc;
  }, {});

  const syncSearchParams = (params: {
    fechaDesde: string;
    fechaHasta: string;
    medioPago: MedioPagoFiltro;
    titularId?: number | null;
    page?: number;
  }) => {
    const next = new URLSearchParams();
    next.set('fechaDesde', params.fechaDesde);
    next.set('fechaHasta', params.fechaHasta);
    next.set('medioPago', params.medioPago);
    next.set('page', (params.page ?? 1).toString());
    if (typeof params.titularId === 'number' && !Number.isNaN(params.titularId)) {
      next.set('titularId', params.titularId.toString());
    }
    setSearchParams(next);
  };

  const handleApplyFilters = (filters: FiltersDraft) => {
    syncSearchParams({
      fechaDesde: filters.fechaDesde,
      fechaHasta: filters.fechaHasta,
      medioPago: filters.medioPago,
      titularId: filters.titular?.id ?? null,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    syncSearchParams({
      fechaDesde: defaultFilters.fechaDesde,
      fechaHasta: defaultFilters.fechaHasta,
      medioPago: defaultFilters.medioPago,
      titularId: null,
      page: 1,
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando historial de movimientos..." />;
  }

  if (isError) {
    const errorMessage = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'No pudimos cargar los movimientos.';
    return <ErrorState message={errorMessage} />;
  }

  const renderMedioBadge = (medioPago: string) => {
    const baseClasses = medioPagoClasses[medioPago] ?? 'bg-gray-100 text-gray-700 border-gray-200';
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${baseClasses}`}>
        <span className="material-symbols-outlined text-[16px]">credit_card</span>
        {medioPago}
      </span>
    );
  };

  const renderMovimientosTable = () => {
    if (isEmpty) {
      return <EmptyState message="No hay movimientos para este criterio" />;
    }

    return (
      <div className="overflow-hidden rounded-3xl border border-[#e1e8ec] bg-white shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#27272a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha y hora</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Titular</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Periodo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Medio de pago</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Observaciones</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {movimientos.map((movimiento) => (
                <tr key={movimiento.id}>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{formatDateTime(movimiento.fechaPago)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    <p className="font-semibold text-[#0f181a] dark:text-white">{movimiento.titularApellido}</p>
                    <p className="text-xs text-gray-500">{movimiento.titularNombre}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{movimiento.periodo}</td>
                  <td className="px-6 py-4 text-sm">{renderMedioBadge(movimiento.medioPago)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {movimiento.observaciones ? movimiento.observaciones : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-[#0f181a] dark:text-white">
                    {formatCurrency(movimiento.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800 md:hidden">
          {movimientos.map((movimiento) => (
            <div key={movimiento.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{movimiento.titularApellido}</p>
                  <p className="text-xs text-gray-500">{movimiento.titularNombre}</p>
                </div>
                {renderMedioBadge(movimiento.medioPago)}
              </div>
              <p className="mt-2 text-xs uppercase tracking-wide text-gray-400">{movimiento.periodo}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{formatDateTime(movimiento.fechaPago)}</p>
              <p className="mt-2 text-sm font-semibold text-[#0f181a] dark:text-white">{formatCurrency(movimiento.monto)}</p>
              <p className="mt-1 text-xs text-gray-500">{movimiento.observaciones || 'Sin observaciones'}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full w-full bg-[#fafafa] dark:bg-[#18181b]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="rounded-3xl border border-[#e1e8ec] bg-white px-6 py-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1d8ca5]">Control financiero</p>
              <h1 className="text-2xl font-bold text-[#0f181a] dark:text-white">Historial de movimientos</h1>
              <p className="text-sm text-gray-500">Registrá, filtrá y exportá todos los movimientos registrados por fecha, titular o medio de pago.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/pagos"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#1d8ca5]/60 hover:text-[#1d8ca5]"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Volver a pagos
              </Link>
              <Button
                type="button"
                variant="brand"
                onClick={() => setIsRegisterModalOpen(true)}
                className="flex items-center gap-2 rounded-full px-5"
              >
                <span className="material-symbols-outlined text-[20px]">payments</span>
                Registrar pago
              </Button>
            </div>
          </div>
        </header>

        <MovimientosFiltersCard
          key={filtersKey}
          initialFilters={appliedFilters}
          defaultFilters={defaultFilters}
          onApply={handleApplyFilters}
          onReset={handleClearFilters}
          isFetching={isFetching}
        />

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-[#e1e8ec] bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total transaccionado</p>
            <p className="mt-2 text-3xl font-bold text-[#0f181a] dark:text-white">{formatCurrency(totalMonto)}</p>
            <p className="text-xs text-gray-500">Últimos {movimientos.length} movimientos</p>
          </div>
          <div className="rounded-3xl border border-[#e1e8ec] bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
            <p className="text-xs uppercase tracking-wide text-gray-500">Cantidad de movimientos</p>
            <p className="mt-2 text-3xl font-bold text-[#0f181a] dark:text-white">{movimientos.length}</p>
            <p className="text-xs text-gray-500">Coinciden con los filtros aplicados</p>
          </div>
          {['Efectivo', 'Transferencia', 'Cheque'].map((medio) => (
            <div
              key={medio}
              className="rounded-3xl border border-[#e1e8ec] bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">{medio}</p>
              <p className="mt-2 text-2xl font-semibold text-[#0f181a] dark:text-white">
                {formatCurrency(breakdown[medio] ?? 0)}
              </p>
              <p className="text-xs text-gray-500">{breakdown[medio] ? 'Registrado' : 'Sin registros'}</p>
            </div>
          ))}
        </section>

        {renderMovimientosTable()}

        <Pagination
          currentPage={pageNumber}
          totalCount={totalCount}
          pageSize={MOVIMIENTOS_PAGE_SIZE}
          onPageChange={(page) =>
            syncSearchParams({
              fechaDesde: safeFechaDesde,
              fechaHasta: safeFechaHasta,
              medioPago: medioPagoParam,
              titularId: titularIdForQuery ?? null,
              page,
            })
          }
        />

        <RegistrarPagoModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false);
            refetch();
          }}
        />
      </div>
    </div>
  );
};

interface MovimientosFiltersCardProps {
  initialFilters: FiltersDraft;
  defaultFilters: FiltersDraft;
  onApply: (filters: FiltersDraft) => void;
  onReset: () => void;
  isFetching: boolean;
}

const MovimientosFiltersCard = ({
  initialFilters,
  defaultFilters,
  onApply,
  onReset,
  isFetching,
}: MovimientosFiltersCardProps) => {
  const [fechaDesde, setFechaDesde] = useState(initialFilters.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(initialFilters.fechaHasta);
  const [medioPago, setMedioPago] = useState<MedioPagoFiltro>(initialFilters.medioPago);
  const [titular, setTitular] = useState<TitularOption | null>(initialFilters.titular);

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

        <MovimientosTitularSearch
          value={titular}
          onSelect={(option) => setTitular(option)}
          onClear={() => setTitular(null)}
        />

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
