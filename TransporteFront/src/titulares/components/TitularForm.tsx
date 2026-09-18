import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createTitularSchema, type CreateTitularFormData } from '../schemas/titular.schema';
import { useCreateTitular } from '../services/titulares.queries';
import { FormField } from '../../shared/ui/FormField';
import { FormActions } from '../../shared/ui/FormActions';
import { useToast } from '../../shared/hooks/useToast';
import { fieldAriaProps, fieldInputClass } from '../../shared/utils/form-field.helpers';
import { MontoMensualInput } from './MontoMensualInput';

const TEXT_FIELDS = [
  { name: 'apellido', label: 'Apellido', placeholder: 'Ingrese el apellido' },
  { name: 'nombreContacto', label: 'Nombre de Contacto', placeholder: 'Ingrese el nombre de contacto' },
  { name: 'direccion', label: 'Dirección', placeholder: 'Ingrese la dirección' },
] as const;

const getErrorMessage = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : 'Error al registrar el titular';

export const TitularForm = () => {
  const navigate = useNavigate();
  const createTitular = useCreateTitular();
  const { showSuccess, showError } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateTitularFormData>({
    resolver: zodResolver(createTitularSchema) as Resolver<CreateTitularFormData>,
    defaultValues: {
      apellido: '',
      nombreContacto: '',
      direccion: '',
      montoMensualPactado: 0,
    },
  });

  const onSubmit = async (data: CreateTitularFormData) => {
    try {
      await createTitular.mutateAsync(data);
      showSuccess('¡Titular registrado exitosamente!');
      navigate('/titulares');
    } catch (error: unknown) {
      showError(getErrorMessage(error));
    }
  };

  const isPending = isSubmitting || createTitular.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {TEXT_FIELDS.map(({ name, label, placeholder }) => {
        const error = errors[name]?.message;
        return (
          <FormField key={name} id={name} label={label} required error={error}>
            <input
              id={name}
              type="text"
              {...register(name)}
              {...fieldAriaProps(name, error)}
              aria-required="true"
              className={fieldInputClass(Boolean(error))}
              placeholder={placeholder}
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
              disabled={isPending}
              error={errors.montoMensualPactado?.message}
              required
            />
          )}
        />
      </FormField>

      <FormActions onCancel={() => navigate('/titulares')} isPending={isPending} submitLabel="Guardar Titular" />
    </form>
  );
};
