import { useSearchParams } from 'react-router-dom';
import { useTitular } from '../../titulares/services/titulares.queries';
import { getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';
import {
  MEDIOS_PAGO,
  type FiltersDraft,
  type MedioPagoFiltro,
  isValidDateInput,
} from '../components/movimientos/movimientosFilters.shared';
import type { MovimientosFilterRequest } from '../types/movimientos.types';

export const MOVIMIENTOS_PAGE_SIZE = 20;

interface SearchParamsInput {
  fechaDesde: string;
  fechaHasta: string;
  medioPago: MedioPagoFiltro;
  titularId?: number | null;
  page?: number;
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

const parseMedioPago = (raw: string | null): MedioPagoFiltro =>
  MEDIOS_PAGO.includes(raw as MedioPagoFiltro) ? (raw as MedioPagoFiltro) : 'todos';

const parsePageNumber = (raw: string | null) => {
  const page = Number(raw ?? '1');
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const parseTitularId = (raw: string | null) => {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isNaN(id) ? null : id;
};

const pickValidDate = (raw: string | null, fallback: string) => (raw && isValidDateInput(raw) ? raw : fallback);

/**
 * Filtros del historial de movimientos, sincronizados con los query params de la URL.
 */
export const useMovimientosFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const today = new Date();
  const defaultFilters: FiltersDraft = {
    fechaDesde: toInputDate(subtractDays(today, 30)),
    fechaHasta: toInputDate(today),
    medioPago: 'todos',
    titular: null,
  };

  const fechaHasta = pickValidDate(searchParams.get('fechaHasta'), defaultFilters.fechaHasta);
  const fechaDesdeRaw = pickValidDate(searchParams.get('fechaDesde'), defaultFilters.fechaDesde);
  const fechaDesde = fechaDesdeRaw > fechaHasta ? fechaHasta : fechaDesdeRaw;
  const medioPago = parseMedioPago(searchParams.get('medioPago'));
  const titularId = parseTitularId(searchParams.get('titularId'));
  const pageNumber = parsePageNumber(searchParams.get('page'));

  const { data: titularDetalle } = useTitular(titularId ?? 0);
  const titularLabel = titularDetalle
    ? getTitularApellidoDisplay(titularDetalle.apellido, titularDetalle.nombreContacto)
    : `Titular #${titularId}`;
  const titular = titularId === null ? null : { id: titularId, label: titularLabel };

  const appliedFilters: FiltersDraft = { fechaDesde, fechaHasta, medioPago, titular };
  const filtersKey = [fechaDesde, fechaHasta, medioPago, titular?.id ?? 'none', titular?.label ?? ''].join('|');

  const queryFilter: MovimientosFilterRequest = {
    fechaDesde,
    fechaHasta,
    pageNumber,
    pageSize: MOVIMIENTOS_PAGE_SIZE,
    ...(titularId === null ? {} : { titularId }),
    ...(medioPago === 'todos' ? {} : { medioPago }),
  };

  const syncSearchParams = (params: SearchParamsInput) => {
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

  return {
    appliedFilters,
    defaultFilters,
    filtersKey,
    queryFilter,
    pageNumber,
    applyFilters: (filters: FiltersDraft) =>
      syncSearchParams({ ...filters, titularId: filters.titular?.id ?? null, page: 1 }),
    clearFilters: () => syncSearchParams({ ...defaultFilters, titularId: null, page: 1 }),
    changePage: (page: number) => syncSearchParams({ fechaDesde, fechaHasta, medioPago, titularId, page }),
  };
};
