import { useState } from 'react';
import { useToast } from '../../shared/hooks/useToast';
import {
  useActualizarHorario,
  useCrearHorario,
  useDesactivarHorario,
  useReactivarHorario,
} from '../services/horarios.queries';
import type { HorarioActualizarRequest, HorarioCrearRequest, HorarioResponse } from '../types/horario.types';

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
};

/**
 * Alta y edición de horarios: estado del modal (horario abierto o modo crear) y las mutaciones
 * (crear, guardar, desactivar, reactivar) con su feedback. Los errores del backend se muestran tal cual.
 */
export const useHorarioEdicion = () => {
  const [horarioEditando, setHorarioEditando] = useState<HorarioResponse | null>(null);
  const [creando, setCreando] = useState(false);
  // Cambia en cada apertura en modo crear: fuerza un formulario nuevo (vacío) cada vez.
  const [aperturasCreacion, setAperturasCreacion] = useState(0);
  const { showSuccess, showError } = useToast();
  const crearHorario = useCrearHorario();
  const actualizarHorario = useActualizarHorario();
  const desactivarHorario = useDesactivarHorario();
  const reactivarHorario = useReactivarHorario();

  const cerrarModal = () => {
    setHorarioEditando(null);
    setCreando(false);
  };

  const abrirCreacion = () => {
    setHorarioEditando(null);
    setAperturasCreacion((aperturas) => aperturas + 1);
    setCreando(true);
  };

  const abrirEdicion = (horario: HorarioResponse) => {
    setCreando(false);
    setHorarioEditando(horario);
  };

  const crear = async (data: HorarioCrearRequest) => {
    try {
      await crearHorario.mutateAsync(data);
      showSuccess('Horario creado');
      cerrarModal();
    } catch (error: unknown) {
      showError(resolveErrorMessage(error, 'No se pudo crear el horario'));
    }
  };

  const actualizar = async (horario: HorarioResponse, data: HorarioActualizarRequest) => {
    try {
      await actualizarHorario.mutateAsync({ id: horario.id, data });
      showSuccess('Horario actualizado');
      cerrarModal();
    } catch (error: unknown) {
      showError(resolveErrorMessage(error, 'No se pudo actualizar el horario'));
    }
  };

  /** Guarda lo que el modal tenga abierto: edita el horario elegido o, sin ninguno, crea uno nuevo. */
  const guardar = async (data: HorarioActualizarRequest | HorarioCrearRequest) => {
    if (horarioEditando) {
      await actualizar(horarioEditando, { ...data, orden: data.orden ?? horarioEditando.orden });
      return;
    }
    await crear(data);
  };

  const desactivar = async () => {
    if (!horarioEditando) return;

    try {
      await desactivarHorario.mutateAsync(horarioEditando.id);
      showSuccess('Horario desactivado');
      cerrarModal();
    } catch (error: unknown) {
      showError(resolveErrorMessage(error, 'No se pudo desactivar el horario'));
    }
  };

  const reactivar = async (horario: HorarioResponse) => {
    try {
      await reactivarHorario.mutateAsync(horario.id);
      showSuccess('Horario reactivado');
    } catch (error: unknown) {
      showError(resolveErrorMessage(error, 'No se pudo reactivar el horario'));
    }
  };

  return {
    horarioEditando,
    modalAbierto: creando || Boolean(horarioEditando),
    modalKey: horarioEditando ? `editar-${horarioEditando.id}` : `crear-${aperturasCreacion}`,
    abrirCreacion,
    abrirEdicion,
    cerrarModal,
    guardar,
    desactivar,
    reactivar,
    isSaving: crearHorario.isPending || actualizarHorario.isPending,
  };
};
