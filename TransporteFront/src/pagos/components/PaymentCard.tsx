import type { PagoMensual, PaymentStatus } from '../types/pago.types';
import { formatDateOnlyCompact } from '../../shared/utils/date.helpers';
import { getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';
import { formatCurrency } from '../../shared/utils/currency.helpers';

interface PaymentCardProps {
  pago: PagoMensual;
  isSelected: boolean;
  onSelect: () => void;
  status: PaymentStatus;
}

const statusStyles: Record<PaymentStatus, { label: string; chip: string; stripe: string }> = {
  vencido: {
    label: 'Vencido',
    chip: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300',
    stripe: 'bg-rose-500',
  },
  parcial: {
    label: 'Parcial',
    chip: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
    stripe: 'bg-amber-400',
  },
  pagado: {
    label: 'Pagado',
    chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
    stripe: 'bg-emerald-500',
  },
};

export const PaymentCard = ({ pago, isSelected, onSelect, status }: PaymentCardProps) => {
  const titularDisplay = getTitularApellidoDisplay(pago.titularApellido, pago.titularNombre);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/5 dark:bg-[#1f1f24] ${
        isSelected ? 'ring-2 ring-[#1d8ca5]' : ''
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${statusStyles[status].stripe}`} />
      <div className="p-4 pl-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-500">{pago.periodo}</p>
            <h4 className="text-lg font-bold text-[#0f181a] dark:text-white leading-tight">{titularDisplay}</h4>
            {pago.titularDireccion ? (
              <p className="text-[11px] text-gray-400">{pago.titularDireccion}</p>
            ) : null}
          </div>
          <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${statusStyles[status].chip}`}>
            <span className="material-symbols-outlined text-[16px]">
              {status === 'pagado' ? 'check_circle' : status === 'parcial' ? 'timelapse' : 'warning'}
            </span>
            {statusStyles[status].label}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 border-t border-dashed border-gray-200 pt-3 text-sm dark:border-gray-700">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Generado</p>
            <p className="font-bold text-[#0f181a] dark:text-white">{formatCurrency(pago.montoGenerado)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Pagado</p>
            <p className="font-bold text-emerald-600 dark:text-emerald-300">{formatCurrency(pago.totalPagado)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Saldo</p>
            <p className={`font-extrabold ${status === 'pagado' ? 'text-gray-400' : 'text-rose-500'}`}>
              {formatCurrency(pago.saldoPendiente)}
            </p>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Vence {formatDateOnlyCompact(pago.fechaVencimiento)}
        </div>
      </div>
    </button>
  );
};
