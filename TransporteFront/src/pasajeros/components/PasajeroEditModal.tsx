import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updatePasajeroSchema, type UpdatePasajeroFormData } from '../schemas/pasajero.schema';
import type { PasajeroResponse } from '../types/pasajero.types';
import { Modal } from '../../shared/ui/Modal';
import { Button } from '../../shared/ui/Button';
import { useHorariosOptions } from '../../horarios/services/horarios.queries';
import { inferirTurnoDesdeEtiqueta } from '../helpers/horario.helpers';

interface PasajeroEditModalProps {
  pasajero: PasajeroResponse;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdatePasajeroFormData) => Promise<void>;
  isSaving: boolean;
}

export const PasajeroEditModal = ({ 
  pasajero, 
  isOpen, 
  onClose, 
  onSave, 
  isSaving 
}: PasajeroEditModalProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    getValues,
    formState: { errors, isDirty },
  } = useForm<UpdatePasajeroFormData>({
    resolver: zodResolver(updatePasajeroSchema),
    defaultValues: {
      nombre: pasajero.nombre,
      colegio: pasajero.colegio,
      gradoCurso: pasajero.gradoCurso,
      turno: pasajero.turno,
      observaciones: pasajero.observaciones || '',
      horarioId: pasajero.horarioId ?? null,
    },
  });

  const { options: horariosOptions, isLoading: isLoadingHorarios } = useHorariosOptions();

  const onSubmit = async (data: UpdatePasajeroFormData) => {
    await onSave(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Pasajero" maxWidth="lg">
      {/* Loading Overlay */}
      {isSaving && (
        <div className="absolute inset-0 bg-white/80 dark:bg-[#27272a]/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007a8a]" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Guardando cambios...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register('turno')} />
        {/* Campo Apellido (read-only - heredado del titular) */}
        <div>
          <label
            htmlFor="apellido"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Apellido
          </label>
          <div className="px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-[#18181b] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#3f3f46]">
            {pasajero.apellido}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            El apellido se hereda del titular y no se puede modificar
          </p>
        </div>

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
            disabled={isSaving}
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
            disabled={isSaving}
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
            disabled={isSaving}
          />
          {errors.gradoCurso && (
            <p id="gradoCurso-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.gradoCurso.message}
            </p>
          )}
        </div>

        {/* Campo Horario */}
        <div>
          <label
            htmlFor="horarioId"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Horario asignado
          </label>
          <Controller
            control={control}
            name="horarioId"
            render={({ field }) => (
              <select
                id="horarioId"
                value={field.value ?? ''}
                onChange={(event) => {
                  const rawValue = event.target.value;
                  const parsedValue = rawValue ? Number(rawValue) : null;
                  field.onChange(parsedValue);
                  const etiqueta = horariosOptions.find((option) => option.value === parsedValue)?.label;
                  const turnoInferido = inferirTurnoDesdeEtiqueta(etiqueta, getValues('turno'));
                  setValue('turno', turnoInferido, { shouldDirty: true });
                }}
                disabled={isSaving || isLoadingHorarios}
                className={`w-full rounded-lg border px-4 py-2.5 text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-[#007a8a] dark:bg-[#27272a] dark:text-white ${
                  errors.horarioId
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-[#3f3f46]'
                }`}
              >
                <option value="">Sin horario asignado</option>
                {horariosOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.horarioId && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.horarioId.message as string}</p>
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
            disabled={isSaving}
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
