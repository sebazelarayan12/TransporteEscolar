import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { telefonoSchema, type TelefonoFormData } from '../schemas/telefono.schema';
import { useAddTitularTelefono } from '../services/titulares.queries';
import { Modal } from '../../shared/ui/Modal';
import { Button } from '../../shared/ui/Button';
import { useToast } from '../../shared/hooks/useToast';

interface TitularPhoneModalProps {
  titularId: number;
  isOpen: boolean;
  onClose: () => void;
  titularApellido?: string;
  onSaved?: () => void;
}

export const TitularPhoneModal = ({ 
  titularId, 
  isOpen, 
  onClose,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  titularApellido: _titularApellido,
  onSaved
}: TitularPhoneModalProps) => {
  const addTelefono = useAddTitularTelefono(titularId);
  const { showSuccess, showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TelefonoFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(telefonoSchema) as any,
    defaultValues: {
      numeroE164: '',
      esPrincipal: false,
    },
  });

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      await addTelefono.mutateAsync(data);
      showSuccess('Teléfono agregado exitosamente');
      reset();
      if (onSaved) {
        onSaved();
      }
      onClose();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Error al agregar el teléfono';
      showError(errorMessage);
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Agregar Teléfono" maxWidth="md">
      <form onSubmit={handleFormSubmit} className="space-y-6">
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
            disabled={isSubmitting || addTelefono.isPending}
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

        {/* Campo Es Principal (checkbox) */}
        <div className="flex items-start gap-3">
          <input
            id="esPrincipal"
            type="checkbox"
            {...register('esPrincipal')}
            className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-[#3f3f46] text-[#007a8a] focus:ring-[#007a8a] focus:ring-offset-0 bg-white dark:bg-[#27272a]"
            disabled={isSubmitting || addTelefono.isPending}
          />
          <div className="flex-1">
            <label
              htmlFor="esPrincipal"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Marcar como teléfono principal
            </label>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Si se marca como principal, los demás teléfonos dejarán de serlo
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting || addTelefono.isPending}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || addTelefono.isPending}
            className="w-full sm:flex-1 sm:order-2 bg-[#007a8a] hover:bg-[#00626e] text-white disabled:bg-gray-400 disabled:hover:bg-gray-400"
          >
            {isSubmitting || addTelefono.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Guardando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">add</span>
                Agregar Teléfono
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
