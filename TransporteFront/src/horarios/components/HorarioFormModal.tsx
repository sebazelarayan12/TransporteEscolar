import { useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../shared/ui/Modal';
import { FormField } from '../../shared/ui/FormField';
import { FormActions } from '../../shared/ui/FormActions';
import { SavingOverlay } from '../../shared/ui/SavingOverlay';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { Button } from '../../shared/ui';
import { fieldAriaProps, fieldInputClass } from '../../shared/utils/form-field.helpers';
import { useColegios } from '../../recorridos/services/recorridos.queries';
import { dividirEtiqueta, armarEtiqueta } from '../helpers/etiqueta.helpers';
import {
  horarioCrearFormSchema,
  horarioFormSchema,
  type HorarioCrearFormData,
  type HorarioFormInput,
} from '../schemas/horario.schema';
import { SENTIDOS_HORARIO } from '../types/horario.types';
import type { HorarioActualizarRequest, HorarioCrearRequest, HorarioResponse } from '../types/horario.types';

interface HorarioFormModalProps {
  isOpen: boolean;
  /** Horario que se edita. Con null el modal crea uno nuevo. */
  horario: HorarioResponse | null;
  onClose: () => void;
  onSave: (data: HorarioActualizarRequest | HorarioCrearRequest) => Promise<void>;
  /** Solo al editar: baja lógica del horario. */
  onDesactivar?: () => Promise<void>;
  isSaving: boolean;
}

const SENTIDO_OPCIONES = [
  { value: SENTIDOS_HORARIO.IDA, label: 'Entrada al colegio (Ida)' },
  { value: SENTIDOS_HORARIO.VUELTA, label: 'Salida del colegio (Vuelta)' },
] as const;

const contarPasajeros = (cantidad: number) => (cantidad === 1 ? '1 pasajero' : `${cantidad} pasajeros`);

const getDefaultValues = (horario: HorarioResponse | null): HorarioFormInput => {
  if (!horario) {
    return { hora: '', descripcion: '', colegioId: 0, sentido: SENTIDOS_HORARIO.IDA, orden: '' };
  }

  return {
    ...dividirEtiqueta(horario.etiqueta),
    colegioId: horario.colegioId ?? 0,
    sentido: horario.sentido,
    orden: horario.orden,
  };
};

export const HorarioFormModal = ({ isOpen, horario, onClose, onSave, onDesactivar, isSaving }: HorarioFormModalProps) => {
  const [isDesactivarOpen, setDesactivarOpen] = useState(false);
  const [isDesactivando, setDesactivando] = useState(false);
  const { data: colegios = [], isLoading: isLoadingColegios } = useColegios();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<HorarioFormInput, unknown, HorarioCrearFormData>({
    // Al editar el orden es obligatorio; al crear puede quedar vacío (null = al final).
    resolver: zodResolver(horario ? horarioFormSchema : horarioCrearFormSchema) as Resolver<
      HorarioFormInput,
      unknown,
      HorarioCrearFormData
    >,
    defaultValues: getDefaultValues(horario),
  });

  const [hora = '', descripcion = ''] = useWatch({ control, name: ['hora', 'descripcion'] });

  const pasajerosActivos = horario?.pasajerosActivos ?? 0;
  const tienePasajeros = pasajerosActivos > 0;
  const busy = isSaving || isDesactivando;
  // Un horario ya inactivo no se vuelve a desactivar: solo se puede reactivar desde la grilla.
  const puedeDesactivar = Boolean(horario?.activo && onDesactivar);

  const onSubmit = (datos: HorarioCrearFormData) =>
    onSave({
      etiqueta: armarEtiqueta(datos.hora, datos.descripcion),
      orden: datos.orden,
      colegioId: datos.colegioId,
      sentido: datos.sentido,
    });

  const confirmarDesactivar = async () => {
    if (!onDesactivar) return;

    setDesactivando(true);
    try {
      await onDesactivar();
    } finally {
      setDesactivando(false);
      setDesactivarOpen(false);
    }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={horario ? 'Editar horario' : 'Nuevo horario'} maxWidth="lg">
      {busy && <SavingOverlay />}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <FormField id="hora" label="Hora" required error={errors.hora?.message}>
            <input
              id="hora"
              type="text"
              {...register('hora')}
              {...fieldAriaProps('hora', errors.hora?.message)}
              className={fieldInputClass(Boolean(errors.hora))}
              placeholder="8 o 13:30"
              disabled={busy}
            />
          </FormField>

          <FormField id="descripcion" label="Descripción" required error={errors.descripcion?.message}>
            <input
              id="descripcion"
              type="text"
              {...register('descripcion')}
              {...fieldAriaProps('descripcion', errors.descripcion?.message)}
              className={fieldInputClass(Boolean(errors.descripcion))}
              placeholder="San Patricio"
              disabled={busy}
            />
          </FormField>
        </div>

        <p className="-mt-3 text-sm text-gray-500 dark:text-gray-400">
          Se guardará como: <strong className="text-gray-800 dark:text-gray-100">{armarEtiqueta(hora, descripcion)}</strong>
        </p>

        {tienePasajeros && (
          <p role="note" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
            Este horario tiene {contarPasajeros(pasajerosActivos)} {pasajerosActivos === 1 ? 'activo' : 'activos'}: no se puede cambiar el colegio ni el sentido.
            Reasignalos a otro horario o creá uno nuevo.
          </p>
        )}

        <FormField id="colegioId" label="Colegio" required error={errors.colegioId?.message}>
          <select
            id="colegioId"
            {...register('colegioId')}
            {...fieldAriaProps('colegioId', errors.colegioId?.message)}
            className={fieldInputClass(Boolean(errors.colegioId))}
            disabled={busy || tienePasajeros || isLoadingColegios}
          >
            <option value="0">Elegí un colegio</option>
            {colegios.map((colegio) => (
              <option key={colegio.id} value={colegio.id}>
                {colegio.nombre}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="sentido" label="Sentido" required error={errors.sentido?.message}>
          <select
            id="sentido"
            {...register('sentido')}
            {...fieldAriaProps('sentido', errors.sentido?.message)}
            className={fieldInputClass(Boolean(errors.sentido))}
            disabled={busy || tienePasajeros}
          >
            {SENTIDO_OPCIONES.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="orden"
          label="Orden"
          required={Boolean(horario)}
          error={errors.orden?.message}
          hint={horario ? undefined : 'Dejalo vacío para ponerlo al final'}
        >
          <input
            id="orden"
            type="number"
            min={1}
            step={1}
            {...register('orden')}
            {...fieldAriaProps('orden', errors.orden?.message)}
            className={fieldInputClass(Boolean(errors.orden))}
            placeholder={horario ? undefined : 'Al final (automático)'}
            disabled={busy}
          />
        </FormField>

        <FormActions
          onCancel={onClose}
          isPending={isSaving}
          submitDisabled={isDesactivando || (horario ? !isDirty : false)}
          submitLabel={horario ? (isDirty ? 'Guardar Cambios' : 'Sin cambios') : 'Crear horario'}
        />
      </form>

      {puedeDesactivar && (
        <div className="mt-6 space-y-2 border-t border-gray-200 pt-4 dark:border-zinc-700">
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={busy || tienePasajeros}
            onClick={() => setDesactivarOpen(true)}
          >
            Desactivar horario
          </Button>
          {tienePasajeros && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Reasigná primero sus {contarPasajeros(pasajerosActivos)}
            </p>
          )}
        </div>
      )}
    </Modal>

      {puedeDesactivar && (
        <ConfirmDialog
          isOpen={isDesactivarOpen}
          title="Desactivar horario"
          message="El horario deja de mostrarse y de aceptar pasajeros. No se borra nada: podés reactivarlo cuando quieras."
          confirmLabel="Desactivar"
          destructive
          isProcessing={isDesactivando}
          onConfirm={confirmarDesactivar}
          onCancel={() => setDesactivarOpen(false)}
        />
      )}
    </>
  );
};
