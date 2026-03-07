import { Controller } from 'react-hook-form';
import type { Control, FieldError, FieldErrors, UseFormRegister } from 'react-hook-form';
import { MEDIOS_PAGO } from '../../pagos/constants/medios-pago.constants';
import { PriceInput } from '../../shared/ui';
import { GASTO_ESTADOS, GASTO_TIPOS, type GastoTipo } from '../types/gastos.types';
import type { RegistrarGastoFormData } from './RegistrarGastoModal';

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
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor={fieldIds.categoria} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
            Categoría <span className="text-red-500">*</span>
          </label>
          <select
            id={fieldIds.categoria}
            {...register('categoria')}
            disabled={isPending}
            className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
              errors.categoria ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
            }`}
          >
            <option value="">Seleccioná una categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.value} value={categoria.value}>
                {categoria.label}
              </option>
            ))}
          </select>
          {errors.categoria ? <p className="mt-1 text-xs text-red-600">{errors.categoria.message}</p> : null}
        </div>
        <div>
          <label htmlFor={fieldIds.medioPago} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
            Medio de pago <span className="text-red-500">*</span>
          </label>
          <select
            id={fieldIds.medioPago}
            {...register('medioPago')}
            disabled={isPending}
            className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
              errors.medioPago ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
            }`}
          >
            {Object.values(MEDIOS_PAGO).map((medio) => (
              <option key={medio} value={medio}>
                {medio}
              </option>
            ))}
          </select>
          {errors.medioPago ? <p className="mt-1 text-xs text-red-600">{errors.medioPago.message}</p> : null}
        </div>
      </div>

      <div>
        <label htmlFor={fieldIds.descripcion} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
          Descripción <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id={fieldIds.descripcion}
          {...register('descripcion')}
          disabled={isPending}
          placeholder="Ej: Ajuste de combustible, renovación de seguro, etc."
          className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
            errors.descripcion ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
          }`}
        />
        {errors.descripcion ? <p className="mt-1 text-xs text-red-600">{errors.descripcion.message}</p> : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor={fieldIds.monto} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
            Monto <span className="text-red-500">*</span>
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
                inputClassName={`w-full rounded-xl border pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
                  errors.monto ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
                }`}
              />
            )}
          />
          {errors.monto ? <p className="mt-1 text-xs text-red-600">{errors.monto.message}</p> : null}
        </div>

        {selectedTipo === GASTO_TIPOS.FIJO ? (
          <div>
            <label htmlFor={fieldIds.diaAplicacion} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
              Día de aplicación <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={31}
              id={fieldIds.diaAplicacion}
              {...register('diaDeAplicacion', { valueAsNumber: true })}
              disabled={isPending}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
                typedErrors.diaDeAplicacion ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">Usamos este día para programar el registro automático del gasto fijo.</p>
            {typedErrors.diaDeAplicacion ? <p className="mt-1 text-xs text-red-600">{typedErrors.diaDeAplicacion.message}</p> : null}
          </div>
        ) : (
          <div>
            <label htmlFor={fieldIds.fecha} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
              Fecha del gasto <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              id={fieldIds.fecha}
              {...register('fecha')}
              disabled={isPending}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
                typedErrors.fecha ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">Solo se permiten fechas dentro del mes filtrado.</p>
            {typedErrors.fecha ? <p className="mt-1 text-xs text-red-600">{typedErrors.fecha.message}</p> : null}
          </div>
        )}
      </div>

      {selectedTipo === GASTO_TIPOS.VARIABLE ? (
        <div>
          <label htmlFor={fieldIds.estadoPago} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
            Estado del pago
          </label>
          <select
            id={fieldIds.estadoPago}
            {...register('estadoPago')}
            disabled={isPending}
            className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
              typedErrors.estadoPago ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
            }`}
          >
            {Object.values(GASTO_ESTADOS).map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
          {typedErrors.estadoPago ? <p className="mt-1 text-xs text-red-600">{typedErrors.estadoPago.message}</p> : null}
        </div>
      ) : null}

      <div>
        <label htmlFor={fieldIds.observaciones} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
          Observaciones
        </label>
        <textarea
          rows={3}
          id={fieldIds.observaciones}
          {...register('observaciones')}
          disabled={isPending}
          placeholder="Notas internas, folio de factura, proveedor, etc."
          className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
            errors.observaciones ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
          }`}
        />
        {errors.observaciones ? <p className="mt-1 text-xs text-red-600">{errors.observaciones.message}</p> : null}
      </div>
    </>
  );
};
