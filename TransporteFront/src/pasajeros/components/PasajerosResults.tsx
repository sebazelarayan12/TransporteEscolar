import type { ReactNode } from 'react';
import { Pagination } from '../../shared/ui/Pagination';
import type { PasajeroPaginationResponse, PasajeroResponse } from '../types/pasajero.types';

interface PasajerosResultsProps {
  data?: PasajeroPaginationResponse;
  isLoading: boolean;
  isFetching: boolean;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  renderItem: (pasajero: PasajeroResponse) => ReactNode;
}

const FetchingSpinner = () => (
  <div className="absolute right-2 top-2 z-10">
    <div className="rounded-full border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-[#27272a]">
      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#007a8a]"></div>
    </div>
  </div>
);

const LoadingState = ({ paddingClass }: { paddingClass: string }) => (
  <div className={`flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 ${paddingClass}`}>
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#007a8a]"></div>
      <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
    </div>
  </div>
);

const EmptyResults = ({ paddingClass }: { paddingClass: string }) => (
  <div className={`flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 ${paddingClass}`}>
    No se encontraron pasajeros para ese criterio.
  </div>
);

interface ResultsBodyProps extends PasajerosResultsProps {
  paddingClass: string;
}

const ResultsBody = ({ data, isLoading, paddingClass, renderItem }: ResultsBodyProps) => {
  if (isLoading) return <LoadingState paddingClass={paddingClass} />;
  if (!data) return null;
  if (data.data.length === 0) return <EmptyResults paddingClass={paddingClass} />;
  return <>{data.data.map(renderItem)}</>;
};

const ResultsPagination = ({ data, currentPage, pageSize, onPageChange }: PasajerosResultsProps) => {
  if (!data || data.totalCount === 0) return null;
  return (
    <Pagination currentPage={currentPage} totalCount={data.totalCount} pageSize={pageSize} onPageChange={onPageChange} />
  );
};

/** Tabla de escritorio (md+) con altura fija y scroll interno. */
export const PasajerosDesktopResults = ({ header, ...props }: PasajerosResultsProps & { header: ReactNode }) => (
  <div className="hidden overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a] md:flex md:h-[600px] md:flex-col">
    {header}
    <div className="custom-scrollbar relative flex-1 divide-y divide-gray-100 overflow-y-auto dark:divide-white/5">
      {props.isFetching && props.data && <FetchingSpinner />}
      <ResultsBody {...props} paddingClass="py-8" />
    </div>
    <ResultsPagination {...props} />
  </div>
);

/** Lista compacta para mobile. */
export const PasajerosMobileResults = (props: PasajerosResultsProps) => (
  <div className="flex flex-col overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a] md:hidden">
    <div className="custom-scrollbar relative max-h-[70vh] overflow-y-auto">
      {props.isFetching && props.data && <FetchingSpinner />}
      <ResultsBody {...props} paddingClass="p-8" />
    </div>
    <ResultsPagination {...props} />
  </div>
);
