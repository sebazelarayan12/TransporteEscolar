import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateTelefonoSchema, type UpdateTelefonoFormData } from '../schemas/telefono.schema';
import type { TitularTelefonoResponse } from '../types/titular.types';
import { useUpdateTitularTelefono } from '../services/titulares.queries';
import { Modal } from '../../shared/ui/Modal';
import { FormField } from '../../shared/ui/FormField';
import { FormActions } from '../../shared/ui/FormActions';
import { useToast } from '../../shared/hooks/useToast';
import { fieldAriaProps, fieldInputClass } from '../../shared/utils/form-field.helpers';

interface TitularPhoneEditModalProps {
  titularId: number;
  phone: TitularTelefonoResponse;
  isOpen: boolean;
  onClose: () => void;
}

const getErrorMessage = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : 'Error al actualizar el teléfono';

const PrincipalNotice = () => (
  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-[20px] text-blue-600 dark:text-blue-400">check_circle</span>
      <p className="text-sm text-blue-900 dark:text-blue-100">Este es el teléfono principal del titular</p>
    </div>
  </div>
);

export const TitularPhoneEditModal = ({ titularId, phone, isOpen, onClose }: TitularPhoneEditModalProps) => {
  const updateTelefono = useUpdateTitularTelefono(titularId);
  const { showSuccess, showError } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateTelefonoFormData>({
    resolver: zodResolver(updateTelefonoSchema),
    defaultValues: { numeroE164: phone.numeroE164 },
  });

  useEffect(() => {
    reset({ numeroE164: phone.numeroE164 });
  }, [phone, reset]);

  const handleFormSubmit = async (data: UpdateTelefonoFormData) => {
    try {
      await updateTelefono.mutateAsync({ telefonoId: phone.id, numeroE164: data.numeroE164 });
      showSuccess('Teléfono actualizado exitosamente');
      onClose();
    } catch (error: unknown) {
      showError(getErrorMessage(error));
    }
  };

  const isPending = isSubmitting || updateTelefono.isPending;
  const numeroError = errors.numeroE164?.message;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Teléfono" maxWidth="md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          id="numeroE164"
          label="Número de Teléfono"
          required
          error={numeroError}
          hint="Formato: +[código país][número] (ej: +541141234567)"
        >
          <input
            id="numeroE164"
            type="tel"
            {...register('numeroE164')}
            {...fieldAriaProps('numeroE164', numeroError)}
            className={fieldInputClass(Boolean(numeroError))}
            placeholder="+541141234567"
            disabled={isPending}
          />
        </FormField>

        {phone.esPrincipal && <PrincipalNotice />}

        <FormActions
          onCancel={onClose}
          isPending={isPending}
          submitDisabled={!isDirty}
          submitLabel={isDirty ? 'Guardar Cambios' : 'Sin cambios'}
        />
      </form>
    </Modal>
  );
};
