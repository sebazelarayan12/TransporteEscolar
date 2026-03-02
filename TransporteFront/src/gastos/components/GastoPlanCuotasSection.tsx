import { useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { GASTO_TIPOS, type GastoTipo } from '../types/gastos.types';
import type { RegistrarGastoFormData } from './RegistrarGastoModal';
import { calculatePlanCuotasMontos } from '../helpers/plan-cuotas.helpers';
import { formatCurrency } from '../../shared/utils/currency.helpers';

interface GastoPlanCuotasSectionProps {
  control: Control<RegistrarGastoFormData>;
  register: UseFormRegister<RegistrarGastoFormData>;
  errors: FieldErrors<RegistrarGastoFormData>;
  isPending: boolean;
  minDate: string;
  selectedTipo: GastoTipo;
}

export const GastoPlanCuotasSection = ({
  control,
  register,
  errors,
  isPending,
  minDate,
  selectedTipo,
}: GastoPlanCuotasSectionProps) => {
  const planCuotas = useWatch({ control, name: 'planCuotas' }) ?? { habilitado: false, cantidadCuotas: 2 };
  const monto = useWatch({ control, name: 'monto' }) ?? 0;

  if (selectedTipo !== GASTO_TIPOS.FIJO) {
    return null;
  }
  const isPlanEnabled = planCuotas.habilitado ?? false;
  const cantidadCuotas = planCuotas.cantidadCuotas ?? 2;
  const previewMontos = isPlanEnabled && monto > 0 && cantidadCuotas > 0 ? calculatePlanCuotasMontos(monto, cantidadCuotas) : [];
  const regularCuota = previewMontos[0];
  const ultimaCuota = previewMontos[previewMontos.length - 1];
  const regularRangeLabel = cantidadCuotas > 1 ? `Cuotas 1 a ${Math.max(1, cantidadCuotas - 1)}` : 'Cuota fija';

  const planErrors = (errors.planCuotas ?? {}) as FieldErrors<RegistrarGastoFormData['planCuotas']>;

  return (
    <section className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/80 px-4 py-5 dark:border-cyan-500/40 dark:bg-cyan-500/5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">Plan de cuotas</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dividí este gasto en cuotas programadas</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Calculamos el monto de cada cuota y generamos los próximos registros automáticamente.
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            {...register('planCuotas.habilitado')}
            disabled={isPending}
          />
          <div className="peer h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-teal-600 peer-focus:outline-none" />
          <span className="ml-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
            {isPlanEnabled ? 'Plan activo' : 'Activar plan'}
          </span>
        </label>
      </header>

      {isPlanEnabled ? (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white" htmlFor="plan-fecha-primera-cuota">
                Fecha de la primera cuota <span className="text-red-500">*</span>
              </label>
              <input
                id="plan-fecha-primera-cuota"
                type="date"
                min={minDate}
                {...register('planCuotas.fechaPrimeraCuota')}
                disabled={isPending}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
                  planErrors.fechaPrimeraCuota ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
                }`}
              />
              {planErrors.fechaPrimeraCuota ? (
                <p className="mt-1 text-xs text-red-600">{planErrors.fechaPrimeraCuota.message as string}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white" htmlFor="plan-cantidad-cuotas">
                Cantidad de cuotas <span className="text-red-500">*</span>
              </label>
              <input
                id="plan-cantidad-cuotas"
                type="number"
                min={2}
                max={36}
                step={1}
                {...register('planCuotas.cantidadCuotas', { valueAsNumber: true })}
                disabled={isPending}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
                  planErrors.cantidadCuotas ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">Máximo 36 cuotas.</p>
              {planErrors.cantidadCuotas ? (
                <p className="mt-1 text-xs text-red-600">{planErrors.cantidadCuotas.message as string}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl bg-white/70 p-4 shadow-sm dark:bg-black/20">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">Monto por cuota estimado</p>
            {regularCuota ? (
              <div className="mt-2 flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-3xl font-bold text-[#0b2e33] dark:text-white">{formatCurrency(regularCuota)}</p>
                  <p className="text-xs text-gray-500">{regularRangeLabel}</p>
                </div>
                {ultimaCuota && ultimaCuota !== regularCuota ? (
                  <div>
                    <p className="text-3xl font-bold text-[#0b2e33] dark:text-white">{formatCurrency(ultimaCuota)}</p>
                    <p className="text-xs text-gray-500">Última cuota ajustada</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-600">Completá el monto total y la cantidad para ver el detalle.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Activá el plan si necesitás financiar un gasto en varios meses. Calcularemos los montos automáticamente.
        </p>
      )}
    </section>
  );
};
