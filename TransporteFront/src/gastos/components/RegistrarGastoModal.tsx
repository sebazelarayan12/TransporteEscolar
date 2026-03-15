import { useEffect, useId } from 'react';
import { useForm, useWatch, type FieldError, type Resolver, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../shared/ui';
import { useToast } from '../../shared/hooks';
import { useActualizarGastoFijo, useCrearGastoFijo, useCrearGastoVariable } from '../services/gastos.queries';
import {
  GASTO_CATEGORIAS,
  GASTO_ESTADOS,
  GASTO_TIPOS,
  type ActualizarGastoFijoRequest,
  type GastoEstadoPago,
  type GastoItem,
  type GastoTipo,
} from '../types/gastos.types';
import { MEDIOS_PAGO } from '../../pagos/constants/medios-pago.constants';
import { GastoModalHeader } from './GastoModalHeader';
import { GastoTipoSection } from './GastoTipoSection';
import { GastoFormFields } from './GastoFormFields';
import { GastoModalActions } from './GastoModalActions';
import { GastoPlanCuotasSection } from './GastoPlanCuotasSection';
import { normalizeDateInput } from '../helpers/plan-cuotas.helpers';

interface RegistrarGastoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mes: number;
  anio: number;
  onSuccess: () => void;
  modo?: 'create' | 'edit';
  initialData?: GastoItem | null;
  templateId?: number | null;
}

const planCuotasFormSchema = z.object({
  habilitado: z.boolean().default(false),
  fechaPrimeraCuota: z.string().optional(),
  cantidadCuotas: z
    .coerce
    .number({ error: 'Ingresá la cantidad de cuotas' })
    .int({ error: 'Debe ser un número entero' })
    .min(2, { error: 'Al menos 2 cuotas' })
    .max(36, { error: 'Máximo 36 cuotas' })
    .optional(),
});

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
    planCuotas: planCuotasFormSchema,
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
    ]),
    planCuotas: planCuotasFormSchema,
  }),
]);

