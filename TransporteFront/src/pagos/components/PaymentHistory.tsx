import type { PagoMovimiento } from '../types/pago.types';

interface PaymentHistoryProps {
  movimientos: PagoMovimiento[];
}

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
});

export const PaymentHistory = ({ movimientos }: PaymentHistoryProps) => {
  if (movimientos.length === 0) {
    return <p className="text-center text-sm text-gray-500">No hay movimientos registrados</p>;
  }

  return (
    <div className="space-y-5">
      {movimientos.map((movimiento, index) => (
        <div key={movimiento.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-50 text-emerald-600">
              <span className="material-symbols-outlined text-[14px]">payments</span>
            </div>
            {index < movimientos.length - 1 && <div className="mt-1 h-full w-px bg-gray-200 dark:bg-gray-700" />}
          </div>
          <div className="flex-1 rounded-xl border border-gray-100 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between text-gray-500">
              <span className="font-bold text-[#0f181a] dark:text-white">Pago registrado</span>
              <span className="text-xs">
                {new Date(movimiento.fechaPago).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-gray-500">{movimiento.medioPago}</span>
              <span className="text-sm font-bold text-emerald-600">+{currencyFormatter.format(movimiento.monto)}</span>
            </div>
            {movimiento.observaciones && <p className="mt-2 text-xs text-gray-500">{movimiento.observaciones}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};
