/**
 * FormularioRegistroPago component
 * Form for entering payment amount, method, and observations
 */

import type { FormEvent } from 'react';
import { Button, PriceInput } from '../../../shared/ui';
import { MEDIOS_PAGO, type MedioPago } from '../../constants/medios-pago.constants';

interface FormularioRegistroPagoProps {
  monto: string;
  onMontoChange: (value: string) => void;
  medioPago: MedioPago;
  onMedioPagoChange: (value: MedioPago) => void;
  observaciones: string;
  onObservacionesChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  canSubmit: boolean;
  isPending: boolean;
  disabled: boolean;
}

export const FormularioRegistroPago = ({
  monto,
  onMontoChange,
  medioPago,
  onMedioPagoChange,
  observaciones,
  onObservacionesChange,
  onSubmit,
  onCancel,
  canSubmit,
  isPending,
  disabled,
}: FormularioRegistroPagoProps) => {
  const montoNumber = parseFloat(monto);
  const isMontoValid = monto.trim() !== '' && Number.isFinite(montoNumber) && montoNumber > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-disabled={disabled}>
      <div>
        <label htmlFor="monto" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Monto a registrar <span className="text-red-500">*</span>
        </label>
        <PriceInput
          id="monto"
          value={monto}
          onValueChange={(cleanValue: string) => onMontoChange(cleanValue)}
          disabled={disabled || isPending}
          prefix="$"
          placeholder="0,00"
          inputClassName="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] disabled:bg-gray-100 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white"
        />
        {!isMontoValid && monto.trim() !== '' && (
          <p className="mt-1 text-xs text-red-500">Ingresá un monto válido mayor a cero.</p>
        )}
      </div>

      <div>
        <label htmlFor="medioPago" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Medio de pago
        </label>
        <select
          id="medioPago"
          value={medioPago}
          onChange={(event) => onMedioPagoChange(event.target.value as MedioPago)}
          className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] disabled:bg-gray-100 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white"
          disabled={disabled || isPending}
        >
          {Object.values(MEDIOS_PAGO).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="observaciones" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Observaciones (opcional)
        </label>
        <textarea
          id="observaciones"
          rows={3}
          value={observaciones}
          onChange={(event) => onObservacionesChange(event.target.value)}
          className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] disabled:bg-gray-100 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white"
          placeholder="Notas internas, referencia de transferencia, etc."
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!canSubmit}
          variant="brand"
          className="w-full rounded-full sm:w-auto"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[20px] text-white">progress_activity</span>
              Registrando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[20px]">task_alt</span>
              Registrar pago
            </span>
          )}
        </Button>
      </div>
    </form>
  );
};
