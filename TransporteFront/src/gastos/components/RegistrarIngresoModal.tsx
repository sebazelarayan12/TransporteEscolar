import { useEffect, useId } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { Control, FieldError, Resolver, SubmitHandler, UseFormRegister } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal, PriceInput, Spinner } from '../../shared/ui';
import { useToast } from '../../shared/hooks';
import { MEDIOS_PAGO } from '../../pagos/constants/medios-pago.constants';
import {
  INGRESO_CATEGORIAS,
  INGRESO_ESTADOS_COBRO,
  INGRESO_TIPOS,
  type ActualizarIngresoFijoRequest,
  type IngresoEstadoCobro,
  type IngresoItem,
  type IngresoTipo,
} from '../types/ingresos.types';
import { useActualizarIngresoFijo, useCrearIngresoFijo, useCrearIngresoVariable } from '../services/ingresos.queries';

interface RegistrarIngresoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mes: number;
  anio: number;
  modo?: 'create' | 'edit';
  initialData?: IngresoItem | null;
  templateId?: number | null;
  onSuccess?: () => void;
}

const registrarIngresoSchemaBase = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal(INGRESO_TIPOS.FIJO),
    categoria: z.string().min(1, { error: 'Elegí una categoría' }),
    descripcion: z.string().min(3, { error: 'Ingresá una descripción' }),
    monto: z.coerce
      .number({ error: 'Ingresá un monto válido' })
      .gt(0, { error: 'El monto debe ser mayor a 0' }),
    medioCobro: z.string().min(1, { error: 'Seleccioná un medio de cobro' }),
    observaciones: z
      .string()
      .max(300, { error: 'Máximo 300 caracteres' })
      .optional()
      .or(z.literal('')),
    diaDeAplicacion: z.coerce
      .number({ error: 'Indicá el día de aplicación' })
      .int({ error: 'Debe ser un número entero' })
      .min(1, { error: 'Debe estar entre 1 y 31' })
      .max(31, { error: 'Debe estar entre 1 y 31' }),
  }),
  z.object({
    tipo: z.literal(INGRESO_TIPOS.VARIABLE),
    categoria: z.string().min(1, { error: 'Elegí una categoría' }),
    descripcion: z.string().min(3, { error: 'Ingresá una descripción' }),
    monto: z.coerce
      .number({ error: 'Ingresá un monto válido' })
      .gt(0, { error: 'El monto debe ser mayor a 0' }),
    medioCobro: z.string().min(1, { error: 'Seleccioná un medio de cobro' }),
    observaciones: z
      .string()
      .max(300, { error: 'Máximo 300 caracteres' })
      .optional()
      .or(z.literal('')),
    fecha: z.string().min(1, { error: 'Elegí una fecha' }),
    estadoCobro: z.enum([
      INGRESO_ESTADOS_COBRO.PENDIENTE,
      INGRESO_ESTADOS_COBRO.COBRADO,
      INGRESO_ESTADOS_COBRO.PROGRAMADO,
    ]),
  }),
]);

type RegistrarIngresoFormData = z.infer<typeof registrarIngresoSchemaBase>;

type IngresoFieldIds = {
  categoria: string;
  medioCobro: string;
  descripcion: string;
  monto: string;
  diaAplicacion: string;
  fecha: string;
  estadoCobro: string;
  observaciones: string;
};

type IngresoCategoriaOption = { value: string; label: string };

const buildSchemaForPeriod = (mes: number, anio: number) => {
  return registrarIngresoSchemaBase.superRefine((data, ctx) => {
    if (data.tipo === INGRESO_TIPOS.VARIABLE) {
      const [year, month] = data.fecha.split('-').map(Number);
      if (year !== anio || month !== mes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha debe estar dentro del periodo seleccionado',
          path: ['fecha'],
        });
      }
    }
  });
};

