import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LoadingScreen, ErrorState, Pagination } from '../../shared/ui';
import { RegistrarPagoModal } from '../components/RegistrarPagoModal';
import { usePagosMovimientos, useEliminarMovimiento } from '../services/pagos.queries';
import type { MovimientosFilterRequest, MovimientoHistorial } from '../types/movimientos.types';
import { useTitular } from '../../titulares/services/titulares.queries';
import { useToast } from '../../shared/hooks';
import { EliminarMovimientoDialog } from '../components/EliminarMovimientoDialog';
import { MovimientosFiltersCard } from '../components/movimientos/MovimientosFiltersCard';
import {
  MEDIOS_PAGO,
  type MedioPagoFiltro,
  type FiltersDraft,
  isValidDateInput,
} from '../components/movimientos/movimientosFilters.shared';
import { PagosMovimientosHeader } from '../components/movimientos/PagosMovimientosHeader';
import { MovimientosResumenCards } from '../components/movimientos/MovimientosResumenCards';
import { MovimientosTableSection } from '../components/movimientos/MovimientosTableSection';

const MOVIMIENTOS_PAGE_SIZE = 20;

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

export const PagosMovimientosPage = () => {
  const today = new Date();
  const defaultFechaHasta = toInputDate(today);
  const defaultFechaDesde = toInputDate(subtractDays(today, 30));
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<MovimientoHistorial | null>(null);

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
  const eliminarMovimiento = useEliminarMovimiento();
  const { showSuccess, showError } = useToast();

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

  const handleOpenDelete = (movimiento: MovimientoHistorial) => {
    if (eliminarMovimiento.isPending) {
      return;
    }

    setMovimientoSeleccionado(movimiento);
  };

  const handleCloseDelete = () => {
    if (eliminarMovimiento.isPending) {
      return;
    }

    setMovimientoSeleccionado(null);
  };

  const handleConfirmDelete = async () => {
    if (!movimientoSeleccionado) {
      return;
    }

    try {
      await eliminarMovimiento.mutateAsync({
        pagoMensualId: movimientoSeleccionado.pagoMensualId,
        movimientoId: movimientoSeleccionado.id,
      });
      showSuccess('Movimiento eliminado correctamente');
      setMovimientoSeleccionado(null);
    } catch (mutationError) {
      console.error(mutationError);
      showError('No pudimos eliminar el movimiento. Intentalo nuevamente.');
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando historial de movimientos..." />;
  }

  if (isError) {
    const errorMessage = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'No pudimos cargar los movimientos.';
    return <ErrorState message={errorMessage} />;
  }

  return (
    <div className="min-h-full w-full bg-[#fafafa] dark:bg-[#18181b]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PagosMovimientosHeader onRegistrarPago={() => setIsRegisterModalOpen(true)} />

        <MovimientosFiltersCard
          key={filtersKey}
          initialFilters={appliedFilters}
          defaultFilters={defaultFilters}
          onApply={handleApplyFilters}
          onReset={handleClearFilters}
          isFetching={isFetching}
        />

        <MovimientosResumenCards totalMonto={totalMonto} totalMovimientos={movimientos.length} breakdown={breakdown} />

        <MovimientosTableSection
          movimientos={movimientos}
          isEmpty={isEmpty}
          onDelete={handleOpenDelete}
          isProcessingDelete={eliminarMovimiento.isPending}
          selectedMovimientoId={movimientoSeleccionado?.id ?? null}
        />

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
        <EliminarMovimientoDialog
          isOpen={Boolean(movimientoSeleccionado)}
          resumen={
            movimientoSeleccionado
              ? {
                  monto: movimientoSeleccionado.monto,
                  medioPago: movimientoSeleccionado.medioPago,
                  fechaPago: movimientoSeleccionado.fechaPago,
                  periodo: movimientoSeleccionado.periodo,
                  titularLabel:
                    movimientoSeleccionado.titularNombreCompleto ??
                    `${movimientoSeleccionado.titularApellido}, ${movimientoSeleccionado.titularNombre}`,
                  observaciones: movimientoSeleccionado.observaciones,
                }
              : null
          }
          onCancel={handleCloseDelete}
          onConfirm={handleConfirmDelete}
          isProcessing={eliminarMovimiento.isPending}
        />
      </div>
    </div>
  );
};
