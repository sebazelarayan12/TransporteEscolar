import { useReducer, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createPasajeroSchema, type CreatePasajeroFormData } from '../schemas/pasajero.schema';
import { useAgregarHorarioPasajero, useCreatePasajero } from '../services/pasajeros.queries';
import { useTitularesActivos } from '../../titulares/services/titulares.queries';
import { useToast } from '../../shared/hooks';
import { useHorariosOptions } from '../../horarios/services/horarios.queries';
import { inferirTurnoDesdeEtiqueta, getHorarioEtiquetaDisplay } from '../helpers/horario.helpers';
import { PasajeroTitularSection } from './PasajeroTitularSection';
import { PasajeroDatosPersonalesSection } from './PasajeroDatosPersonalesSection';
import { PasajeroHorariosSection } from './PasajeroHorariosSection';
import { PasajeroObservacionesField } from './PasajeroObservacionesField';
import { PasajeroFormActions } from './PasajeroFormActions';

interface PasajeroFormProps {
  initialTitularId?: number;
  titularApellido?: string;
}

type HorarioToAddState = number | '';

interface PasajeroFormState {
  titularId: number;
  horariosSeleccionados: number[];
  principalHorarioId: number | null;
  horarioToAdd: HorarioToAddState;
  isAssigningHorarios: boolean;
}

type PasajeroFormAction =
  | { type: 'setTitularId'; value: number }
  | { type: 'setHorarioToAdd'; value: HorarioToAddState }
  | { type: 'addHorario'; horarioId: number; setAsPrincipal: boolean }
  | { type: 'removeHorario'; horarioId: number }
  | { type: 'setPrincipalHorarioId'; value: number | null }
  | { type: 'setIsAssigningHorarios'; value: boolean };

const pasajeroFormInitialState: PasajeroFormState = {
  titularId: 0,
  horariosSeleccionados: [],
  principalHorarioId: null,
  horarioToAdd: '',
  isAssigningHorarios: false,
};

const initPasajeroFormState = (initialTitularId: number): PasajeroFormState => ({
  ...pasajeroFormInitialState,
  titularId: initialTitularId,
});

const pasajeroFormReducer = (state: PasajeroFormState, action: PasajeroFormAction): PasajeroFormState => {
  switch (action.type) {
    case 'setTitularId':
      return { ...state, titularId: action.value };
    case 'setHorarioToAdd':
      return { ...state, horarioToAdd: action.value };
    case 'addHorario': {
      if (state.horariosSeleccionados.includes(action.horarioId)) {
        return state;
      }
      return {
        ...state,
        horariosSeleccionados: [...state.horariosSeleccionados, action.horarioId],
        principalHorarioId: action.setAsPrincipal ? action.horarioId : state.principalHorarioId,
      };
    }
    case 'removeHorario': {
      const nextHorarios = state.horariosSeleccionados.filter((id) => id !== action.horarioId);
      const nextPrincipal =
        state.principalHorarioId === action.horarioId ? nextHorarios[0] ?? null : state.principalHorarioId;
      return {
        ...state,
        horariosSeleccionados: nextHorarios,
        principalHorarioId: nextPrincipal,
      };
    }
    case 'setPrincipalHorarioId':
      return { ...state, principalHorarioId: action.value };
    case 'setIsAssigningHorarios':
      return { ...state, isAssigningHorarios: action.value };
    default:
      return state;
  }
};