const getDefaultDateForPeriod = (mes: number, anio: number) => {
  const periodStart = new Date(anio, mes - 1, 1);
  const periodEnd = new Date(anio, mes, 0);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (today.getTime() < periodStart.getTime()) {
    return periodStart.toISOString().split('T')[0];
  }

  if (today.getTime() > periodEnd.getTime()) {
    return periodEnd.toISOString().split('T')[0];
  }

  return today.toISOString().split('T')[0];
};

const getDefaultValues = (mes: number, anio: number) => {
  const defaultDate = getDefaultDateForPeriod(mes, anio);
  return {
    tipo: INGRESO_TIPOS.VARIABLE,
    categoria: '',
    descripcion: '',
    monto: 0,
    medioCobro: MEDIOS_PAGO.EFECTIVO,
    observaciones: '',
    fecha: defaultDate,
    estadoCobro: INGRESO_ESTADOS_COBRO.PENDIENTE as IngresoEstadoCobro,
    diaDeAplicacion: 1,
  } as RegistrarIngresoFormData;
};

const getPeriodBounds = (mes: number, anio: number) => {
  const firstDay = new Date(anio, mes - 1, 1);
  const lastDay = new Date(anio, mes, 0);
  return {
    min: firstDay.toISOString().split('T')[0],
    max: lastDay.toISOString().split('T')[0],
  };
};

const monthFormatter = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
});

