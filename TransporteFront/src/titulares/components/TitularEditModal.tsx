import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateTitularSchema, type UpdateTitularFormData } from '../schemas/titular.schema';
import type { TitularResponse } from '../types/titular.types';
import { Modal } from '../../shared/ui/Modal';
import { FormField } from '../../shared/ui/FormField';
import { FormActions } from '../../shared/ui/FormActions';
import { SavingOverlay } from '../../shared/ui/SavingOverlay';
import { fieldAriaProps, fieldInputClass } from '../../shared/utils/form-field.helpers';
import { MontoMensualInput } from './MontoMensualInput';

interface TitularEditModalProps {
  titular: TitularResponse;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdateTitularFormData) => Promise<void>;
  isSaving: boolean;
}

const TEXT_FIELDS = [
  { name: 'apellido', label: 'Apellido', placeholder: 'Ingrese el apellido' },
  { name: 'nombreContacto', label: 'Nombre de Contacto', placeholder: 'Ingrese el nombre de contacto' },
  { name: 'direccion', label: 'Dirección', placeholder: 'Ingrese la dirección' },
] as const;

export const TitularEditModal = ({ titular, isOpen, onClose, onSave, isSaving }: TitularEditModalProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<UpdateTitularFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(updateTitularSchema) as any,
    defaultValues: {
      apellido: titular.apellido,
      nombreContacto: titular.nombreContacto,
      direccion: titular.direccion,
      montoMensualPactado: titular.montoMensualPactado,
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Titular" maxWidth="lg">
      {isSaving && <SavingOverlay />}

      <form onSubmit={handleSubmit(onSave)} className="space-y-6">
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

        <FormField
          id="montoMensualPactado"
          label="Monto Mensual Pactado"
          required
          error={errors.montoMensualPactado?.message}
        >
          <Controller
            control={control}
            name="montoMensualPactado"
            render={({ field }) => (
              <MontoMensualInput
                id="montoMensualPactado"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isSaving}
                error={errors.montoMensualPactado?.message}
              />
            )}
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
