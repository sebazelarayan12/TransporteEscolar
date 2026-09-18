import { Controller } from 'react-hook-form';
import type { Control, FieldError, FieldErrors, UseFormRegister } from 'react-hook-form';
import { MEDIOS_PAGO } from '../../pagos/constants/medios-pago.constants';
import { PriceInput } from '../../shared/ui/PriceInput';
import { GASTO_ESTADOS, GASTO_TIPOS, type GastoTipo } from '../types/gastos.types';
import type { RegistrarGastoFormData } from './RegistrarGastoModal';
import { getCategoriaConfig, normalizeCategoriaKey } from '../constants/categorias.config';

const GASTO_MEDIOS_PAGO = Object.values(MEDIOS_PAGO);

const FIELD_BASE_CLASS =
  'w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-white/10 dark:bg-slate-900 dark:text-white';
const LABEL_CLASS = 'mb-2 block text-sm font-semibold text-slate-900 dark:text-white';

const fieldClass = (hasError: boolean) =>
  `${FIELD_BASE_CLASS} ${hasError ? 'border-rose-400 dark:border-rose-400' : 'border-slate-200/80'}`;

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

type TypedErrors = Partial<Record<'diaDeAplicacion' | 'fecha' | 'estadoPago', FieldError | undefined>>;

interface GastoFormFieldsProps {
  control: Control<RegistrarGastoFormData>;
  register: UseFormRegister<RegistrarGastoFormData>;
  errors: FieldErrors<RegistrarGastoFormData>;
  typedErrors: TypedErrors;
  fieldIds: GastoFieldIds;
  isPending: boolean;
  categorias: ReadonlyArray<{ value: string; label: string }>;
  selectedTipo: GastoTipo;
  minDate: string;
  maxDate: string;
}

const RequiredMark = () => <span className="text-rose-500">*</span>;

const ErrorMessage = ({ error }: { error?: FieldError }) =>
  error ? <p className="mt-1 text-xs text-rose-500">{error.message}</p> : null;

type SectionProps = Pick<GastoFormFieldsProps, 'register' | 'errors' | 'fieldIds' | 'isPending'>;

const CategoriaField = ({
  register,
  errors,
  fieldIds,
  isPending,
  categorias,
}: SectionProps & Pick<GastoFormFieldsProps, 'categorias'>) => (
  <div>
    <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
      Categoría <RequiredMark />
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
);

const MedioPagoField = ({ register, errors, fieldIds, isPending }: SectionProps) => (
  <div>
    <label htmlFor={fieldIds.medioPago} className={LABEL_CLASS}>
      Medio de pago <RequiredMark />
    </label>
    <select
      id={fieldIds.medioPago}
      {...register('medioPago')}
      disabled={isPending}
      className={fieldClass(Boolean(errors.medioPago))}
    >
      {GASTO_MEDIOS_PAGO.map((medio) => (
        <option key={medio} value={medio}>
          {medio}
        </option>
      ))}
    </select>
    <ErrorMessage error={errors.medioPago} />
  </div>
);

const DescripcionField = ({ register, errors, fieldIds, isPending }: SectionProps) => (
  <div>
    <label htmlFor={fieldIds.descripcion} className={LABEL_CLASS}>
      Descripción <RequiredMark />
    </label>
    <input
      type="text"
      id={fieldIds.descripcion}
      {...register('descripcion')}
      disabled={isPending}
      placeholder="Ej: Ajuste de combustible, renovación de seguro, etc."
      className={fieldClass(Boolean(errors.descripcion))}
    />
    <ErrorMessage error={errors.descripcion} />
  </div>
);

