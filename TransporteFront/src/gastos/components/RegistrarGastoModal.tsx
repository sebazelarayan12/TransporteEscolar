import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Button, Spinner } from '../../shared/ui';
import { useToast } from '../../shared/hooks';
import { useCrearGastoFijo, useCrearGastoVariable } from '../services/gastos.queries';
import { GASTO_CATEGORIAS, GASTO_ESTADOS, GASTO_TIPOS, type GastoEstadoPago, type GastoTipo } from '../types/gastos.types';
import { MEDIOS_PAGO } from '../../pagos/constants/medios-pago.constants';

interface RegistrarGastoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mes: number;
  anio: number;
  onSuccess: () => void;
}

const registrarGastoSchemaBase = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal(GASTO_TIPOS.FIJO),
    categoria: z.string().min(1, { error: 'Elegí una categoría' }),
    descripcion: z.string().min(3, { error: 'Ingresá una descripción' }),
    monto: z.coerce
      .number({ error: 'Ingresá un monto válido' })
      .gt(0, { error: 'El monto debe ser mayor a 0' }),
    medioPago: z.string().min(1, { error: 'Seleccioná un medio de pago' }),
    observaciones: z
      .string()
      .max(300, { error: 'Máximo 300 caracteres' })
      .optional()
      .or(z.literal('')),
    diaDeAplicacion: z.coerce
      .number({ error: 'Indica el día de aplicación' })
      .int({ error: 'Debe ser un número entero' })
      .min(1, { error: 'Debe estar entre 1 y 31' })
      .max(31, { error: 'Debe estar entre 1 y 31' }),
  }),
  z.object({
    tipo: z.literal(GASTO_TIPOS.VARIABLE),
    categoria: z.string().min(1, { error: 'Elegí una categoría' }),
    descripcion: z.string().min(3, { error: 'Ingresá una descripción' }),
    monto: z.coerce
      .number({ error: 'Ingresá un monto válido' })
      .gt(0, { error: 'El monto debe ser mayor a 0' }),
    medioPago: z.string().min(1, { error: 'Seleccioná un medio de pago' }),
    observaciones: z
      .string()
      .max(300, { error: 'Máximo 300 caracteres' })
      .optional()
      .or(z.literal('')),
    fecha: z.string().min(1, { error: 'Elegí una fecha' }),
    estadoPago: z.enum([
      GASTO_ESTADOS.PENDIENTE,
      GASTO_ESTADOS.PAGADO,
      GASTO_ESTADOS.PROGRAMADO,
    ]),
  }),
]);

type RegistrarGastoFormData = z.infer<typeof registrarGastoSchemaBase>;

