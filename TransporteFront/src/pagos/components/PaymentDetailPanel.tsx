import { PaymentHistory } from './PaymentHistory';
import { PaymentForm } from './PaymentForm';
import type { PagoMensual, RegistrarPagoRequest } from '../types/pago.types';

interface PaymentDetailPanelProps {
  pago: PagoMensual | null;
  onSubmitPayment: (data: RegistrarPagoRequest) => void;
  isSubmitting: boolean;
}

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
});

export const PaymentDetailPanel = ({ pago, onSubmitPayment, isSubmitting }: PaymentDetailPanelProps) => {
  if (!pago) {
    return (
      <div className="space-y-3 text-center text-sm text-gray-500">
        <span className="material-symbols-outlined text-4xl text-gray-300">credit_card</span>
        <p>Selecciona una cuenta en la lista para ver el detalle.</p>
      </div>
    );
  }

  const titularNombreCompleto = [pago.titularApellido, pago.titularNombre].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#1d8ca5]">Detalle de pago</p>
          <h2 className="text-2xl font-bold text-[#0f181a] dark:text-white leading-tight">{pago.titularApellido}</h2>
          {pago.titularNombre ? (
            <p className="text-sm text-gray-500">{pago.titularNombre}</p>
          ) : null}
          {pago.titularDireccion ? (
            <p className="text-xs text-gray-400">{pago.titularDireccion}</p>
          ) : null}
          <p className="text-sm text-gray-500">
            {pago.periodo} • Saldo pendiente <span className="font-bold text-rose-500">{currencyFormatter.format(pago.saldoPendiente)}</span>
          </p>
        </div>
        <button className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300">
          <span className="material-symbols-outlined text-[20px]">more_horiz</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[#f6f8f8] p-4 text-sm dark:bg-white/5">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Generado</p>
          <p className="text-lg font-bold text-[#0f181a] dark:text-white">{currencyFormatter.format(pago.montoGenerado)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Pagado</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-300">{currencyFormatter.format(pago.totalPagado)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Saldo</p>
          <p className={`text-lg font-bold ${pago.saldoPendiente === 0 ? 'text-gray-400' : 'text-rose-500'}`}>
            {currencyFormatter.format(pago.saldoPendiente)}
          </p>
        </div>
      </div>

      {/* History */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0f181a] dark:text-white">
          <span className="material-symbols-outlined text-[18px] text-gray-400">history</span>
          Historial de movimientos
        </h3>
        <PaymentHistory
          movimientos={pago.movimientos}
          pagoId={pago.id}
          titularLabel={titularNombreCompleto}
          periodo={pago.periodo}
        />
      </div>

      {/* Form */}
      <PaymentForm onSubmit={onSubmitPayment} isSubmitting={isSubmitting} defaultAmount={pago.saldoPendiente} />
    </div>
  );
};
