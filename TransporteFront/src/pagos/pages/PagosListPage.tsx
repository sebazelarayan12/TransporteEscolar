import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePagosPaginados, useEstadisticasMes } from '../services/pagos.queries';
import { getPagoEstado } from '../helpers/periodo.helpers';
import { 
  SearchInput, 
  LoadingScreen, 
  MonthYearFilter, 
  EstadisticasMesCard, 
  PagoStatusBadge,
  Pagination
} from '../../shared/ui';
import { useDebounce } from '../../shared/hooks/useDebounce';
import type { PagoMensual } from '../types/pago.types';

export const PagosListPage = () => {
  // Initialize with current month
  const currentDate = new Date();
  const [selectedMes, setSelectedMes] = useState<number>(currentDate.getMonth() + 1);
  const [selectedAnio, setSelectedAnio] = useState<number>(currentDate.getFullYear());
  const [search, setSearch] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPageNumber(1);
  };

  // Fetch paginated data
  const { data: paginatedData, isLoading, isFetching } = usePagosPaginados(
    selectedMes,
    selectedAnio,
    debouncedSearch,
    pageNumber,
    20
  );

  // Fetch statistics
  const { data: estadisticas } = useEstadisticasMes(selectedMes, selectedAnio);

  const handleFilterChange = (mes: number, anio: number) => {
    setSelectedMes(mes);
    setSelectedAnio(anio);
    setPageNumber(1);
    setSearch('');
  };

  // Show loading on first load
  if (isLoading) {
    return <LoadingScreen message="Cargando pagos..." />;
  }

  const pagos = paginatedData?.data ?? [];
  const totalCount = paginatedData?.totalCount ?? 0;

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
            <Link
              to="/not-found"
              className="flex items-center justify-center gap-2 rounded-full bg-[#1d8ca5] px-5 py-2 font-semibold text-white shadow-lg shadow-[#1d8ca5]/30 hover:bg-[#187286] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">add_card</span>
              Generar lote
            </Link>
          </div>
        </header>

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
        {pagos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-[#1f1f24]">
            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">receipt_long</span>
            <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-400">
              {search ? 'No se encontraron pagos con ese criterio' : 'No hay pagos para este mes'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {search ? 'Intenta con otro término de búsqueda' : 'Los pagos se generarán automáticamente al confirmar reinscripciones'}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-[#e1e8ec] bg-white shadow-sm dark:border-white/5 dark:bg-[#1f1f24] overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
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
                    {pagos.map((pago: PagoMensual) => {
                      const estado = getPagoEstado(pago);
                      return (
                        <tr 
                          key={pago.id}
                          className="hover:bg-gray-50 dark:hover:bg-[#27272a] transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            {pago.titularApellido}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {pago.periodo}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                            ${pago.montoGenerado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-green-600 dark:text-green-500">
                            ${pago.totalPagado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-red-600 dark:text-red-500 font-medium">
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

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                {pagos.map((pago: PagoMensual) => {
                  const estado = getPagoEstado(pago);
                  return (
                    <div key={pago.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#27272a] transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{pago.titularApellido}</p>
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
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            <Pagination 
              currentPage={pageNumber}
              totalCount={totalCount}
              pageSize={20}
              onPageChange={setPageNumber}
            />
          </>
        )}
      </div>
    </div>
  );
};
