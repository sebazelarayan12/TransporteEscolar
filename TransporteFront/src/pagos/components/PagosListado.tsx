import { getPagoEstado } from '../helpers/periodo.helpers';
import { ESTADO_FILTRO_LABELS, PAGOS_PAGE_SIZE, filterPagosByEstado } from '../helpers/pagos-list.helpers';
import { PagoStatusBadge } from '../../shared/ui/PagoStatusBadge';
import { Pagination } from '../../shared/ui/Pagination';
import { Amount } from '../../shared/ui/Amount';
import { getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';
import { onActivationKey } from '../../shared/utils/keyboard.helpers';
import type { PagoMensual, PagosEstadoFiltro } from '../types/pago.types';
import { PagosStatusFilters } from './PagosStatusFilters';

const TABLE_HEADERS = [
  { label: 'Titular', align: 'text-left' },
  { label: 'Periodo', align: 'text-left' },
  { label: 'Monto Generado', align: 'text-right' },
  { label: 'Total Pagado', align: 'text-right' },
  { label: 'Saldo Pendiente', align: 'text-right' },
  { label: 'Estado', align: 'text-center' },
];

interface PagosEmptyStateCardProps {
  hasSearch: boolean;
}

const PagosEmptyStateCard = ({ hasSearch }: PagosEmptyStateCardProps) => (
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

const PagosSinResultados = ({ estadoFiltro }: { estadoFiltro: PagosEstadoFiltro }) => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
    <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">filter_list_off</span>
    <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
      No hay movimientos {estadoFiltro === 'todos' ? 'para mostrar' : `en estado ${ESTADO_FILTRO_LABELS[estadoFiltro]}`}.
    </p>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Probá cambiar el filtro o navegá a otra página para encontrar más registros.
    </p>
  </div>
);

interface PagosTableProps {
  pagos: PagoMensual[];
  onSelectPago: (pagoId: number) => void;
}

const PagosDesktopTable = ({ pagos, onSelectPago }: PagosTableProps) => (
  <div className="hidden overflow-x-auto md:block">
    <table className="w-full">
      <thead className="border-b border-gray-200 dark:border-gray-700">
        <tr className="bg-gray-50 dark:bg-zinc-800">
          {TABLE_HEADERS.map((header) => (
            <th
              key={header.label}
              scope="col"
              className={`px-6 py-3 ${header.align} text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400`}
            >
              {header.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {pagos.map((pago) => (
          <tr
            key={pago.id}
            tabIndex={0}
            onClick={() => onSelectPago(pago.id)}
            onKeyDown={onActivationKey(() => onSelectPago(pago.id))}
            className="cursor-pointer transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800"
          >
            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
              <div className="flex flex-col">
                <span className="text-base font-semibold leading-tight text-[#0f181a] dark:text-white">
                  {getTitularApellidoDisplay(pago.titularApellido, pago.titularNombre)}
                </span>
                {pago.titularDireccion ? <span className="text-xs text-gray-400">{pago.titularDireccion}</span> : null}
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pago.periodo}</td>
            <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
              <Amount value={pago.montoGenerado} />
            </td>
            <td className="px-6 py-4 text-sm text-right text-green-600 dark:text-green-500">
              <Amount value={pago.totalPagado} />
            </td>
            <td className="px-6 py-4 text-sm text-right font-medium text-red-600 dark:text-red-500">
              <Amount value={pago.saldoPendiente} />
            </td>
            <td className="px-6 py-4 text-center">
              <PagoStatusBadge estado={getPagoEstado(pago)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PagosMobileCards = ({ pagos, onSelectPago }: PagosTableProps) => (
  <div className="divide-y divide-gray-200 dark:divide-gray-700 md:hidden">
    {pagos.map((pago) => (
      <button
        type="button"
        key={pago.id}
        onClick={() => onSelectPago(pago.id)}
        className="w-full cursor-pointer p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800"
      >
        <div className="mb-2 flex items-start justify-between">
          <div>
            <div>
              <p className="leading-tight font-semibold text-gray-900 dark:text-white">
                {getTitularApellidoDisplay(pago.titularApellido, pago.titularNombre)}
              </p>
              {pago.titularDireccion ? <p className="text-xs text-gray-400">{pago.titularDireccion}</p> : null}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{pago.periodo}</p>
          </div>
          <PagoStatusBadge estado={getPagoEstado(pago)} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-gray-500">Generado</p>
            <p className="font-medium text-gray-900 dark:text-white">
              <Amount value={pago.montoGenerado} />
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Pagado</p>
            <p className="font-medium text-green-600">
              <Amount value={pago.totalPagado} />
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Saldo Pendiente</p>
            <p className="font-semibold text-red-600">
              <Amount value={pago.saldoPendiente} />
            </p>
          </div>
        </div>
      </button>
    ))}
  </div>
);

interface PagosListadoProps {
  pagos: PagoMensual[];
  totalCount: number;
  hasSearch: boolean;
  estadoFiltro: PagosEstadoFiltro;
  filterCounts: Record<PagosEstadoFiltro, number>;
  pageNumber: number;
  onPageChange: (page: number) => void;
  onSelectPago: (pagoId: number) => void;
  onEstadoSelect: (estado: PagosEstadoFiltro) => void;
}

export const PagosListado = ({
  pagos,
  totalCount,
  hasSearch,
  estadoFiltro,
  filterCounts,
  pageNumber,
  onPageChange,
  onSelectPago,
  onEstadoSelect,
}: PagosListadoProps) => {
  if (pagos.length === 0) {
    return <PagosEmptyStateCard hasSearch={hasSearch} />;
  }

  const filteredPagos = filterPagosByEstado(pagos, estadoFiltro);

  return (
    <>
      <PagosStatusFilters
        totalPeriodo={totalCount}
        matchingCount={filteredPagos.length}
        estadoSeleccionado={estadoFiltro}
        onEstadoSelect={onEstadoSelect}
        counts={filterCounts}
      />
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-white/5 dark:bg-zinc-900">
        {filteredPagos.length === 0 ? (
          <PagosSinResultados estadoFiltro={estadoFiltro} />
        ) : (
          <>
            <PagosDesktopTable pagos={filteredPagos} onSelectPago={onSelectPago} />
            <PagosMobileCards pagos={filteredPagos} onSelectPago={onSelectPago} />
          </>
        )}
      </div>
      <Pagination currentPage={pageNumber} totalCount={totalCount} pageSize={PAGOS_PAGE_SIZE} onPageChange={onPageChange} />
    </>
  );
};
