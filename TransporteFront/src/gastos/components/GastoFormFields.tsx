import { Controller } from 'react-hook-form';
import type { Control, FieldError, FieldErrors, UseFormRegister } from 'react-hook-form';
import { MEDIOS_PAGO } from '../../pagos/constants/medios-pago.constants';
import { PriceInput } from '../../shared/ui';
import { GASTO_ESTADOS, GASTO_TIPOS, type GastoTipo } from '../types/gastos.types';
import type { RegistrarGastoFormData } from './RegistrarGastoModal';
import { getCategoriaConfig, normalizeCategoriaKey } from '../constants/categorias.config';

const GASTO_MEDIOS_PAGO = Object.values(MEDIOS_PAGO).filter((medio) => medio !== MEDIOS_PAGO.CHEQUE);

type GastoFieldIds = {
  categoria: string;
  medioPago: string;
  descripcion: string;
  monto: string;
  diaAplicacion: string;
  fecha: string;
  estadoPago: string;
  observaciones: string;
};

interface GastoFormFieldsProps {
  control: Control<RegistrarGastoFormData>;
  register: UseFormRegister<RegistrarGastoFormData>;
  errors: FieldErrors<RegistrarGastoFormData>;
  typedErrors: Partial<Record<'diaDeAplicacion' | 'fecha' | 'estadoPago', FieldError | undefined>>;
  fieldIds: GastoFieldIds;
  isPending: boolean;
  categorias: ReadonlyArray<{ value: string; label: string }>;
  selectedTipo: GastoTipo;
  minDate: string;
  maxDate: string;
}

