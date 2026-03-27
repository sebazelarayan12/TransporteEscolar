import { useReducer } from 'react';
import { Link } from 'react-router-dom';
import { usePagosPaginados, useEstadisticasMes } from '../services/pagos.queries';
import { getPagoEstado } from '../helpers/periodo.helpers';
import {
  SearchInput,
  LoadingScreen,
  MonthYearFilter,
  EstadisticasMesCard,
  PagoStatusBadge,
  Pagination,
  Button,
  Alert,
} from '../../shared/ui';
import { useDebounce } from '../../shared/hooks/useDebounce';
import type { PagoEstado, PagoMensual, PagosEstadoFiltro } from '../types/pago.types';
import { RegistrarPagoModal, PagosStatusFilters, PagoDetalleModal } from '../components';
import { useReinscripcionesAlertasPagos } from '../../reinscripciones/services/reinscripciones.queries';

type PagosViewState = {
  selectedMes: number;
  selectedAnio: number;
  search: string;
  pageNumber: number;
  isRegisterModalOpen: boolean;
  estadoFiltro: PagosEstadoFiltro;
  selectedPagoId: number | null;
};

type PagosViewAction =
  | { type: 'setPeriodo'; mes: number; anio: number }
  | { type: 'setSearch'; value: string }
  | { type: 'setPage'; page: number }
  | { type: 'toggleRegisterModal'; isOpen: boolean }
  | { type: 'setEstadoFiltro'; value: PagosEstadoFiltro }
  | { type: 'openDetalle'; pagoId: number }
  | { type: 'closeDetalle' };

const createInitialPagosState = (): PagosViewState => {
  const now = new Date();
  return {
    selectedMes: now.getMonth() + 1,
    selectedAnio: now.getFullYear(),
    search: '',
    pageNumber: 1,
    isRegisterModalOpen: false,
    estadoFiltro: 'todos',
    selectedPagoId: null,
  };
};

const pagosViewReducer = (state: PagosViewState, action: PagosViewAction): PagosViewState => {
  switch (action.type) {
    case 'setPeriodo':
      return {
        ...state,
        selectedMes: action.mes,
        selectedAnio: action.anio,
        pageNumber: 1,
        search: '',
      };
    case 'setSearch':
      return {
        ...state,
        search: action.value,
        pageNumber: 1,
      };
    case 'setPage':
      return {
        ...state,
        pageNumber: action.page,
      };
    case 'toggleRegisterModal':
      return {
        ...state,
        isRegisterModalOpen: action.isOpen,
      };
    case 'setEstadoFiltro':
      return {
        ...state,
        estadoFiltro: action.value,
      };
    case 'openDetalle':
      return {
        ...state,
        selectedPagoId: action.pagoId,
      };
    case 'closeDetalle':
      return {
        ...state,
        selectedPagoId: null,
      };
    default:
      return state;
  }
};