export type RegistrarGastoFormData = z.infer<typeof registrarGastoSchemaBase>;

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

    if (data.tipo === GASTO_TIPOS.FIJO && data.planCuotas?.habilitado) {
      if (!data.planCuotas.fechaPrimeraCuota) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Indicá la fecha de la primera cuota',
          path: ['planCuotas', 'fechaPrimeraCuota'],
        });
      } else {
        const fechaPlan = new Date(data.planCuotas.fechaPrimeraCuota);
        const periodoInicio = new Date(Date.UTC(anio, mes - 1, 1));
        if (fechaPlan.getTime() < periodoInicio.getTime()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La primera cuota debe ser igual o posterior al periodo filtrado',
            path: ['planCuotas', 'fechaPrimeraCuota'],
          });
        }
      }

      if (!data.planCuotas.cantidadCuotas || data.planCuotas.cantidadCuotas < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ingresá al menos 2 cuotas',
          path: ['planCuotas', 'cantidadCuotas'],
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
    tipo: GASTO_TIPOS.VARIABLE,
    categoria: '',
    descripcion: '',
    monto: 0,
    medioPago: MEDIOS_PAGO.EFECTIVO,
    observaciones: '',
    fecha: defaultDate,
    estadoPago: GASTO_ESTADOS.PAGADO as GastoEstadoPago,
    diaDeAplicacion: 1,
    planCuotas: {
      habilitado: false,
      fechaPrimeraCuota: defaultDate,
      cantidadCuotas: 2,
    },
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

export const RegistrarGastoModal = ({
  isOpen,
  onClose,
  mes,
  anio,
  onSuccess,
  modo = 'create',
  initialData,
  templateId,
}: RegistrarGastoModalProps) => {
  const fieldIdPrefix = useId();
  const fieldIds = {
    categoria: `${fieldIdPrefix}-categoria`,
    medioPago: `${fieldIdPrefix}-medio-pago`,
    descripcion: `${fieldIdPrefix}-descripcion`,
    monto: `${fieldIdPrefix}-monto`,
    diaAplicacion: `${fieldIdPrefix}-dia-aplicacion`,
    fecha: `${fieldIdPrefix}-fecha`,
    estadoPago: `${fieldIdPrefix}-estado-pago`,
    observaciones: `${fieldIdPrefix}-observaciones`,
  } as const;
  const schema = buildSchemaForPeriod(mes, anio);
  const resolver = zodResolver(schema) as Resolver<RegistrarGastoFormData>;
  const isEditMode = modo === 'edit';
  const form = useForm<RegistrarGastoFormData>({
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
  const typedErrors = errors as typeof errors &
    Partial<Record<'diaDeAplicacion' | 'fecha' | 'estadoPago', FieldError | undefined>>;
  const watchedTipo = useWatch({ control, name: 'tipo' }) as GastoTipo | undefined;
  const selectedTipo = watchedTipo ?? (isEditMode ? GASTO_TIPOS.FIJO : GASTO_TIPOS.VARIABLE);
  const { min, max } = getPeriodBounds(mes, anio);
  const { showSuccess, showError } = useToast();
  const crearGastoFijo = useCrearGastoFijo();
  const crearGastoVariable = useCrearGastoVariable();
  const actualizarGastoFijo = useActualizarGastoFijo();
  const isPending = isSubmitting || crearGastoFijo.isPending || crearGastoVariable.isPending || actualizarGastoFijo.isPending;
  const periodLabel = monthFormatter.format(new Date(anio, mes - 1, 1));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (isEditMode && initialData) {
      const fallbackDate = getPeriodBounds(initialData.mes ?? mes, initialData.anio ?? anio).min;
      const diaAplicacion = new Date(initialData.fechaCuota ?? fallbackDate).getUTCDate();
      const fechaPrimeraPlan = normalizeDateInput(initialData.fechaPrimeraCuota) || fallbackDate;
      const cantidadPlan = initialData.cantidadCuotas ?? initialData.totalCuotas ?? 2;
      reset({
        tipo: GASTO_TIPOS.FIJO,
        categoria: initialData.categoria,
        descripcion: initialData.descripcion,
        monto: initialData.monto,
        medioPago: initialData.medioPago,
        observaciones: initialData.observaciones ?? '',
        diaDeAplicacion: diaAplicacion,
        planCuotas: {
          habilitado: Boolean(initialData.esPlanCuotas),
          fechaPrimeraCuota: fechaPrimeraPlan,
          cantidadCuotas: cantidadPlan,
        },
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

  const onSubmit: SubmitHandler<RegistrarGastoFormData> = async (data) => {
    const observaciones = data.observaciones?.trim() ? data.observaciones.trim() : undefined;
    const planCuotasPayload = data.planCuotas?.habilitado
      ? {
          fechaPrimeraCuota: data.planCuotas.fechaPrimeraCuota!,
          cantidadCuotas: data.planCuotas.cantidadCuotas!,
        }
      : undefined;
    try {
      if (isEditMode) {
        const targetTemplateId = templateId ?? initialData?.templateId ?? null;
        if (!targetTemplateId) {
          showError('No encontramos la plantilla asociada al gasto fijo.');
          return;
        }

        if (data.tipo !== GASTO_TIPOS.FIJO) {
          showError('Solo podés editar plantillas de gastos fijos. Guardá nuevamente.');
          return;
        }

        const payload: ActualizarGastoFijoRequest = {
          mes,
          anio,
          categoria: data.categoria,
          descripcion: data.descripcion.trim(),
          monto: data.monto,
          diaDeAplicacion: data.diaDeAplicacion,
          medioPago: data.medioPago,
          observaciones,
          estaActivo: true,
          planCuotas: planCuotasPayload,
        };

        await actualizarGastoFijo.mutateAsync({
          templateId: targetTemplateId,
          data: payload,
        });
      } else if (data.tipo === GASTO_TIPOS.FIJO) {
        await crearGastoFijo.mutateAsync({
          mes,
          anio,
          categoria: data.categoria,
          descripcion: data.descripcion.trim(),
          monto: data.monto,
          diaDeAplicacion: data.diaDeAplicacion,
          medioPago: data.medioPago,
          observaciones,
          planCuotas: planCuotasPayload,
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
          observaciones,
        });
      }

      showSuccess(isEditMode ? 'Gasto fijo actualizado' : 'Gasto registrado correctamente');
      onSuccess();
      reset(getDefaultValues(mes, anio));
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
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={isEditMode ? 'Editar gasto fijo' : 'Registrar nuevo gasto'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <GastoModalHeader periodLabel={periodLabel} mes={mes} anio={anio} />

        <GastoTipoSection
          isEditMode={isEditMode}
          selectedTipo={selectedTipo}
          onSelectTipo={(tipo) => {
            setValue('tipo', tipo);
          }}
        />

        <GastoFormFields
          control={control}
          register={register}
          errors={errors}
          typedErrors={typedErrors}
          fieldIds={fieldIds}
          isPending={isPending}
          categorias={categorias}
          selectedTipo={selectedTipo}
          minDate={min}
          maxDate={max}
        />

        <GastoPlanCuotasSection
          control={control}
          register={register}
          errors={errors}
          isPending={isPending}
          minDate={min}
          selectedTipo={selectedTipo}
        />

        <GastoModalActions isPending={isPending} isEditMode={isEditMode} onCancel={closeModal} />
      </form>
    </Modal>
  );
};
