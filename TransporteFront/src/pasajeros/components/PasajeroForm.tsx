import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createPasajeroSchema, type CreatePasajeroFormData } from '../schemas/pasajero.schema';
import { useAgregarHorarioPasajero, useCreatePasajero } from '../services/pasajeros.queries';
import { useTitularesActivos } from '../../titulares/services/titulares.queries';
import { Button } from '../../shared/ui';
import { useToast } from '../../shared/hooks';
import { TitularCombobox } from './TitularCombobox';
import { useHorariosOptions } from '../../horarios/services/horarios.queries';
import { inferirTurnoDesdeEtiqueta } from '../helpers/horario.helpers';

interface PasajeroFormProps {
  initialTitularId?: number;
  titularApellido?: string;
}

export const PasajeroForm = ({ initialTitularId, titularApellido }: PasajeroFormProps) => {
  const navigate = useNavigate();
  const createPasajero = useCreatePasajero();
  const agregarHorarioPasajero = useAgregarHorarioPasajero();
  const { showSuccess, showError } = useToast();
  const { data: titulares, isLoading: isLoadingTitulares } = useTitularesActivos();
  const { options: horariosOptions, isLoading: isLoadingHorarios } = useHorariosOptions();
  const [titularId, setTitularId] = useState(initialTitularId ?? 0);
  const [horariosSeleccionados, setHorariosSeleccionados] = useState<number[]>([]);
  const [principalHorarioId, setPrincipalHorarioId] = useState<number | null>(null);
  const [horarioToAdd, setHorarioToAdd] = useState<number | ''>('');
  const [isAssigningHorarios, setIsAssigningHorarios] = useState(false);

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
    getValues,
    formState: { errors, isSubmitting },
  } = form;
  const selectedTitular = titularId > 0 ? titulares?.find((t) => t.id === titularId) : undefined;

  const selectedHorarioObjects = horariosSeleccionados
    .map((horarioId) => horariosOptions.find((option) => option.value === horarioId))
    .filter((option): option is { value: number; label: string } => Boolean(option));

  const syncTurnoDesdeHorario = (horarioId: number | null) => {
    if (!horarioId) return;
    const etiqueta = horariosOptions.find((option) => option.value === horarioId)?.label;
    const turnoInferido = inferirTurnoDesdeEtiqueta(etiqueta, getValues('turno'));
    setValue('turno', turnoInferido, { shouldDirty: true });
  };

  const handleAgregarHorarioSeleccionado = () => {
    if (typeof horarioToAdd !== 'number') return;
    setHorariosSeleccionados((prev) => [...prev, horarioToAdd]);
    if (!principalHorarioId) {
      setPrincipalHorarioId(horarioToAdd);
      syncTurnoDesdeHorario(horarioToAdd);
    }
    setHorarioToAdd('');
  };

  const handleEliminarHorarioSeleccionado = (horarioId: number) => {
    setHorariosSeleccionados((prev) => {
      const next = prev.filter((id) => id !== horarioId);
      if (principalHorarioId === horarioId) {
        const siguientePrincipal = next[0] ?? null;
        setPrincipalHorarioId(siguientePrincipal ?? null);
        if (siguientePrincipal) {
          syncTurnoDesdeHorario(siguientePrincipal);
        }
      }
      return next;
    });
  };

  const handleSeleccionarPrincipal = (horarioId: number) => {
    setPrincipalHorarioId(horarioId);
    syncTurnoDesdeHorario(horarioId);
  };

  const selectableHorarios = horariosOptions.filter((option) => !horariosSeleccionados.includes(option.value));
  const canAddHorario = typeof horarioToAdd === 'number' && !horariosSeleccionados.includes(horarioToAdd);
  const isSaving = isSubmitting || createPasajero.isPending || isAssigningHorarios;

  const handleTitularChange = (value: number) => {
    setTitularId(value);
    setValue('titularId', value, { shouldValidate: true });
  };

  const onSubmit = async (data: CreatePasajeroFormData) => {
    try {
      const payload = {
        ...data,
        observaciones: data.observaciones?.trim() || undefined,
      };

      const nuevoPasajero = await createPasajero.mutateAsync(payload);
      let assignmentsFailed = false;

      if (horariosSeleccionados.length) {
        setIsAssigningHorarios(true);
        try {
          for (let index = 0; index < horariosSeleccionados.length; index += 1) {
            const horarioId = horariosSeleccionados[index];
            await agregarHorarioPasajero.mutateAsync({
              pasajeroId: nuevoPasajero.id,
              horarioId,
              esPrincipal: horarioId === principalHorarioId,
              prioridad: index + 1,
            });
          }
        } catch {
          assignmentsFailed = true;
        } finally {
          setIsAssigningHorarios(false);
        }
      }

      if (assignmentsFailed) {
        showError('El pasajero se registró pero no pudimos asignar todos los horarios. Revisalo luego desde su ficha.');
      } else {
        showSuccess('¡Pasajero registrado exitosamente!');
      }
      navigate('/pasajeros');
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Error al registrar el pasajero';
      showError(errorMessage);
    } finally {
      setIsAssigningHorarios(false);
    }
  };

  const handleCancel = () => {
    navigate('/pasajeros');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register('turno')} />
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
            disabled={isSaving}
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

      {/* Horarios del pasajero */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Horarios del pasajero
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">Agrega uno o varios horarios y marca cuál será el principal.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={horarioToAdd === '' ? '' : horarioToAdd}
            onChange={(event) => {
              const rawValue = event.target.value;
              setHorarioToAdd(rawValue ? Number(rawValue) : '');
            }}
            disabled={isSaving || isLoadingHorarios || !selectableHorarios.length}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007a8a] dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white"
          >
            <option value="">{selectableHorarios.length ? 'Seleccioná un horario' : 'No hay más horarios disponibles'}</option>
            {selectableHorarios.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            onClick={handleAgregarHorarioSeleccionado}
            disabled={!canAddHorario || isSaving || isLoadingHorarios}
            className="w-full sm:w-auto"
          >
            Agregar horario
          </Button>
        </div>
        <div className="rounded-2xl border border-dashed border-gray-200 p-4 dark:border-white/10">
          {selectedHorarioObjects.length ? (
            <div className="space-y-3">
              {selectedHorarioObjects.map((horario) => (
                <div
                  key={horario.value}
                  className={`flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm transition dark:border-white/10 sm:flex-row sm:items-center sm:justify-between ${
                    horario.value === principalHorarioId ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-900/10' : 'border-gray-200'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white" title={horario.label}>
                      {horario.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {horario.value === principalHorarioId ? 'Horario principal' : 'Horario secundario'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSeleccionarPrincipal(horario.value)}
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        horario.value === principalHorarioId
                          ? 'border-emerald-400 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100'
                          : 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600 dark:border-white/10 dark:text-gray-400'
                      }`}
                      disabled={horario.value === principalHorarioId}
                    >
                      Principal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarHorarioSeleccionado(horario.value)}
                      className="inline-flex items-center rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-800/50 dark:text-red-300 dark:hover:bg-red-900/30"
                      disabled={isAssigningHorarios}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Sin horarios asignados. Podés agregarlos ahora o desde el módulo de Horarios.</p>
          )}
        </div>
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
          disabled={isSaving}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSaving || isLoadingTitulares}
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
              Guardar Pasajero
            </span>
          )}
        </Button>
      </div>
    </form>
  );
};