export const RegistrarIngresoModal = ({
  isOpen,
  onClose,
  mes,
  anio,
  modo = 'create',
  initialData,
  templateId,
  onSuccess = () => {},
}: RegistrarIngresoModalProps) => {
  const fieldIdPrefix = useId();
  const fieldIds: IngresoFieldIds = {
    categoria: `${fieldIdPrefix}-categoria`,
    medioCobro: `${fieldIdPrefix}-medio-cobro`,
    descripcion: `${fieldIdPrefix}-descripcion`,
    monto: `${fieldIdPrefix}-monto`,
    diaAplicacion: `${fieldIdPrefix}-dia-aplicacion`,
    fecha: `${fieldIdPrefix}-fecha`,
    estadoCobro: `${fieldIdPrefix}-estado-cobro`,
    observaciones: `${fieldIdPrefix}-observaciones`,
  };
  const schema = buildSchemaForPeriod(mes, anio);
  const resolver = zodResolver(schema) as Resolver<RegistrarIngresoFormData>;
  const isEditMode = modo === 'edit';
  const form = useForm<RegistrarIngresoFormData>({
    resolver,
    defaultValues: getDefaultValues(mes, anio),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = form;
  const handleTipoChange = (tipo: IngresoTipo) => {
    setValue('tipo', tipo);
  };
  const typedErrors = errors as typeof errors &
    Partial<Record<'diaDeAplicacion' | 'fecha' | 'estadoCobro', FieldError | undefined>>;
  const watchedTipo = useWatch({ control, name: 'tipo' }) as IngresoTipo | undefined;
  const selectedTipo = watchedTipo ?? (isEditMode ? INGRESO_TIPOS.FIJO : INGRESO_TIPOS.VARIABLE);
  const { min, max } = getPeriodBounds(mes, anio);
  const { showSuccess, showError } = useToast();
  const crearIngresoFijo = useCrearIngresoFijo();
  const crearIngresoVariable = useCrearIngresoVariable();
  const actualizarIngresoFijo = useActualizarIngresoFijo();
  const isPending = isSubmitting || crearIngresoFijo.isPending || crearIngresoVariable.isPending || actualizarIngresoFijo.isPending;
  const periodLabel = monthFormatter.format(new Date(anio, mes - 1, 1));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (isEditMode && initialData) {
      const fallbackDate = getPeriodBounds(initialData.mes ?? mes, initialData.anio ?? anio).min;
      const diaAplicacion = new Date(initialData.fecha ?? fallbackDate).getUTCDate();
      reset({
        tipo: INGRESO_TIPOS.FIJO,
        categoria: initialData.categoria,
        descripcion: initialData.descripcion,
        monto: initialData.monto,
        medioCobro: initialData.medioCobro,
        observaciones: initialData.observaciones ?? '',
        diaDeAplicacion: diaAplicacion,
      });
      return;
    }

    reset(getDefaultValues(mes, anio));
  }, [anio, initialData, isEditMode, isOpen, mes, reset]);

  const closeModal = () => {
    if (isPending) {
      return;
    }
    reset(getDefaultValues(mes, anio));
    onClose();
  };

  const onSubmit: SubmitHandler<RegistrarIngresoFormData> = async (data) => {
    const observaciones = data.observaciones?.trim() ? data.observaciones.trim() : undefined;
    try {
      if (isEditMode) {
        const targetTemplateId = templateId ?? initialData?.templateId ?? null;
        if (!targetTemplateId) {
          showError('No encontramos la plantilla asociada al ingreso fijo.');
          return;
        }

        if (data.tipo !== INGRESO_TIPOS.FIJO) {
          showError('Solo podés editar plantillas de ingresos fijos. Guardá nuevamente.');
          return;
        }

        const payload: ActualizarIngresoFijoRequest = {
          mes,
          anio,
          categoria: data.categoria,
          descripcion: data.descripcion.trim(),
          monto: data.monto,
          diaDeAplicacion: data.diaDeAplicacion,
          medioCobro: data.medioCobro,
          observaciones,
          estaActivo: true,
        };

        await actualizarIngresoFijo.mutateAsync({
          templateId: targetTemplateId,
          data: payload,
        });
      } else if (data.tipo === INGRESO_TIPOS.FIJO) {
        await crearIngresoFijo.mutateAsync({
          mes,
          anio,
          categoria: data.categoria,
          descripcion: data.descripcion.trim(),
          monto: data.monto,
          diaDeAplicacion: data.diaDeAplicacion,
          medioCobro: data.medioCobro,
          observaciones,
        });
      } else {
        await crearIngresoVariable.mutateAsync({
          mes,
          anio,
          categoria: data.categoria,
          descripcion: data.descripcion.trim(),
          monto: data.monto,
          fecha: data.fecha,
          medioCobro: data.medioCobro,
          estadoCobro: data.estadoCobro,
          observaciones,
        });
      }

      showSuccess(isEditMode ? 'Ingreso fijo actualizado' : 'Ingreso registrado correctamente');
      onSuccess();
      reset(getDefaultValues(mes, anio));
      onClose();
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message)
          : 'No pudimos registrar el ingreso';
      showError(message);
    }
  };

  const categorias = selectedTipo === INGRESO_TIPOS.FIJO ? INGRESO_CATEGORIAS.FIJOS : INGRESO_CATEGORIAS.VARIABLES;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={isEditMode ? 'Editar ingreso fijo' : 'Registrar nuevo ingreso'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <IngresoModalHeader periodLabel={periodLabel} mes={mes} anio={anio} />

        <IngresoTipoSection isEditMode={isEditMode} selectedTipo={selectedTipo} onChangeTipo={handleTipoChange} />

        <IngresoCategoriaMedioFields
          fieldIds={fieldIds}
          register={register}
          isPending={isPending}
          categorias={categorias}
          categoriaError={errors.categoria}
          medioCobroError={errors.medioCobro}
        />

        <IngresoDescripcionField fieldId={fieldIds.descripcion} register={register} isPending={isPending} error={errors.descripcion} />

        <IngresoMontoTimingFields
          control={control}
          fieldIds={fieldIds}
          register={register}
          isPending={isPending}
          selectedTipo={selectedTipo}
          minDate={min}
          maxDate={max}
          montoError={errors.monto}
          diaDeAplicacionError={typedErrors.diaDeAplicacion}
          fechaError={typedErrors.fecha}
        />

        <IngresoEstadoCobroField
          show={selectedTipo === INGRESO_TIPOS.VARIABLE}
          fieldId={fieldIds.estadoCobro}
          register={register}
          isPending={isPending}
          error={typedErrors.estadoCobro}
        />

        <IngresoObservacionesField
          fieldId={fieldIds.observaciones}
          register={register}
          isPending={isPending}
          error={errors.observaciones}
        />

        <IngresoModalActions isPending={isPending} isEditMode={isEditMode} onCancel={closeModal} />
      </form>
    </Modal>
  );
};

