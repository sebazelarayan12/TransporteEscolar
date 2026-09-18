import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updatePasajeroSchema, type UpdatePasajeroFormData } from '../schemas/pasajero.schema';
import type { PasajeroResponse } from '../types/pasajero.types';
import { Modal } from '../../shared/ui/Modal';
import { FormField } from '../../shared/ui/FormField';
import { FormActions } from '../../shared/ui/FormActions';
import { SavingOverlay } from '../../shared/ui/SavingOverlay';
import { fieldAriaProps, fieldInputClass } from '../../shared/utils/form-field.helpers';

interface PasajeroEditModalProps {
  pasajero: PasajeroResponse;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdatePasajeroFormData) => Promise<void>;
  isSaving: boolean;
}

const TEXT_FIELDS = [
  { name: 'nombre', label: 'Nombre del Pasajero', placeholder: 'Ingrese el nombre del pasajero' },
  { name: 'colegio', label: 'Colegio', placeholder: 'Ingrese el nombre del colegio' },
  { name: 'gradoCurso', label: 'Grado/Curso', placeholder: 'Ej: 5to A, 1er año, etc.' },
] as const;

export const PasajeroEditModal = ({ pasajero, isOpen, onClose, onSave, isSaving }: PasajeroEditModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdatePasajeroFormData>({
    resolver: zodResolver(updatePasajeroSchema),
    defaultValues: {
      nombre: pasajero.nombre,
      colegio: pasajero.colegio,
      gradoCurso: pasajero.gradoCurso,
      turno: pasajero.turno,
      observaciones: pasajero.observaciones || '',
    },
  });

  const observacionesError = errors.observaciones?.message;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Pasajero" maxWidth="lg">
      {isSaving && <SavingOverlay />}

      <form onSubmit={handleSubmit(onSave)} className="space-y-6">
        <input type="hidden" {...register('turno')} />

        {/* Apellido (read-only - heredado del titular) */}
        <div>
          <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Apellido</p>
          <div className="px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-[#18181b] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#3f3f46]">
            {pasajero.apellido}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            El apellido se hereda del titular y no se puede modificar
          </p>
        </div>

        {TEXT_FIELDS.map(({ name, label, placeholder }) => {
          const error = errors[name]?.message;
          return (
            <FormField key={name} id={name} label={label} required error={error}>
              <input
                id={name}
                type="text"
                {...register(name)}
                {...fieldAriaProps(name, error)}
                className={fieldInputClass(Boolean(error))}
                placeholder={placeholder}
                disabled={isSaving}
              />
            </FormField>
          );
        })}

        <FormField id="observaciones" label="Observaciones" labelHint="(opcional)" error={observacionesError}>
          <textarea
            id="observaciones"
            rows={4}
            {...register('observaciones')}
            {...fieldAriaProps('observaciones', observacionesError)}
            className={`${fieldInputClass(Boolean(observacionesError))} resize-y`}
            placeholder="Ingrese observaciones adicionales si es necesario (alergias, necesidades especiales, etc.)"
            disabled={isSaving}
          />
        </FormField>

        <FormActions
          onCancel={onClose}
          isPending={isSaving}
          submitDisabled={!isDirty}
          submitLabel={isDirty ? 'Guardar Cambios' : 'Sin cambios'}
        />
      </form>
    </Modal>
  );
};
