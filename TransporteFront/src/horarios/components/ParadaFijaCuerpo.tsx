import { useState } from 'react';
import { useToast } from '../../shared/hooks/useToast';
import { useAsignarParadaFija, useEliminarParadaFija } from '../../recorridos/services/recorridos.queries';
import { getParadaFijaErrorMessage, type TitularDelViaje } from '../helpers/parada-fija.helpers';
import { ParadaFijaEditor } from './ParadaFijaEditor';
import { ParadaFijaResumen } from './ParadaFijaResumen';
import type { ParadaFijaResponse } from '../../recorridos/types/recorrido.types';
import type { TransporteTipo } from '../../shared/types/transporte.types';

interface ParadaFijaCuerpoProps {
  horarioId: number;
  transporte: TransporteTipo;
  titularesDelViaje: TitularDelViaje[];
  paradaFijaActual: ParadaFijaResponse | undefined;
}

/** Estados con datos: sin pasajeros, sin pines, o el selector (marcada / para marcar). */
export const ParadaFijaCuerpo = ({
  horarioId,
  transporte,
  titularesDelViaje,
  paradaFijaActual,
}: ParadaFijaCuerpoProps) => {
  const { showSuccess, showError } = useToast();
  const [editando, setEditando] = useState(false);
  const [titularSeleccionado, setTitularSeleccionado] = useState<number | ''>('');
  const asignar = useAsignarParadaFija();
  const eliminar = useEliminarParadaFija();

  if (titularesDelViaje.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-white/60 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300">
        No hay pasajeros asignados a este vehículo en este horario. Asigná pasajeros antes de marcar la casa
        fija.
      </p>
    );
  }

  const titularesConUbicacion = titularesDelViaje.filter((titular) => titular.tieneUbicacion);
  if (titularesConUbicacion.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-white/60 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300">
        Ninguna de las familias de este viaje tiene el pin cargado todavía. Cargá la ubicación desde la ficha
        del titular para poder marcar la casa fija.
      </p>
    );
  }

  const iniciarEdicion = () => {
    setTitularSeleccionado(
      paradaFijaActual && paradaFijaActual.sigueViajando ? paradaFijaActual.titularId : '',
    );
    setEditando(true);
  };

  const handleGuardar = async () => {
    if (!titularSeleccionado) {
      return;
    }

    try {
      await asignar.mutateAsync({ horarioId, transporte, data: { titularId: titularSeleccionado } });
      showSuccess('Casa fija actualizada');
      setEditando(false);
    } catch (error) {
      showError(getParadaFijaErrorMessage(error));
    }
  };

  const handleQuitar = async () => {
    try {
      await eliminar.mutateAsync({ horarioId, transporte });
      showSuccess('Casa fija eliminada');
    } catch (error) {
      showError(getParadaFijaErrorMessage(error));
    }
  };

  if (editando) {
    return (
      <ParadaFijaEditor
        titularesDelViaje={titularesDelViaje}
        titularSeleccionado={titularSeleccionado}
        onSeleccionarTitular={setTitularSeleccionado}
        onGuardar={handleGuardar}
        onCancelar={() => setEditando(false)}
        isSaving={asignar.isPending}
      />
    );
  }

  return (
    <ParadaFijaResumen
      paradaFijaActual={paradaFijaActual}
      onIniciarEdicion={iniciarEdicion}
      onQuitar={handleQuitar}
      isQuitando={eliminar.isPending}
    />
  );
};