export const PagosListPage = () => {
  const [state, dispatch] = useReducer(pagosViewReducer, undefined, createInitialPagosState);
  const {
    selectedMes,
    selectedAnio,
    search,
    pageNumber,
    isRegisterModalOpen,
    estadoFiltro,
    selectedPagoId,
  } = state;
  const isDetalleModalOpen = selectedPagoId !== null;
  const debouncedSearch = useDebounce(search, 300);

  const handleOpenDetalleModal = (pagoId: number) => {
    dispatch({ type: 'openDetalle', pagoId });
  };

  const handleCloseDetalleModal = () => {
    dispatch({ type: 'closeDetalle' });
  };

  const handleSearchChange = (value: string) => {
    dispatch({ type: 'setSearch', value });
  };

  // Fetch paginated data
  const { data: paginatedData, isLoading, isFetching, refetch: refetchPagos } = usePagosPaginados(
    selectedMes,
    selectedAnio,
    debouncedSearch,
    pageNumber,
    20
  );

  // Fetch statistics
  const { data: estadisticas, refetch: refetchEstadisticas } = useEstadisticasMes(selectedMes, selectedAnio);
  const { data: alertasPagos } = useReinscripcionesAlertasPagos(selectedAnio);

  const handleFilterChange = (mes: number, anio: number) => {
    dispatch({ type: 'setPeriodo', mes, anio });
  };

  const handlePageChange = (page: number) => {
    dispatch({ type: 'setPage', page });
  };

  const toggleRegisterModal = (isOpen: boolean) => {
    dispatch({ type: 'toggleRegisterModal', isOpen });
  };

  // Show loading on first load
  if (isLoading) {
    return <LoadingScreen message="Cargando pagos..." />;
  }

  const pagos = paginatedData?.data ?? [];
  const totalCount = paginatedData?.totalCount ?? 0;

  const estadoCounts = pagos.reduce<Record<PagoEstado, number>>(
    (acc, pago) => {
      const estado = getPagoEstado(pago);
      acc[estado] += 1;
      return acc;
    },
    { pendiente: 0, pagado: 0, vencido: 0 }
  );

  const filteredPagos =
    estadoFiltro === 'todos' ? pagos : pagos.filter((pago) => getPagoEstado(pago) === estadoFiltro);

  const filterCounts: Record<PagosEstadoFiltro, number> = {
    todos: pagos.length,
    pendiente: estadoCounts.pendiente,
    pagado: estadoCounts.pagado,
    vencido: estadoCounts.vencido,
  };

  const noPagosDisponibles = pagos.length === 0;
  const sinResultadosPorFiltro = !noPagosDisponibles && filteredPagos.length === 0;
  const estadoFiltroLabels: Record<PagosEstadoFiltro, string> = {
    todos: 'todos los estados',
    pendiente: 'pendientes',
    pagado: 'pagados',
    vencido: 'vencidos',
  };
  const pendientesAlert = alertasPagos?.pendientes ?? [];
  const shouldShowAlertasPagos = pendientesAlert.length > 0;
  const pendientesPreview = pendientesAlert.slice(0, 5);
  const pendientesRestantes = pendientesAlert.length - pendientesPreview.length;

  return (
    <div className="min-h-full w-full bg-[#fafafa] dark:bg-[#18181b]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <header className="rounded-3xl border border-[#e1e8ec] bg-white px-6 py-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1d8ca5]">Control mensual</p>
              <h1 className="text-2xl font-bold text-[#0f181a] dark:text-white">Pagos y Recaudación</h1>
              <p className="text-sm text-gray-500">Seguimiento en tiempo real de vencimientos, saldos y registros manuales.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/pagos/movimientos"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#1d8ca5]/60 hover:text-[#1d8ca5]"
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                Ver historial
              </Link>
              <Button
                type="button"
                variant="brand"
                onClick={() => toggleRegisterModal(true)}
                className="flex items-center justify-center gap-2 rounded-full px-5 py-2 font-semibold"
              >
                <span className="material-symbols-outlined text-[20px]">payments</span>
                Registrar Pago
              </Button>
            </div>
          </div>
        </header>

        {shouldShowAlertasPagos && (
          <Alert variant="warning" className="space-y-3 rounded-3xl border-yellow-200 bg-yellow-50 text-yellow-900">
            <div>
              <p className="text-sm font-semibold">
                Hay {pendientesAlert.length} pasajero{pendientesAlert.length !== 1 ? 's' : ''} pendientes en {selectedAnio}
              </p>
            </div>
            {pendientesAlert.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide">Pendientes ({pendientesAlert.length})</p>
                <ul className="list-disc space-y-1 pl-4 text-xs text-yellow-900 sm:text-sm">
                  {pendientesPreview.map((alerta) => (
                    <li key={alerta.reinscripcionId}>
                      {alerta.pasajeroNombre} � Titular: {alerta.titularNombre}
                    </li>
                  ))}
                </ul>
                {pendientesRestantes > 0 && (
                  <p className="text-xs font-medium text-yellow-900">
                    y {pendientesRestantes} pasajero{pendientesRestantes !== 1 ? 's' : ''} m�s pendientes de confirmar.
                  </p>
                )}
              </div>
            )}
          </Alert>
        )}

        {/* Month/Year Filter */}
        <MonthYearFilter 
          selectedMes={selectedMes}
          selectedAnio={selectedAnio}
          onFilterChange={handleFilterChange}
        />

        {/* Statistics Card */}
        {estadisticas && <EstadisticasMesCard estadisticas={estadisticas} />}

        {/* Search Input */}
        <div className="relative">
          <SearchInput 
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por apellido del titular..."
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1d8ca5] border-t-transparent" />
            </div>
          )}
        </div>

        {/* Payments Table */}
        {noPagosDisponibles ? (
          <PagosEmptyStateCard hasSearch={Boolean(search)} />
        ) : (
          <PagosListadoSection
            filteredPagos={filteredPagos}
            totalCount={totalCount}
            estadoFiltro={estadoFiltro}
            estadoFiltroLabels={estadoFiltroLabels}
            filterCounts={filterCounts}
            sinResultadosPorFiltro={sinResultadosPorFiltro}
            pageNumber={pageNumber}
            onPageChange={handlePageChange}
            onSelectPago={handleOpenDetalleModal}
            onEstadoSelect={(estado) => dispatch({ type: 'setEstadoFiltro', value: estado })}
          />
        )}
        <RegistrarPagoModal
          isOpen={isRegisterModalOpen}
          onClose={() => toggleRegisterModal(false)}
          onSuccess={() => {
            toggleRegisterModal(false);
            refetchPagos();
            refetchEstadisticas();
          }}
        />
        <PagoDetalleModal
          isOpen={isDetalleModalOpen}
          onClose={handleCloseDetalleModal}
          pagoId={selectedPagoId}
        />
      </div>
    </div>
  );
};

const PagosEmptyStateCard = ({ hasSearch }: { hasSearch: boolean }) => {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-[#1f1f24]">
      <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">receipt_long</span>
      <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-400">
        {hasSearch ? 'No se encontraron pagos con ese criterio' : 'No hay pagos para este mes'}
      </p>
      <p className="mt-2 text-sm text-gray-500">
        {hasSearch
          ? 'Intenta con otro término de búsqueda'
          : 'Los pagos se generarán automáticamente al confirmar reinscripciones'}
      </p>
    </div>
  );
};