export const GastoFormFields = ({
  control,
  register,
  errors,
  typedErrors,
  fieldIds,
  isPending,
  categorias,
  selectedTipo,
  minDate,
  maxDate,
}: GastoFormFieldsProps) => {
  return (
    <>
      <div>
        <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          Categoría <span className="text-rose-500">*</span>
        </p>
        <div className="flex flex-wrap gap-3">
          {categorias.map((categoria) => {
            const optionId = `${fieldIds.categoria}-${categoria.value}`;
            const visual = getCategoriaConfig(normalizeCategoriaKey(categoria.value));
            return (
              <label key={categoria.value} htmlFor={optionId} className="cursor-pointer">
                <input
                  type="radio"
                  id={optionId}
                  value={categoria.value}
                  className="peer sr-only"
                  {...register('categoria')}
                  disabled={isPending}
                />
                <div
                  className={`flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition focus-within:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 ${
                    errors.categoria ? 'border-rose-400 dark:border-rose-400' : ''
                  } peer-checked:border-transparent peer-checked:bg-gradient-to-r peer-checked:from-teal-500 peer-checked:to-emerald-400 peer-checked:text-white`}
                >
                  <span className="material-symbols-rounded text-base" aria-hidden>
                    {visual.icon}
                  </span>
                  <span className="max-w-[160px] truncate">{categoria.label}</span>
                </div>
              </label>
            );
          })}
        </div>
        {errors.categoria ? <p className="mt-2 text-xs text-rose-500">{errors.categoria.message}</p> : null}
      </div>

      <div>
        <label htmlFor={fieldIds.medioPago} className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
          Medio de pago <span className="text-rose-500">*</span>
        </label>
        <select
          id={fieldIds.medioPago}
          {...register('medioPago')}
          disabled={isPending}
          className={`w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-white/10 dark:bg-slate-900 dark:text-white ${
            errors.medioPago ? 'border-rose-400 dark:border-rose-400' : 'border-slate-200/80'
          }`}
        >
          {GASTO_MEDIOS_PAGO.map((medio) => (
            <option key={medio} value={medio}>
              {medio}
            </option>
          ))}
        </select>
        {errors.medioPago ? <p className="mt-1 text-xs text-rose-500">{errors.medioPago.message}</p> : null}
      </div>

      <div>
        <label htmlFor={fieldIds.descripcion} className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
          Descripción <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          id={fieldIds.descripcion}
          {...register('descripcion')}
          disabled={isPending}
          placeholder="Ej: Ajuste de combustible, renovación de seguro, etc."
          className={`w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-white/10 dark:bg-slate-900 dark:text-white ${
            errors.descripcion ? 'border-rose-400 dark:border-rose-400' : 'border-slate-200/80'
          }`}
        />
        {errors.descripcion ? <p className="mt-1 text-xs text-rose-500">{errors.descripcion.message}</p> : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor={fieldIds.monto} className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
            Monto <span className="text-rose-500">*</span>
          </label>
          <Controller
            control={control}
            name="monto"
            render={({ field }) => (
              <PriceInput
                id={fieldIds.monto}
                value={field.value ?? ''}
                onValueChange={(cleanValue: string, floatValue: number | undefined) => {
                  if (!cleanValue) {
                    field.onChange(undefined);
                    return;
                  }
                  field.onChange(floatValue ?? undefined);
                }}
                onBlur={field.onBlur}
                disabled={isPending}
                prefix="$"
                containerClassName="relative"
                inputClassName={`w-full rounded-2xl border bg-white/80 pr-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-white/10 dark:bg-slate-900 dark:text-white ${
                  errors.monto ? 'border-rose-400 dark:border-rose-400' : 'border-slate-200/80'
                }`}
              />
            )}
          />
          {errors.monto ? <p className="mt-1 text-xs text-rose-500">{errors.monto.message}</p> : null}
        </div>

        {selectedTipo === GASTO_TIPOS.FIJO ? (
          <div>
            <label htmlFor={fieldIds.diaAplicacion} className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
              Día de aplicación <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={31}
              id={fieldIds.diaAplicacion}
              {...register('diaDeAplicacion', { valueAsNumber: true })}
              disabled={isPending}
              className={`w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-white/10 dark:bg-slate-900 dark:text-white ${
                typedErrors.diaDeAplicacion ? 'border-rose-400 dark:border-rose-400' : 'border-slate-200/80'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">Usamos este día para programar el registro automático del gasto fijo.</p>
            {typedErrors.diaDeAplicacion ? <p className="mt-1 text-xs text-rose-500">{typedErrors.diaDeAplicacion.message}</p> : null}
          </div>
        ) : (
          <div>
            <label htmlFor={fieldIds.fecha} className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
              Fecha del gasto <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              id={fieldIds.fecha}
              {...register('fecha')}
              disabled={isPending}
              className={`w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-white/10 dark:bg-slate-900 dark:text-white ${
                typedErrors.fecha ? 'border-rose-400 dark:border-rose-400' : 'border-slate-200/80'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">Solo se permiten fechas dentro del mes filtrado.</p>
            {typedErrors.fecha ? <p className="mt-1 text-xs text-rose-500">{typedErrors.fecha.message}</p> : null}
          </div>
        )}
      </div>

      {selectedTipo === GASTO_TIPOS.VARIABLE ? (
        <div>
          <label htmlFor={fieldIds.estadoPago} className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
            Estado del pago
          </label>
          <select
            id={fieldIds.estadoPago}
            {...register('estadoPago')}
            disabled={isPending}
            className={`w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-white/10 dark:bg-slate-900 dark:text-white ${
              typedErrors.estadoPago ? 'border-rose-400 dark:border-rose-400' : 'border-slate-200/80'
            }`}
          >
            {Object.values(GASTO_ESTADOS).map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
          {typedErrors.estadoPago ? <p className="mt-1 text-xs text-rose-500">{typedErrors.estadoPago.message}</p> : null}
        </div>
      ) : null}

      <div>
        <label htmlFor={fieldIds.observaciones} className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
          Observaciones
        </label>
        <textarea
          rows={3}
          id={fieldIds.observaciones}
          {...register('observaciones')}
          disabled={isPending}
          placeholder="Notas internas, folio de factura, proveedor, etc."
          className={`w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-white/10 dark:bg-slate-900 dark:text-white ${
            errors.observaciones ? 'border-rose-400 dark:border-rose-400' : 'border-slate-200/80'
          }`}
        />
        {errors.observaciones ? <p className="mt-1 text-xs text-rose-500">{errors.observaciones.message}</p> : null}
      </div>
    </>
  );
};