interface IngresoModalHeaderProps {
  periodLabel: string;
  mes: number;
  anio: number;
}

const IngresoModalHeader = ({ periodLabel, mes, anio }: IngresoModalHeaderProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-200">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-teal-600">calendar_month</span>
        Periodo seleccionado: <span className="font-bold text-gray-900 dark:text-white">{periodLabel}</span>
      </div>
      <span className="text-xs uppercase tracking-widest text-teal-600">Mes {mes} / {anio}</span>
    </div>
  );
};

interface IngresoTipoSectionProps {
  isEditMode: boolean;
  selectedTipo: IngresoTipo;
  onChangeTipo: (tipo: IngresoTipo) => void;
}

const IngresoTipoSection = ({ isEditMode, selectedTipo, onChangeTipo }: IngresoTipoSectionProps) => {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">Tipo de ingreso</p>
      {isEditMode ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          <span className="material-symbols-outlined text-[20px]">info</span>
          Estás editando la plantilla del ingreso fijo seleccionado.
        </div>
      ) : (
        <div className="mt-3 inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-[#3f3f46] dark:bg-[#1f1f24]">
          {([INGRESO_TIPOS.VARIABLE, INGRESO_TIPOS.FIJO] as const).map((tipo) => {
            const isActive = selectedTipo === tipo;
            const icon = tipo === INGRESO_TIPOS.VARIABLE ? 'stacked_line_chart' : 'auto_mode';
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => {
                  onChangeTipo(tipo);
                }}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                {tipo}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface IngresoCategoriaMedioFieldsProps {
  fieldIds: Pick<IngresoFieldIds, 'categoria' | 'medioCobro'>;
  register: UseFormRegister<RegistrarIngresoFormData>;
  isPending: boolean;
  categorias: ReadonlyArray<IngresoCategoriaOption>;
  categoriaError?: FieldError;
  medioCobroError?: FieldError;
}

const IngresoCategoriaMedioFields = ({
  fieldIds,
  register,
  isPending,
  categorias,
  categoriaError,
  medioCobroError,
}: IngresoCategoriaMedioFieldsProps) => {
  return (
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
            categoriaError ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
          }`}
        >
          <option value="">Seleccioná una categoría</option>
          {categorias.map((categoria) => (
            <option key={categoria.value} value={categoria.value}>
              {categoria.label}
            </option>
          ))}
        </select>
        {categoriaError ? <p className="mt-1 text-xs text-red-600">{categoriaError.message}</p> : null}
      </div>
      <div>
        <label htmlFor={fieldIds.medioCobro} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
          Medio de cobro <span className="text-red-500">*</span>
        </label>
        <select
          id={fieldIds.medioCobro}
          {...register('medioCobro')}
          disabled={isPending}
          className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
            medioCobroError ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
          }`}
        >
          {Object.values(MEDIOS_PAGO).map((medio) => (
            <option key={medio} value={medio}>
              {medio}
            </option>
          ))}
        </select>
        {medioCobroError ? <p className="mt-1 text-xs text-red-600">{medioCobroError.message}</p> : null}
      </div>
    </div>
  );
};

interface IngresoDescripcionFieldProps {
  fieldId: string;
  register: UseFormRegister<RegistrarIngresoFormData>;
  isPending: boolean;
  error?: FieldError;
}

const IngresoDescripcionField = ({ fieldId, register, isPending, error }: IngresoDescripcionFieldProps) => {
  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
        Descripción <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        id={fieldId}
        {...register('descripcion')}
        disabled={isPending}
        placeholder="Ej: Convenio municipal, rifas solidarias, sponsoreo, etc."
        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
          error ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
        }`}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error.message}</p> : null}
    </div>
  );
};

interface IngresoMontoTimingFieldsProps {
  control: Control<RegistrarIngresoFormData>;
  fieldIds: Pick<IngresoFieldIds, 'monto' | 'diaAplicacion' | 'fecha'>;
  register: UseFormRegister<RegistrarIngresoFormData>;
  isPending: boolean;
  selectedTipo: IngresoTipo;
  minDate: string;
  maxDate: string;
  montoError?: FieldError;
  diaDeAplicacionError?: FieldError;
  fechaError?: FieldError;
}

const IngresoMontoTimingFields = ({
  control,
  fieldIds,
  register,
  isPending,
  selectedTipo,
  minDate,
  maxDate,
  montoError,
  diaDeAplicacionError,
  fechaError,
}: IngresoMontoTimingFieldsProps) => {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <label htmlFor={fieldIds.monto} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
          Importe <span className="text-red-500">*</span>
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
                montoError ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
              }`}
            />
          )}
        />
        {montoError ? <p className="mt-1 text-xs text-red-600">{montoError.message}</p> : null}
      </div>

      {selectedTipo === INGRESO_TIPOS.FIJO ? (
        <div>
          <label htmlFor={fieldIds.diaAplicacion} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
            Día de acreditación <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={31}
            id={fieldIds.diaAplicacion}
            {...register('diaDeAplicacion', { valueAsNumber: true })}
            disabled={isPending}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
              diaDeAplicacionError ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">Lo usamos para disparar la generación automática del ingreso fijo.</p>
          {diaDeAplicacionError ? <p className="mt-1 text-xs text-red-600">{diaDeAplicacionError.message}</p> : null}
        </div>
      ) : (
        <div>
          <label htmlFor={fieldIds.fecha} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
            Fecha esperada <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            min={minDate}
            max={maxDate}
            id={fieldIds.fecha}
            {...register('fecha')}
            disabled={isPending}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
              fechaError ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">Debe pertenecer al mes seleccionado.</p>
          {fechaError ? <p className="mt-1 text-xs text-red-600">{fechaError.message}</p> : null}
        </div>
      )}
    </div>
  );
};

