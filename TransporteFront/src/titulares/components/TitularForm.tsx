import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createTitularSchema, type CreateTitularFormData } from '../schemas/titular.schema';
import { useCreateTitular } from '../services/titulares.queries';
import { Button, PriceInput } from '../../shared/ui';
import { useToast } from '../../shared/hooks';

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
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Error al registrar el titular';
      showError(errorMessage);
    }
  };

  const handleCancel = () => {
    navigate('/titulares');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Campo Apellido */}
      <div>
        <label
          htmlFor="apellido"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Apellido <span className="text-red-500">*</span>
        </label>
        <input
          id="apellido"
          type="text"
          {...register('apellido')}
          aria-invalid={errors.apellido ? 'true' : 'false'}
          aria-describedby={errors.apellido ? 'apellido-error' : undefined}
          className={`
            w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white
            bg-white dark:bg-[#27272a]
            focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
            transition-colors
            ${
              errors.apellido
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-[#3f3f46]'
            }
          `}
          placeholder="Ingrese el apellido"
        />
        {errors.apellido && (
          <p id="apellido-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {errors.apellido.message}
          </p>
        )}
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
        <Controller
          control={control}
          name="montoMensualPactado"
          render={({ field }) => (
            <PriceInput
              id="montoMensualPactado"
              value={field.value ?? ''}
              onValueChange={(cleanValue: string, floatValue: number | undefined) => {
                if (!cleanValue) {
                  field.onChange(undefined);
                  return;
                }
                field.onChange(floatValue ?? undefined);
              }}
              onBlur={field.onBlur}
              disabled={isSubmitting || createTitular.isPending}
              placeholder="0,00"
              prefix="$"
              containerClassName="relative"
              inputClassName={`
                w-full pr-4 py-2.5 rounded-lg border text-gray-900 dark:text-white
                bg-white dark:bg-[#27272a]
                focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
                transition-colors
                ${
                  errors.montoMensualPactado
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-[#3f3f46]'
                }
              `}
              aria-invalid={errors.montoMensualPactado ? 'true' : 'false'}
              aria-describedby={errors.montoMensualPactado ? 'montoMensualPactado-error' : undefined}
            />
          )}
        />
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
          onClick={handleCancel}
          disabled={isSubmitting || createTitular.isPending}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || createTitular.isPending}
          className="w-full sm:flex-1 sm:order-2 bg-[#007a8a] hover:bg-[#00626e] text-white disabled:bg-gray-400 disabled:hover:bg-gray-400"
        >
          {isSubmitting || createTitular.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Guardando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[20px]">save</span>
              Guardar Titular
            </span>
          )}
        </Button>
      </div>
    </form>
  );
};
