import { useState } from 'react';
import { useForm, type FieldError, type Resolver, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Button, Spinner } from '../../shared/ui';
import { useToast } from '../../shared/hooks';
import { MEDIOS_PAGO } from '../../pagos/constants/medios-pago.constants';
import {
  INGRESO_CATEGORIAS,
  INGRESO_ESTADOS_COBRO,
  INGRESO_TIPOS,
  type IngresoEstadoCobro,
  type IngresoTipo,
} from '../types/ingresos.types';
import { useCrearIngresoFijo, useCrearIngresoVariable } from '../services/ingresos.queries';

interface RegistrarIngresoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mes: number;
  anio: number;
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

const getDefaultValues = (mes: number, anio: number) => {
  const firstDay = new Date(anio, mes - 1, 1);
  const defaultDate = firstDay.toISOString().split('T')[0];
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

export const RegistrarIngresoModal = ({ isOpen, onClose, mes, anio }: RegistrarIngresoModalProps) => {
  const schema = buildSchemaForPeriod(mes, anio);
  const resolver = zodResolver(schema) as Resolver<RegistrarIngresoFormData>;
  const form = useForm<RegistrarIngresoFormData>({
    resolver,
    defaultValues: getDefaultValues(mes, anio),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;
  const typedErrors = errors as typeof errors &
    Partial<Record<'diaDeAplicacion' | 'fecha' | 'estadoCobro', FieldError | undefined>>;
  const [selectedTipo, setSelectedTipo] = useState<IngresoTipo>(INGRESO_TIPOS.VARIABLE);
  const { min, max } = getPeriodBounds(mes, anio);
  const { showSuccess, showError } = useToast();
  const crearIngresoFijo = useCrearIngresoFijo();
  const crearIngresoVariable = useCrearIngresoVariable();
  const isPending = isSubmitting || crearIngresoFijo.isPending || crearIngresoVariable.isPending;
  const periodLabel = monthFormatter.format(new Date(anio, mes - 1, 1));

  const closeModal = () => {
    if (isPending) {
      return;
    }
    reset(getDefaultValues(mes, anio));
    setSelectedTipo(INGRESO_TIPOS.VARIABLE);
    onClose();
  };

  const onSubmit: SubmitHandler<RegistrarIngresoFormData> = async (data) => {
    try {
      if (data.tipo === INGRESO_TIPOS.FIJO) {
        await crearIngresoFijo.mutateAsync({
          mes,
          anio,
          categoria: data.categoria,
          descripcion: data.descripcion.trim(),
          monto: data.monto,
          diaDeAplicacion: data.diaDeAplicacion,
          medioCobro: data.medioCobro,
          observaciones: data.observaciones?.trim() ? data.observaciones.trim() : undefined,
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
          observaciones: data.observaciones?.trim() ? data.observaciones.trim() : undefined,
        });
      }

      showSuccess('Ingreso registrado correctamente');
      reset(getDefaultValues(mes, anio));
      setSelectedTipo(INGRESO_TIPOS.VARIABLE);
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
    <Modal isOpen={isOpen} onClose={closeModal} title="Registrar nuevo ingreso" maxWidth="2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-teal-600">calendar_month</span>
            Periodo seleccionado: <span className="font-bold text-gray-900 dark:text-white">{periodLabel}</span>
          </div>
          <span className="text-xs uppercase tracking-widest text-teal-600">Mes {mes} / {anio}</span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">Tipo de ingreso</p>
          <div className="mt-3 inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-[#3f3f46] dark:bg-[#1f1f24]">
            {([INGRESO_TIPOS.VARIABLE, INGRESO_TIPOS.FIJO] as const).map((tipo) => {
              const isActive = selectedTipo === tipo;
              const icon = tipo === INGRESO_TIPOS.VARIABLE ? 'stacked_line_chart' : 'auto_mode';
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => {
                    setSelectedTipo(tipo);
                    form.setValue('tipo', tipo);
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
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
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
            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
              Medio de cobro <span className="text-red-500">*</span>
            </label>
            <select
              {...register('medioCobro')}
              disabled={isPending}
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
                errors.medioCobro ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
              }`}
            >
              {Object.values(MEDIOS_PAGO).map((medio) => (
                <option key={medio} value={medio}>
                  {medio}
                </option>
              ))}
            </select>
            {errors.medioCobro ? <p className="mt-1 text-xs text-red-600">{errors.medioCobro.message}</p> : null}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
            Descripción <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('descripcion')}
            disabled={isPending}
            placeholder="Ej: Convenio municipal, rifas solidarias, sponsoreo, etc."
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
              errors.descripcion ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.descripcion ? <p className="mt-1 text-xs text-red-600">{errors.descripcion.message}</p> : null}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
              Importe <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('monto', { valueAsNumber: true })}
                disabled={isPending}
                className={`w-full rounded-xl border pl-8 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
                  errors.monto ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.monto ? <p className="mt-1 text-xs text-red-600">{errors.monto.message}</p> : null}
          </div>

          {selectedTipo === INGRESO_TIPOS.FIJO ? (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                Día de acreditación <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={31}
                {...register('diaDeAplicacion', { valueAsNumber: true })}
                disabled={isPending}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
                  typedErrors.diaDeAplicacion ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">Lo usamos para disparar la generación automática del ingreso fijo.</p>
              {typedErrors.diaDeAplicacion ? (
                <p className="mt-1 text-xs text-red-600">{typedErrors.diaDeAplicacion.message}</p>
              ) : null}
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                Fecha esperada <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={min}
                max={max}
                {...register('fecha')}
                disabled={isPending}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
                  typedErrors.fecha ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">Debe pertenecer al mes seleccionado.</p>
              {typedErrors.fecha ? <p className="mt-1 text-xs text-red-600">{typedErrors.fecha.message}</p> : null}
            </div>
          )}
        </div>

        {selectedTipo === INGRESO_TIPOS.VARIABLE ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
              Estado de cobro
            </label>
            <select
              {...register('estadoCobro')}
              disabled={isPending}
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
                typedErrors.estadoCobro ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
              }`}
            >
              {Object.values(INGRESO_ESTADOS_COBRO).map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
            {typedErrors.estadoCobro ? (
              <p className="mt-1 text-xs text-red-600">{typedErrors.estadoCobro.message}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">Observaciones</label>
          <textarea
            rows={3}
            {...register('observaciones')}
            disabled={isPending}
            placeholder="Notas internas o acuerdos asociados al ingreso."
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
              errors.observaciones ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.observaciones ? <p className="mt-1 text-xs text-red-600">{errors.observaciones.message}</p> : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={closeModal} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="brand" disabled={isPending} className="inline-flex items-center gap-2">
            {isPending ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-[18px]">task_alt</span>}
            Guardar ingreso
          </Button>
        </div>
      </form>
    </Modal>
  );
};
