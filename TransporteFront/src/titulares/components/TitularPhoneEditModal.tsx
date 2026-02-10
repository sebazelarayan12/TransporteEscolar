import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateTelefonoSchema, type UpdateTelefonoFormData } from '../schemas/telefono.schema';
import type { TitularTelefonoResponse } from '../types/titular.types';
import { useUpdateTitularTelefono } from '../services/titulares.queries';
import { Modal } from '../../shared/ui/Modal';
import { Button } from '../../shared/ui/Button';
import { useToast } from '../../shared/hooks/useToast';

interface TitularPhoneEditModalProps {
  titularId: number;
  phone: TitularTelefonoResponse;
  isOpen: boolean;
  onClose: () => void;
}

export const TitularPhoneEditModal = ({ 
  titularId, 
  phone, 
  isOpen, 
  onClose 
}: TitularPhoneEditModalProps) => {
  const updateTelefono = useUpdateTitularTelefono(titularId);
  const { showSuccess, showError } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateTelefonoFormData>({
    resolver: zodResolver(updateTelefonoSchema),
    defaultValues: {
      numeroE164: phone.numeroE164,
    },
  });

  useEffect(() => {
    reset({
      numeroE164: phone.numeroE164,
    });
  }, [phone, reset]);

  const handleFormSubmit = async (data: UpdateTelefonoFormData) => {
    try {
      await updateTelefono.mutateAsync({
        telefonoId: phone.id,
        numeroE164: data.numeroE164,
      });
      showSuccess('Teléfono actualizado exitosamente');
      onClose();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Error al actualizar el teléfono';
      showError(errorMessage);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Teléfono" maxWidth="md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Campo Número E164 */}
        <div>
          <label
            htmlFor="numeroE164"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Número de Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            id="numeroE164"
            type="tel"
            {...register('numeroE164')}
            aria-invalid={errors.numeroE164 ? 'true' : 'false'}
            aria-describedby={errors.numeroE164 ? 'numeroE164-error' : undefined}
            className={`
              w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white
              bg-white dark:bg-[#27272a]
              focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
              transition-colors
              ${
                errors.numeroE164
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-[#3f3f46]'
              }
            `}
            placeholder="+541141234567"
            disabled={isSubmitting || updateTelefono.isPending}
          />
          {errors.numeroE164 && (
            <p id="numeroE164-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.numeroE164.message}
            </p>
          )}
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Formato: +[código país][número] (ej: +541141234567)
          </p>
        </div>

        {/* Info de Es Principal (read-only) */}
        {phone.esPrincipal && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-blue-600 dark:text-blue-400">
                check_circle
              </span>
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Este es el teléfono principal del titular
              </p>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting || updateTelefono.isPending}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || updateTelefono.isPending || !isDirty}
            className="w-full sm:flex-1 sm:order-2 bg-[#007a8a] hover:bg-[#00626e] text-white disabled:bg-gray-400 disabled:hover:bg-gray-400"
          >
            {isSubmitting || updateTelefono.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Guardando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">save</span>
                {isDirty ? 'Guardar Cambios' : 'Sin cambios'}
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