export const PasajeroForm = ({ initialTitularId, titularApellido }: PasajeroFormProps) => {
  const navigate = useNavigate();
  const createPasajero = useCreatePasajero();
  const agregarHorarioPasajero = useAgregarHorarioPasajero();
  const { showSuccess, showError } = useToast();
  const { data: titulares, isLoading: isLoadingTitulares } = useTitularesActivos();
  const { options: horariosOptions, isLoading: isLoadingHorarios } = useHorariosOptions();
  const [state, dispatch] = useReducer(pasajeroFormReducer, initialTitularId ?? 0, initPasajeroFormState);
  const { titularId, horariosSeleccionados, principalHorarioId, horarioToAdd, isAssigningHorarios } = state;
  const titularInputId = useId();
  const titularDireccionFieldId = useId();
  const horarioSelectId = useId();
  const horarioHintId = `${horarioSelectId}-hint`;
  const titularErrorId = `${titularInputId}-error`;

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
    .filter((option): option is { value: number; label: string } => Boolean(option))
    .map((option) => ({ ...option, label: getHorarioEtiquetaDisplay(option.label) }));

  const syncTurnoDesdeHorario = (horarioId: number | null) => {
    if (!horarioId) return;
    const etiqueta = horariosOptions.find((option) => option.value === horarioId)?.label;
    const turnoInferido = inferirTurnoDesdeEtiqueta(etiqueta, getValues('turno'));
    setValue('turno', turnoInferido, { shouldDirty: true });
  };

  const handleAgregarHorarioSeleccionado = () => {
    if (typeof horarioToAdd !== 'number') return;
    const shouldSetPrincipal = !principalHorarioId;
    dispatch({ type: 'addHorario', horarioId: horarioToAdd, setAsPrincipal: shouldSetPrincipal });
    if (shouldSetPrincipal) {
      syncTurnoDesdeHorario(horarioToAdd);
    }
    dispatch({ type: 'setHorarioToAdd', value: '' });
  };

  const handleEliminarHorarioSeleccionado = (horarioId: number) => {
    const nextHorarios = horariosSeleccionados.filter((id) => id !== horarioId);
    const siguientePrincipal = principalHorarioId === horarioId ? nextHorarios[0] ?? null : principalHorarioId;
    dispatch({ type: 'removeHorario', horarioId });
    if (siguientePrincipal && siguientePrincipal !== principalHorarioId) {
      syncTurnoDesdeHorario(siguientePrincipal);
    }
  };

  const handleSeleccionarPrincipal = (horarioId: number) => {
    if (horarioId === principalHorarioId) return;
    dispatch({ type: 'setPrincipalHorarioId', value: horarioId });
    syncTurnoDesdeHorario(horarioId);
  };

  const selectableHorarios = horariosOptions.filter((option) => !horariosSeleccionados.includes(option.value));
  const canAddHorario = typeof horarioToAdd === 'number' && !horariosSeleccionados.includes(horarioToAdd);
  const isSaving = isSubmitting || createPasajero.isPending || isAssigningHorarios;

  const handleTitularChange = (value: number) => {
    dispatch({ type: 'setTitularId', value });
    setValue('titularId', value, { shouldValidate: true });
  };

  const handleHorarioToAddChange = (value: HorarioToAddState) => {
    dispatch({ type: 'setHorarioToAdd', value });
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
        dispatch({ type: 'setIsAssigningHorarios', value: true });
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
          dispatch({ type: 'setIsAssigningHorarios', value: false });
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
      dispatch({ type: 'setIsAssigningHorarios', value: false });
    }
  };

  const handleCancel = () => {
    navigate('/pasajeros');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register('turno')} />

      <PasajeroTitularSection
        titulares={titulares}
        titularId={titularId}
        titularInputId={titularInputId}
        titularErrorId={titularErrorId}
        titularDireccionFieldId={titularDireccionFieldId}
        isLoadingTitulares={isLoadingTitulares}
        isSaving={isSaving}
        error={errors.titularId}
        initialSearchTerm={titularApellido}
        selectedTitular={selectedTitular}
        onTitularChange={handleTitularChange}
      />

      <PasajeroDatosPersonalesSection register={register} errors={errors} />

      <PasajeroHorariosSection
        horarioSelectId={horarioSelectId}
        horarioHintId={horarioHintId}
        horarioToAdd={horarioToAdd}
        selectableHorarios={selectableHorarios}
        selectedHorarios={selectedHorarioObjects}
        principalHorarioId={principalHorarioId}
        canAddHorario={canAddHorario}
        isSaving={isSaving}
        isLoadingHorarios={isLoadingHorarios}
        isAssigningHorarios={isAssigningHorarios}
        onHorarioChange={handleHorarioToAddChange}
        onAgregarHorario={handleAgregarHorarioSeleccionado}
        onSeleccionarPrincipal={handleSeleccionarPrincipal}
        onEliminarHorario={handleEliminarHorarioSeleccionado}
      />

      <PasajeroObservacionesField register={register} errors={errors} />

      <PasajeroFormActions
        isSaving={isSaving}
        isLoadingTitulares={isLoadingTitulares}
        onCancel={handleCancel}
      />
    </form>
  );
};
