import { Spinner } from '../../shared/ui/Spinner';
import { Amount } from '../../shared/ui/Amount';
import type { ReinscripcionPrecioPrevioResponse } from '../types/reinscripcion.types';

interface PrecioResumenProps {
  isLoading: boolean;
  hasError: boolean;
  precioData: ReinscripcionPrecioPrevioResponse | null | undefined;
  onRetry: () => void;
}

const PrecioLoading = () => (
  <div className="flex flex-col items-center gap-3 py-6 text-center">
    <Spinner />
    <p className="text-sm text-gray-500 dark:text-gray-300">Calculando precio final...</p>
  </div>
);

const PrecioError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-900 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-50">
    <p className="font-semibold">No pudimos obtener el precio final.</p>
    <p className="mt-1 text-xs opacity-90">Revisa la conexión e inténtalo nuevamente antes de confirmar.</p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1d8ca5] hover:text-[#166478]"
    >
      <span className="material-symbols-outlined text-[16px]">refresh</span>
      Reintentar
    </button>
  </div>
);

interface AjusteAmountProps {
  sign: '+' | '-';
  value: number;
}

const AjusteAmount = ({ sign, value }: AjusteAmountProps) =>
  value > 0 ? (
    <>
      {sign} <Amount value={value} />
    </>
  ) : (
    <Amount value={0} />
  );

const PrecioDetalle = ({ precio }: { precio: ReinscripcionPrecioPrevioResponse }) => {
  const { montoBase, descuentosAplicados, recargosAplicados, totalCalculado } = precio;
  const hayAjustes = descuentosAplicados > 0 || recargosAplicados > 0;

  return (
    <div className="space-y-4">
      <dl className="space-y-3 text-sm text-gray-600 dark:text-gray-100">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Monto base</dt>
          <dd className="text-right font-semibold text-gray-900 dark:text-white"><Amount value={montoBase} /></dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Descuentos</dt>
          <dd className="text-right font-semibold text-emerald-600 dark:text-emerald-300">
            <AjusteAmount sign="-" value={descuentosAplicados} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Recargos</dt>
          <dd className="text-right font-semibold text-rose-600 dark:text-rose-300">
            <AjusteAmount sign="+" value={recargosAplicados} />
          </dd>
        </div>
      </dl>
      <div className="rounded-2xl bg-[#0f181a] p-4 text-white dark:bg-white/10 dark:text-white">
        <p className="text-xs uppercase tracking-wide text-white/80">Total a generar</p>
        <p className="mt-2 text-3xl font-bold"><Amount value={totalCalculado} /></p>
        <p className="mt-1 text-xs text-white/70">
          Este será el importe usado para crear las cuotas automáticas{hayAjustes ? ', incluyendo los ajustes aplicados.' : '.'}
        </p>
      </div>
    </div>
  );
};

export const PrecioResumen = ({ isLoading, hasError, precioData, onRetry }: PrecioResumenProps) => {
  if (isLoading) return <PrecioLoading />;
  if (hasError) return <PrecioError onRetry={onRetry} />;
  if (!precioData) return null;
  return <PrecioDetalle precio={precioData} />;
};