const buildSchemaForPeriod = (mes: number, anio: number) => {
  return registrarGastoSchemaBase.superRefine((data, ctx) => {
    if (data.tipo === GASTO_TIPOS.VARIABLE) {
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
  const firstDayOfMonth = new Date(anio, mes - 1, 1);
  const defaultDate = firstDayOfMonth.toISOString().split('T')[0];
  return {
    tipo: GASTO_TIPOS.VARIABLE,
    categoria: '',
    descripcion: '',
    monto: 0,
    medioPago: MEDIOS_PAGO.EFECTIVO,
    observaciones: '',
    fecha: defaultDate,
    estadoPago: GASTO_ESTADOS.PENDIENTE as GastoEstadoPago,
    diaDeAplicacion: 1,
  } as RegistrarGastoFormData;
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

export const RegistrarGastoModal = ({ isOpen, onClose, mes, anio, onSuccess }: RegistrarGastoModalProps) => {
  const schema = buildSchemaForPeriod(mes, anio);
  const form = useForm<RegistrarGastoFormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(mes, anio),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;
  const [selectedTipo, setSelectedTipo] = useState<GastoTipo>(GASTO_TIPOS.VARIABLE);
  const { min, max } = getPeriodBounds(mes, anio);
  const { showSuccess, showError } = useToast();
  const crearGastoFijo = useCrearGastoFijo();
  const crearGastoVariable = useCrearGastoVariable();
  const isPending = isSubmitting || crearGastoFijo.isPending || crearGastoVariable.isPending;
  const periodLabel = monthFormatter.format(new Date(anio, mes - 1, 1));

  const closeModal = () => {
    if (isPending) {
      return;
    }
    reset(getDefaultValues(mes, anio));
    setSelectedTipo(GASTO_TIPOS.VARIABLE);
    onClose();
  };

  const onSubmit = async (data: RegistrarGastoFormData) => {
    try {
      if (data.tipo === GASTO_TIPOS.FIJO) {
        await crearGastoFijo.mutateAsync({
          mes,
          anio,
          categoria: data.categoria,
          descripcion: data.descripcion.trim(),
          monto: data.monto,
          diaDeAplicacion: data.diaDeAplicacion,
          medioPago: data.medioPago,
          observaciones: data.observaciones?.trim() ? data.observaciones.trim() : undefined,
        });
      } else {
        await crearGastoVariable.mutateAsync({
          mes,
          anio,
          categoria: data.categoria,
          descripcion: data.descripcion.trim(),
          monto: data.monto,
          fecha: data.fecha,
          medioPago: data.medioPago,
          estadoPago: data.estadoPago,
          observaciones: data.observaciones?.trim() ? data.observaciones.trim() : undefined,
        });
      }

      showSuccess('Gasto registrado correctamente');
      onSuccess();
      reset(getDefaultValues(mes, anio));
      setSelectedTipo(GASTO_TIPOS.VARIABLE);
      onClose();
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message)
          : 'No pudimos registrar el gasto';
      showError(message);
    }
  };

  const categorias = selectedTipo === GASTO_TIPOS.FIJO ? GASTO_CATEGORIAS.FIJOS : GASTO_CATEGORIAS.VARIABLES;

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="Registrar nuevo gasto" maxWidth="2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-teal-600">calendar_month</span>
            Periodo seleccionado: <span className="font-bold text-gray-900 dark:text-white">{periodLabel}</span>
          </div>
          <span className="text-xs uppercase tracking-widest text-teal-600">Mes {mes} / {anio}</span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">Tipo de gasto</p>
          <div className="mt-3 inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-[#3f3f46] dark:bg-[#1f1f24]">
            {([GASTO_TIPOS.VARIABLE, GASTO_TIPOS.FIJO] as const).map((tipo) => {
              const isActive = selectedTipo === tipo;
              const icon = tipo === GASTO_TIPOS.VARIABLE ? 'dynamic_form' : 'deployed_code';
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
            {errors.categoria ? (
              <p className="mt-1 text-xs text-red-600">{errors.categoria.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
              Medio de pago <span className="text-red-500">*</span>
            </label>
            <select
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
            {errors.medioPago ? (
              <p className="mt-1 text-xs text-red-600">{errors.medioPago.message}</p>
            ) : null}
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
            placeholder="Ej: Ajuste de combustible, renovación de seguro, etc."
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
              errors.descripcion ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.descripcion ? (
            <p className="mt-1 text-xs text-red-600">{errors.descripcion.message}</p>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
              Monto <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                $
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

          {selectedTipo === GASTO_TIPOS.FIJO ? (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                Día de aplicación <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={31}
                {...register('diaDeAplicacion', { valueAsNumber: true })}
                disabled={isPending}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
                  errors.diaDeAplicacion ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">Usamos este día para programar el registro automático del gasto fijo.</p>
              {errors.diaDeAplicacion ? (
                <p className="mt-1 text-xs text-red-600">{errors.diaDeAplicacion.message}</p>
              ) : null}
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                Fecha del gasto <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={min}
                max={max}
                {...register('fecha')}
                disabled={isPending}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
                  errors.fecha ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">Solo se permiten fechas dentro del mes filtrado.</p>
              {errors.fecha ? <p className="mt-1 text-xs text-red-600">{errors.fecha.message}</p> : null}
            </div>
          )}
        </div>

        {selectedTipo === GASTO_TIPOS.VARIABLE ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
              Estado del pago
            </label>
            <select
              {...register('estadoPago')}
              disabled={isPending}
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
                errors.estadoPago ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
              }`}
            >
              {Object.values(GASTO_ESTADOS).map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
            {errors.estadoPago ? <p className="mt-1 text-xs text-red-600">{errors.estadoPago.message}</p> : null}
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
            Observaciones
          </label>
          <textarea
            rows={3}
            {...register('observaciones')}
            disabled={isPending}
            placeholder="Notas internas, folio de factura, proveedor, etc."
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white ${
              errors.observaciones ? 'border-red-500 dark:border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.observaciones ? (
            <p className="mt-1 text-xs text-red-600">{errors.observaciones.message}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={closeModal} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="brand" disabled={isPending} className="inline-flex items-center gap-2">
            {isPending ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-[18px]">task_alt</span>}
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
};