interface IngresoEstadoCobroFieldProps {
  show: boolean;
  fieldId: string;
  register: UseFormRegister<RegistrarIngresoFormData>;
  isPending: boolean;
  error?: FieldError;
}

const IngresoEstadoCobroField = ({ show, fieldId, register, isPending, error }: IngresoEstadoCobroFieldProps) => {
  if (!show) {
    return null;
  }

  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
        Estado de cobro
      </label>
      <select
        id={fieldId}
        {...register('estadoCobro')}
        disabled={isPending}
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
          error ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
        }`}
      >
        {Object.values(INGRESO_ESTADOS_COBRO).map((estado) => (
          <option key={estado} value={estado}>
            {estado}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-red-600">{error.message}</p> : null}
    </div>
  );
};

interface IngresoObservacionesFieldProps {
  fieldId: string;
  register: UseFormRegister<RegistrarIngresoFormData>;
  isPending: boolean;
  error?: FieldError;
}

const IngresoObservacionesField = ({ fieldId, register, isPending, error }: IngresoObservacionesFieldProps) => {
  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">Observaciones</label>
      <textarea
        rows={3}
        id={fieldId}
        {...register('observaciones')}
        disabled={isPending}
        placeholder="Notas internas o acuerdos asociados al ingreso."
        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
          error ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
        }`}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error.message}</p> : null}
    </div>
  );
};

interface IngresoModalActionsProps {
  isPending: boolean;
  isEditMode: boolean;
  onCancel: () => void;
}

const IngresoModalActions = ({ isPending, isEditMode, onCancel }: IngresoModalActionsProps) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
        Cancelar
      </Button>
      <Button type="submit" variant="brand" disabled={isPending} className="inline-flex items-center gap-2">
        {isPending ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-[18px]">task_alt</span>}
        {isEditMode ? 'Guardar cambios' : 'Guardar ingreso'}
      </Button>
    </div>
  );
};
