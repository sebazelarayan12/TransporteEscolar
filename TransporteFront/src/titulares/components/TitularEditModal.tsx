import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateTitularSchema, type UpdateTitularFormData } from '../schemas/titular.schema';
import type { TitularResponse } from '../types/titular.types';
import { Modal } from '../../shared/ui/Modal';
import { Button } from '../../shared/ui/Button';

interface TitularEditModalProps {
  titular: TitularResponse;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdateTitularFormData) => Promise<void>;
  isSaving: boolean;
}

export const TitularEditModal = ({ 
  titular, 
  isOpen, 
  onClose, 
  onSave, 
  isSaving 
}: TitularEditModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateTitularFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(updateTitularSchema) as any,
    defaultValues: {
      nombreContacto: titular.nombreContacto,
      direccion: titular.direccion,
      montoMensualPactado: titular.montoMensualPactado,
    },
  });

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSave(data);
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Titular" maxWidth="lg">
      {/* Loading Overlay */}
      {isSaving && (
        <div className="absolute inset-0 bg-white/80 dark:bg-[#27272a]/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007a8a]" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Guardando cambios...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Campo Apellido (read-only) */}
        <div>
          <label
            htmlFor="apellido"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Apellido
          </label>
          <div className="px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-[#18181b] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#3f3f46]">
            {titular.apellido}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            El apellido no se puede modificar
          </p>
        </div>

        {/* Campo Nombre de Contacto */}
        <div>
          <label
            htmlFor="nombreContacto"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Nombre de Contacto <span className="text-red-500">*</span>
          </label>
          <input
            id="nombreContacto"
            type="text"
            {...register('nombreContacto')}
            aria-invalid={errors.nombreContacto ? 'true' : 'false'}
            aria-describedby={errors.nombreContacto ? 'nombreContacto-error' : undefined}
            className={`
              w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white
              bg-white dark:bg-[#27272a]
              focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
              transition-colors
              ${
                errors.nombreContacto
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-[#3f3f46]'
              }
            `}
            placeholder="Ingrese el nombre de contacto"
            disabled={isSaving}
          />
          {errors.nombreContacto && (
            <p id="nombreContacto-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.nombreContacto.message}
            </p>
          )}
        </div>

        {/* Campo Dirección */}
        <div>
          <label
            htmlFor="direccion"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Dirección <span className="text-red-500">*</span>
          </label>
          <input
            id="direccion"
            type="text"
            {...register('direccion')}
            aria-invalid={errors.direccion ? 'true' : 'false'}
            aria-describedby={errors.direccion ? 'direccion-error' : undefined}
            className={`
              w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white
              bg-white dark:bg-[#27272a]
              focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
              transition-colors
              ${
                errors.direccion
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-[#3f3f46]'
              }
            `}
            placeholder="Ingrese la dirección"
            disabled={isSaving}
          />
          {errors.direccion && (
            <p id="direccion-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.direccion.message}
            </p>
          )}
        </div>

        {/* Campo Monto Mensual Pactado */}
        <div>
          <label
            htmlFor="montoMensualPactado"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Monto Mensual Pactado <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              $
            </span>
            <input
              id="montoMensualPactado"
              type="number"
              step="0.01"
              min="0"
              {...register('montoMensualPactado')}
              aria-invalid={errors.montoMensualPactado ? 'true' : 'false'}
              aria-describedby={errors.montoMensualPactado ? 'montoMensualPactado-error' : undefined}
              className={`
                w-full pl-8 pr-4 py-2.5 rounded-lg border text-gray-900 dark:text-white
                bg-white dark:bg-[#27272a]
                focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
                transition-colors
                ${
                  errors.montoMensualPactado
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-[#3f3f46]'
                }
              `}
              placeholder="0.00"
              disabled={isSaving}
            />
          </div>
          {errors.montoMensualPactado && (
            <p id="montoMensualPactado-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.montoMensualPactado.message}
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSaving || !isDirty}
            className="w-full sm:flex-1 sm:order-2 bg-[#007a8a] hover:bg-[#00626e] text-white disabled:bg-gray-400 disabled:hover:bg-gray-400"
          >
            {isSaving ? (
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