const MontoField = ({ control, errors, fieldIds, isPending }: SectionProps & Pick<GastoFormFieldsProps, 'control'>) => (
  <div>
    <label htmlFor={fieldIds.monto} className={LABEL_CLASS}>
      Monto <RequiredMark />
    </label>
    <Controller
      control={control}
      name="monto"
      render={({ field }) => (
        <PriceInput
          id={fieldIds.monto}
          value={field.value ?? ''}
          onValueChange={(cleanValue: string, floatValue: number | undefined) => {
            field.onChange(cleanValue ? floatValue : undefined);
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
    <ErrorMessage error={errors.monto} />
  </div>
);

type TypedSectionProps = Pick<GastoFormFieldsProps, 'register' | 'fieldIds' | 'isPending' | 'typedErrors'>;

const DiaAplicacionField = ({ register, fieldIds, isPending, typedErrors }: TypedSectionProps) => (
  <div>
    <label htmlFor={fieldIds.diaAplicacion} className={LABEL_CLASS}>
      Día de aplicación <RequiredMark />
    </label>
    <input
      type="number"
      min={1}
      max={31}
      id={fieldIds.diaAplicacion}
      {...register('diaDeAplicacion', { valueAsNumber: true })}
      disabled={isPending}
      className={fieldClass(Boolean(typedErrors.diaDeAplicacion))}
    />
    <p className="mt-1 text-xs text-gray-500">Usamos este día para programar el registro automático del gasto fijo.</p>
    <ErrorMessage error={typedErrors.diaDeAplicacion} />
  </div>
);

const FechaField = ({
  register,
  fieldIds,
  isPending,
  typedErrors,
  minDate,
  maxDate,
}: TypedSectionProps & Pick<GastoFormFieldsProps, 'minDate' | 'maxDate'>) => (
  <div>
    <label htmlFor={fieldIds.fecha} className={LABEL_CLASS}>
      Fecha del gasto <RequiredMark />
    </label>
    <input
      type="date"
      min={minDate}
      max={maxDate}
      id={fieldIds.fecha}
      {...register('fecha')}
      disabled={isPending}
      className={fieldClass(Boolean(typedErrors.fecha))}
    />
    <p className="mt-1 text-xs text-gray-500">Solo se permiten fechas dentro del mes filtrado.</p>
    <ErrorMessage error={typedErrors.fecha} />
  </div>
);

const EstadoPagoField = ({ register, fieldIds, isPending, typedErrors }: TypedSectionProps) => (
  <div>
    <label htmlFor={fieldIds.estadoPago} className={LABEL_CLASS}>
      Estado del pago
    </label>
    <select
      id={fieldIds.estadoPago}
      {...register('estadoPago')}
      disabled={isPending}
      className={fieldClass(Boolean(typedErrors.estadoPago))}
    >
      {Object.values(GASTO_ESTADOS).map((estado) => (
        <option key={estado} value={estado}>
          {estado}
        </option>
      ))}
    </select>
    <ErrorMessage error={typedErrors.estadoPago} />
  </div>
);

const ObservacionesField = ({ register, errors, fieldIds, isPending }: SectionProps) => (
  <div>
    <label htmlFor={fieldIds.observaciones} className={LABEL_CLASS}>
      Observaciones
    </label>
    <textarea
      rows={3}
      id={fieldIds.observaciones}
      {...register('observaciones')}
      disabled={isPending}
      placeholder="Notas internas, folio de factura, proveedor, etc."
      className={fieldClass(Boolean(errors.observaciones))}
    />
    <ErrorMessage error={errors.observaciones} />
  </div>
);

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
  const base = { register, errors, fieldIds, isPending };
  const typed = { register, fieldIds, isPending, typedErrors };
  const isFijo = selectedTipo === GASTO_TIPOS.FIJO;

  return (
    <>
      <CategoriaField {...base} categorias={categorias} />
      <MedioPagoField {...base} />
      <DescripcionField {...base} />

      <div className="grid gap-5 md:grid-cols-2">
        <MontoField {...base} control={control} />
        {isFijo ? (
          <DiaAplicacionField {...typed} />
        ) : (
          <FechaField {...typed} minDate={minDate} maxDate={maxDate} />
        )}
      </div>

      {selectedTipo === GASTO_TIPOS.VARIABLE ? <EstadoPagoField {...typed} /> : null}

      <ObservacionesField {...base} />
    </>
  );
};
