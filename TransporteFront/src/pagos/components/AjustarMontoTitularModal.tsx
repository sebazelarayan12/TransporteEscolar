import type { ReactNode } from 'react';
import { Controller, useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TitularResponse } from '../../titulares/types/titular.types';
import { Button, Modal, PriceInput } from '../../shared/ui';
import { useToast } from '../../shared/hooks/useToast';
import { useAjustarMontoTitular } from '../services/pagos.queries';
import type { AjusteTitularRequest } from '../types/pago.types';
import { formatCurrency } from '../../shared/utils/currency.helpers';

const ajustarMontoSchema = z.object({
  nuevoMonto: z
    .number()
    .refine((value) => Number.isFinite(value), { message: 'Ingresá un monto válido' })
    .min(0.01, { message: 'El monto debe ser mayor a 0' }),
  motivo: z
    .string()
    .trim()
    .max(200, { message: 'Máximo 200 caracteres' })
    .optional(),
  aplicarSoloPendientes: z.boolean(),
});

type AjustarMontoFormData = z.infer<typeof ajustarMontoSchema>;

const buildDefaultValues = (titular: TitularResponse | null): AjustarMontoFormData => ({
  nuevoMonto: titular?.montoMensualPactado ?? 0,
  motivo: '',
  aplicarSoloPendientes: true,
});

interface AjustarMontoTitularModalProps {
  isOpen: boolean;
  onClose: () => void;
  titular: TitularResponse | null;
}

export const AjustarMontoTitularModal = ({ isOpen, onClose, titular }: AjustarMontoTitularModalProps) => {
  const { showSuccess, showError } = useToast();
  const ajustarMontoTitular = useAjustarMontoTitular();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
  } = useForm<AjustarMontoFormData>({
    resolver: zodResolver(ajustarMontoSchema),
    mode: 'onChange',
    defaultValues: buildDefaultValues(titular),
  });

  const handleModalClose = () => {
    if (ajustarMontoTitular.isPending) {
      return;
    }

    reset(buildDefaultValues(titular));
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!titular) {
      return;
    }

    const payload: AjusteTitularRequest = {
      nuevoMonto: values.nuevoMonto,
      aplicarSoloPendientes: values.aplicarSoloPendientes,
      motivo: values.motivo && values.motivo.length > 0 ? values.motivo : undefined,
    };

    try {
      const response = await ajustarMontoTitular.mutateAsync({
        titularId: titular.id,
        data: payload,
      });

      showSuccess(`${response.cantidadCuotasActualizadas} cuotas actualizadas`);
      handleModalClose();
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'No se pudo ajustar el monto pactado';
      showError(errorMessage);
    }
  });

  const disabled = ajustarMontoTitular.isPending || !titular;
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Ajustar monto mensual"
      maxWidth="lg"
    >
      <div className="space-y-6">
        <TitularSummaryCard titular={titular} />

        <form onSubmit={onSubmit} className="space-y-5">
          <Controller
            control={control}
            name="nuevoMonto"
            render={({ field }) => (
              <FieldWrapper id="nuevoMonto" label="Nuevo monto mensual" error={errors.nuevoMonto?.message}>
                <PriceInput
                  id="nuevoMonto"
                  value={field.value ?? ''}
                  onValueChange={(cleanValue: string, floatValue: number | undefined) => {
                    if (!cleanValue) {
                      field.onChange(undefined);
                      return;
                    }
                    field.onChange(floatValue ?? undefined);
                  }}
                  onBlur={field.onBlur}
                  disabled={disabled}
                  prefix="$"
                  inputClassName="rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] disabled:bg-gray-100 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white"
                />
              </FieldWrapper>
            )}
          />

          <TextareaField
            id="motivo"
            label="Motivo (opcional)"
            placeholder="Notas internas del ajuste"
            disabled={disabled}
            error={errors.motivo?.message}
            registration={register('motivo')}
          />

          <CheckboxField
            label="Aplicar solo a cuotas pendientes"
            description="Solo actualiza cuotas con saldo pendiente. Las cuotas totalmente pagadas se conservan."
            disabled={disabled}
            registration={register('aplicarSoloPendientes')}
          />

          <FormActions
            isPending={ajustarMontoTitular.isPending}
            submitDisabled={disabled || !isValid}
            onCancel={handleModalClose}
          />
        </form>
      </div>
    </Modal>
  );
};

interface FieldWrapperProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

const FieldWrapper = ({ id, label, error, children }: FieldWrapperProps) => (
  <div>
    <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

interface TextareaFieldProps {
  id: string;
  label: string;
  placeholder: string;
  disabled: boolean;
  error?: string;
  registration: UseFormRegisterReturn;
}

const TextareaField = ({ id, label, placeholder, disabled, error, registration }: TextareaFieldProps) => (
  <FieldWrapper id={id} label={label} error={error}>
    <textarea
      id={id}
      rows={3}
      className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] disabled:bg-gray-100 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white"
      placeholder={placeholder}
      disabled={disabled}
      {...registration}
    />
  </FieldWrapper>
);

interface CheckboxFieldProps {
  label: string;
  description: string;
  disabled: boolean;
  registration: UseFormRegisterReturn;
}

const CheckboxField = ({ label, description, disabled, registration }: CheckboxFieldProps) => (
  <label className="flex items-start gap-3 rounded-2xl border border-gray-200 p-4 dark:border-[#3f3f46]">
    <input
      type="checkbox"
      className="mt-1 h-4 w-4 rounded border-gray-300 text-[#1d8ca5] focus:ring-[#1d8ca5]"
      disabled={disabled}
      {...registration}
    />
    <div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  </label>
);

interface FormActionsProps {
  isPending: boolean;
  submitDisabled: boolean;
  onCancel: () => void;
}

const FormActions = ({ isPending, submitDisabled, onCancel }: FormActionsProps) => (
  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
    <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending} className="w-full sm:w-auto">
      Cancelar
    </Button>
    <Button type="submit" variant="brand" disabled={submitDisabled} className="w-full sm:w-auto">
      {isPending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-[20px] text-white">progress_activity</span>
          Actualizando...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[20px]">tune</span>
          Actualizar cuotas
        </span>
      )}
    </Button>
  </div>
);

const TitularSummaryCard = ({ titular }: { titular: TitularResponse | null }) => {
  const titularLabel = titular ? `${titular.apellido}, ${titular.nombreContacto}` : 'Sin titular seleccionado';

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-[#3f3f46] dark:bg-[#1f1f24]">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-gray-500">Titular</p>
        <p className="text-base font-semibold text-gray-900 dark:text-white">{titularLabel}</p>
      </div>
      {titular && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Monto actual</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(titular.montoMensualPactado)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Aplicación</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              Sincroniza todas las cuotas generadas del titular para reflejar el nuevo monto.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
