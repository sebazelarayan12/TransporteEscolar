import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { CreatePasajeroFormData } from '../schemas/pasajero.schema';

interface PasajeroDatosPersonalesSectionProps {
  register: UseFormRegister<CreatePasajeroFormData>;
  errors: FieldErrors<CreatePasajeroFormData>;
}

export const PasajeroDatosPersonalesSection = ({
  register,
  errors,
}: PasajeroDatosPersonalesSectionProps) => {
  return (
    <section className="space-y-6">
      <div>
        <label htmlFor="nombre" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nombre del Pasajero <span className="text-red-500">*</span>
        </label>
        <input
          id="nombre"
          type="text"
          {...register('nombre')}
          aria-invalid={errors.nombre ? 'true' : 'false'}
          aria-describedby={errors.nombre ? 'nombre-error' : undefined}
          className={`
            w-full rounded-lg border px-4 py-2.5 text-gray-900 dark:text-white
            bg-white dark:bg-[#27272a]
            focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
            transition-colors
            ${errors.nombre ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-[#3f3f46]'}
          `}
          placeholder="Ingrese el nombre del pasajero"
        />
        {errors.nombre && (
          <p id="nombre-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {errors.nombre.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="colegio" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Colegio <span className="text-red-500">*</span>
        </label>
        <input
          id="colegio"
          type="text"
          {...register('colegio')}
          aria-invalid={errors.colegio ? 'true' : 'false'}
          aria-describedby={errors.colegio ? 'colegio-error' : undefined}
          className={`
            w-full rounded-lg border px-4 py-2.5 text-gray-900 dark:text-white
            bg-white dark:bg-[#27272a]
            focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
            transition-colors
            ${errors.colegio ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-[#3f3f46]'}
          `}
          placeholder="Ingrese el nombre del colegio"
        />
        {errors.colegio && (
          <p id="colegio-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {errors.colegio.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="gradoCurso" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Grado/Curso <span className="text-red-500">*</span>
        </label>
        <input
          id="gradoCurso"
          type="text"
          {...register('gradoCurso')}
          aria-invalid={errors.gradoCurso ? 'true' : 'false'}
          aria-describedby={errors.gradoCurso ? 'gradoCurso-error' : undefined}
          className={`
            w-full rounded-lg border px-4 py-2.5 text-gray-900 dark:text-white
            bg-white dark:bg-[#27272a]
            focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
            transition-colors
            ${errors.gradoCurso ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-[#3f3f46]'}
          `}
          placeholder="Ej: 5to A, 1er año, etc."
        />
        {errors.gradoCurso && (
          <p id="gradoCurso-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {errors.gradoCurso.message}
          </p>
        )}
      </div>
    </section>
  );
};
