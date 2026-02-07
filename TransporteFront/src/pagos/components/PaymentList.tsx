import { PaymentCard } from './PaymentCard';
import type { PagoMensual, PaymentStatus } from '../types/pago.types';

interface PeriodGroup {
  id: string;
  title: string;
  badge: string;
  muted: boolean;
  pagos: PagoMensual[];
}

interface PaymentListProps {
  groups: PeriodGroup[];
  selectedInvoiceId: number | null;
  onSelectInvoice: (id: number) => void;
  getPaymentStatus: (pago: PagoMensual) => PaymentStatus;
}

export const PaymentList = ({ groups, selectedInvoiceId, onSelectInvoice, getPaymentStatus }: PaymentListProps) => {
  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-[#1f1f24]">
        No hay movimientos para este filtro.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id} className={`${group.muted ? 'opacity-70 grayscale-[40%]' : ''}`}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#0f181a] dark:text-white">{group.title}</h3>
              <p className="text-xs uppercase tracking-wide text-gray-500">{group.badge}</p>
            </div>
            <span className="text-xs font-semibold text-gray-400">{group.pagos.length} cuentas</span>
          </div>
          <div className="space-y-4">
            {group.pagos.map((pago) => (
              <PaymentCard
                key={pago.id}
                pago={pago}
                isSelected={selectedInvoiceId === pago.id}
                onSelect={() => onSelectInvoice(pago.id)}
                status={getPaymentStatus(pago)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
