import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createPasajeroSchema, TURNO_OPTIONS, type CreatePasajeroFormData } from '../schemas/pasajero.schema';
import { useCreatePasajero } from '../services/pasajeros.queries';
import { useTitularesActivos } from '../../titulares/services/titulares.queries';
import { Button } from '../../shared/ui';
import { useToast } from '../../shared/hooks';
import { TitularCombobox } from './TitularCombobox';

interface PasajeroFormProps {
  initialTitularId?: number;
  titularApellido?: string;
}

export const PasajeroForm = ({ initialTitularId, titularApellido }: PasajeroFormProps) => {
  const navigate = useNavigate();
  const createPasajero = useCreatePasajero();
  const { showSuccess, showError } = useToast();
  const { data: titulares, isLoading: isLoadingTitulares } = useTitularesActivos();
  const [titularId, setTitularId] = useState(initialTitularId ?? 0);

  const form = useForm<CreatePasajeroFormData>({
    resolver: zodResolver(createPasajeroSchema),
    defaultValues: {
      titularId: initialTitularId ?? 0,
      nombre: '',
      colegio: '',
      gradoCurso: '',
      turno: 'Mañana',
      observaciones: '',
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = form;
  const selectedTitular = titularId > 0 ? titulares?.find((t) => t.id === titularId) : undefined;

  const handleTitularChange = (value: number) => {
    setTitularId(value);
    setValue('titularId', value, { shouldValidate: true });
  };

  const onSubmit = async (data: CreatePasajeroFormData) => {
    try {
      // Limpiar observaciones vacías
      const payload = {
        ...data,
        observaciones: data.observaciones?.trim() || undefined,
      };
      await createPasajero.mutateAsync(payload);
      showSuccess('¡Pasajero registrado exitosamente!');
      navigate('/pasajeros');
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Error al registrar el pasajero';
      showError(errorMessage);
    }
  };

  const handleCancel = () => {
    navigate('/pasajeros');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Campo Titular (Combobox con búsqueda) */}
      <div>
        <label
          htmlFor="titularId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Titular <span className="text-red-500">*</span>
        </label>
        {isLoadingTitulares ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#007a8a]"></span>
            Cargando titulares...
          </div>
        ) : (
          <TitularCombobox
            titulares={titulares || []}
            value={titularId || 0}
            onChange={handleTitularChange}
            error={errors.titularId?.message}
            disabled={isSubmitting}
            initialSearchTerm={titularApellido}
          />
        )}
        {errors.titularId && (
          <p id="titularId-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {errors.titularId.message}
          </p>
        )}
      </div>

      {/* Campo Dirección del Titular (read-only, aparece automáticamente) */}
      {titularId > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
            Dirección del Titular
          </label>
          <p className="text-sm text-blue-900 dark:text-blue-100">
            {selectedTitular?.direccion || 'No disponible'}
          </p>
        </div>
      )}

      {/* Campo Nombre */}
      <div>
        <label
          htmlFor="nombre"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Nombre del Pasajero <span className="text-red-500">*</span>
        </label>
        <input
          id="nombre"
          type="text"
          {...register('nombre')}
          aria-invalid={errors.nombre ? 'true' : 'false'}
          aria-describedby={errors.nombre ? 'nombre-error' : undefined}
          className={`
            w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white
            bg-white dark:bg-[#27272a]
            focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
            transition-colors
            ${
              errors.nombre
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-[#3f3f46]'
            }
          `}
          placeholder="Ingrese el nombre del pasajero"
        />
        {errors.nombre && (
          <p id="nombre-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {errors.nombre.message}
          </p>
        )}
      </div>

      {/* Campo Colegio */}
      <div>
        <label
          htmlFor="colegio"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Colegio <span className="text-red-500">*</span>
        </label>
        <input
          id="colegio"
          type="text"
          {...register('colegio')}
          aria-invalid={errors.colegio ? 'true' : 'false'}
          aria-describedby={errors.colegio ? 'colegio-error' : undefined}
          className={`
            w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white
            bg-white dark:bg-[#27272a]
            focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
            transition-colors
            ${
              errors.colegio
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-[#3f3f46]'
            }
          `}
          placeholder="Ingrese el nombre del colegio"
        />
        {errors.colegio && (
          <p id="colegio-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {errors.colegio.message}
          </p>
        )}
      </div>

      {/* Campo Grado/Curso */}
      <div>
        <label
          htmlFor="gradoCurso"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Grado/Curso <span className="text-red-500">*</span>
        </label>
        <input
          id="gradoCurso"
          type="text"
          {...register('gradoCurso')}
          aria-invalid={errors.gradoCurso ? 'true' : 'false'}
          aria-describedby={errors.gradoCurso ? 'gradoCurso-error' : undefined}
          className={`
            w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white
            bg-white dark:bg-[#27272a]
            focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
            transition-colors
            ${
              errors.gradoCurso
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-[#3f3f46]'
            }
          `}
          placeholder="Ej: 5to A, 1er año, etc."
        />
        {errors.gradoCurso && (
          <p id="gradoCurso-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {errors.gradoCurso.message}
          </p>
        )}
      </div>

      {/* Campo Turno (SELECT) */}
      <div>
        <label
          htmlFor="turno"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Turno <span className="text-red-500">*</span>
        </label>
        <select
          id="turno"
          {...register('turno')}
          aria-invalid={errors.turno ? 'true' : 'false'}
          aria-describedby={errors.turno ? 'turno-error' : undefined}
          className={`
            w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white
            bg-white dark:bg-[#27272a]
            focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
            transition-colors
            ${
              errors.turno
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-[#3f3f46]'
            }
          `}
        >
          {TURNO_OPTIONS.map((turno) => (
            <option key={turno} value={turno}>
              {turno}
            </option>
          ))}
        </select>
        {errors.turno && (
          <p id="turno-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {errors.turno.message}
          </p>
        )}
      </div>

      {/* Campo Observaciones (TEXTAREA) */}
      <div>
        <label
          htmlFor="observaciones"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Observaciones <span className="text-gray-500 text-xs">(opcional)</span>
        </label>
        <textarea
          id="observaciones"
          rows={4}
          {...register('observaciones')}
          aria-invalid={errors.observaciones ? 'true' : 'false'}
          aria-describedby={errors.observaciones ? 'observaciones-error' : undefined}
          className={`
            w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white
            bg-white dark:bg-[#27272a]
            focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
            transition-colors resize-y
            ${
              errors.observaciones
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-[#3f3f46]'
            }
          `}
          placeholder="Ingrese observaciones adicionales si es necesario (alergias, necesidades especiales, etc.)"
        />
        {errors.observaciones && (
          <p id="observaciones-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {errors.observaciones.message}
          </p>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSubmitting || createPasajero.isPending}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || createPasajero.isPending || isLoadingTitulares}
          className="w-full sm:flex-1 sm:order-2 bg-[#007a8a] hover:bg-[#00626e] text-white disabled:bg-gray-400 disabled:hover:bg-gray-400"
        >
          {isSubmitting || createPasajero.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Guardando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[20px]">save</span>
              Guardar Pasajero
            </span>
          )}
        </Button>
      </div>
    </form>
  );
};
