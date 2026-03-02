import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { CreatePasajeroFormData } from '../schemas/pasajero.schema';

interface PasajeroObservacionesFieldProps {
  register: UseFormRegister<CreatePasajeroFormData>;
  errors: FieldErrors<CreatePasajeroFormData>;
}

export const PasajeroObservacionesField = ({
  register,
  errors,
}: PasajeroObservacionesFieldProps) => {
  return (
    <div>
      <label htmlFor="observaciones" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Observaciones <span className="text-xs text-gray-500">(opcional)</span>
      </label>
      <textarea
        id="observaciones"
        rows={4}
        {...register('observaciones')}
        aria-invalid={errors.observaciones ? 'true' : 'false'}
        aria-describedby={errors.observaciones ? 'observaciones-error' : undefined}
        className={`
          w-full rounded-lg border px-4 py-2.5 text-gray-900 dark:text-white
          bg-white dark:bg-[#27272a]
          focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
          transition-colors resize-y
          ${errors.observaciones ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-[#3f3f46]'}
        `}
        placeholder="Ingrese observaciones adicionales si es necesario (alergias, necesidades especiales, etc.)"
      />
      {errors.observaciones && (
        <p id="observaciones-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {errors.observaciones.message}
        </p>
      )}
    </div>
  );
};