interface PagosListadoSectionProps {
  filteredPagos: PagoMensual[];
  totalCount: number;
  estadoFiltro: PagosEstadoFiltro;
  estadoFiltroLabels: Record<PagosEstadoFiltro, string>;
  filterCounts: Record<PagosEstadoFiltro, number>;
  sinResultadosPorFiltro: boolean;
  pageNumber: number;
  onPageChange: (page: number) => void;
  onSelectPago: (pagoId: number) => void;
  onEstadoSelect: (estado: PagosEstadoFiltro) => void;
}

const PagosListadoSection = ({
  filteredPagos,
  totalCount,
  estadoFiltro,
  estadoFiltroLabels,
  filterCounts,
  sinResultadosPorFiltro,
  pageNumber,
  onPageChange,
  onSelectPago,
  onEstadoSelect,
}: PagosListadoSectionProps) => {
  return (
    <>
      <PagosStatusFilters
        totalPeriodo={totalCount}
        matchingCount={filteredPagos.length}
        estadoSeleccionado={estadoFiltro}
        onEstadoSelect={onEstadoSelect}
        counts={filterCounts}
      />
      <div className="overflow-hidden rounded-3xl border border-[#e1e8ec] bg-white shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
        {sinResultadosPorFiltro ? (
          <PagosSinResultados estadoFiltro={estadoFiltro} labels={estadoFiltroLabels} />
        ) : (
          <>
            <PagosDesktopTable filteredPagos={filteredPagos} onSelectPago={onSelectPago} />
            <PagosMobileCards filteredPagos={filteredPagos} onSelectPago={onSelectPago} />
          </>
        )}
      </div>
      <Pagination currentPage={pageNumber} totalCount={totalCount} pageSize={20} onPageChange={onPageChange} />
    </>
  );
};

const PagosSinResultados = ({
  estadoFiltro,
  labels,
}: {
  estadoFiltro: PagosEstadoFiltro;
  labels: Record<PagosEstadoFiltro, string>;
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">filter_list_off</span>
      <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
        No hay movimientos {estadoFiltro === 'todos' ? 'para mostrar' : `en estado ${labels[estadoFiltro]}`}.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Probá cambiar el filtro o navegá a otra página para encontrar más registros.
      </p>
    </div>
  );
};

const PagosDesktopTable = ({
  filteredPagos,
  onSelectPago,
}: {
  filteredPagos: PagoMensual[];
  onSelectPago: (pagoId: number) => void;
}) => {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full">
        <thead className="border-b border-gray-200 dark:border-gray-700">
          <tr className="bg-gray-50 dark:bg-[#27272a]">
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Titular
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Periodo
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Monto Generado
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Total Pagado
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Saldo Pendiente
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredPagos.map((pago) => {
            const estado = getPagoEstado(pago);
            return (
              <tr
                key={pago.id}
                onClick={() => onSelectPago(pago.id)}
                className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-[#27272a]"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  <div className="flex flex-col">
                    <span className="text-base font-semibold leading-tight text-[#0f181a] dark:text-white">
                      {pago.titularApellido}
                    </span>
                    {pago.titularNombre ? <span className="text-xs text-gray-500">{pago.titularNombre}</span> : null}
                    {pago.titularDireccion ? <span className="text-xs text-gray-400">{pago.titularDireccion}</span> : null}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pago.periodo}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                  ${pago.montoGenerado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-sm text-right text-green-600 dark:text-green-500">
                  ${pago.totalPagado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-sm text-right font-medium text-red-600 dark:text-red-500">
                  ${pago.saldoPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-center">
                  <PagoStatusBadge estado={estado} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const PagosMobileCards = ({
  filteredPagos,
  onSelectPago,
}: {
  filteredPagos: PagoMensual[];
  onSelectPago: (pagoId: number) => void;
}) => {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700 md:hidden">
      {filteredPagos.map((pago) => {
        const estado = getPagoEstado(pago);
        return (
          <button
            type="button"
            key={pago.id}
            onClick={() => onSelectPago(pago.id)}
            className="w-full cursor-pointer p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-[#27272a]"
          >
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div>
                  <p className="leading-tight font-semibold text-gray-900 dark:text-white">{pago.titularApellido}</p>
                  {pago.titularNombre ? <p className="text-xs text-gray-500">{pago.titularNombre}</p> : null}
                  {pago.titularDireccion ? <p className="text-xs text-gray-400">{pago.titularDireccion}</p> : null}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{pago.periodo}</p>
              </div>
              <PagoStatusBadge estado={estado} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">Generado</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  ${pago.montoGenerado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pagado</p>
                <p className="font-medium text-green-600">
                  ${pago.totalPagado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Saldo Pendiente</p>
                <p className="font-semibold text-red-600">
                  ${pago.saldoPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
