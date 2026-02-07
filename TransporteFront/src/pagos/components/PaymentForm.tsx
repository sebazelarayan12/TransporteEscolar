import { useState } from 'react';
import { Button } from '../../shared/ui';
import type { RegistrarPagoRequest } from '../types/pago.types';

interface PaymentFormProps {
  onSubmit: (data: RegistrarPagoRequest) => void;
  isSubmitting: boolean;
  defaultAmount?: number;
}

export const PaymentForm = ({ onSubmit, isSubmitting, defaultAmount = 0 }: PaymentFormProps) => {
  const [formData, setFormData] = useState({
    monto: '',
    fechaPago: new Date().toISOString().split('T')[0],
    medioPago: 'Efectivo',
    observaciones: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      monto: parseFloat(formData.monto),
      fechaPago: formData.fechaPago,
      medioPago: formData.medioPago,
      observaciones: formData.observaciones || undefined,
    });
    // Reset form
    setFormData({
      monto: '',
      fechaPago: new Date().toISOString().split('T')[0],
      medioPago: 'Efectivo',
      observaciones: '',
    });
  };

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f9fafb] p-4 dark:border-white/10 dark:bg-white/5">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1d8ca5]">
        <span className="material-symbols-outlined text-[18px]">add_card</span>
        Registrar nuevo movimiento
      </h4>
      <form className="space-y-3 text-sm" onSubmit={handleSubmit}>
        <div>
          <label className="text-xs font-semibold text-gray-500">Monto</label>
          <div className="mt-1 flex rounded-lg border border-gray-200 bg-white shadow-sm focus-within:border-[#1d8ca5]">
            <span className="px-3 py-2 text-gray-400">$</span>
            <input
              type="number"
              step="0.01"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              placeholder={defaultAmount.toString()}
              required
              className="w-full rounded-r-lg border-0 px-3 py-2 text-[#0f181a] focus:outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500">Fecha</label>
            <input
              type="date"
              value={formData.fechaPago}
              onChange={(e) => setFormData({ ...formData, fechaPago: e.target.value })}
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-[#0f181a] focus:border-[#1d8ca5] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Medio</label>
            <select
              value={formData.medioPago}
              onChange={(e) => setFormData({ ...formData, medioPago: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[#0f181a] focus:border-[#1d8ca5] focus:outline-none"
            >
              <option>Efectivo</option>
              <option>Transferencia</option>
              <option>Cheque</option>
              <option>Tarjeta</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500">Observaciones</label>
          <textarea
            rows={3}
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-[#0f181a] focus:border-[#1d8ca5] focus:outline-none"
            placeholder="Notas internas..."
          />
        </div>
        <Button
          type="submit"
          variant="ghost"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1d8ca5] px-4 py-2 text-white hover:bg-[#187286] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              Registrando...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">payments</span>
              Registrar pago
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
