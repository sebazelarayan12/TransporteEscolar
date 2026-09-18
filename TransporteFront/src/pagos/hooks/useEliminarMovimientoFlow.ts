import { useState } from 'react';
import { useEliminarMovimiento } from '../services/pagos.queries';
import { useToast } from '../../shared/hooks/useToast';
import { getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';
import type { MovimientoEliminarResumen } from '../components/EliminarMovimientoDialog';
import type { MovimientoHistorial } from '../types/movimientos.types';

const buildResumen = (movimiento: MovimientoHistorial): MovimientoEliminarResumen => ({
  monto: movimiento.monto,
  medioPago: movimiento.medioPago,
  fechaPago: movimiento.fechaPago,
  periodo: movimiento.periodo,
  titularLabel: getTitularApellidoDisplay(
    movimiento.titularApellido,
    movimiento.titularNombreCompleto ?? movimiento.titularNombre,
  ),
  observaciones: movimiento.observaciones,
});

/**
 * Flujo de confirmación y eliminación de un movimiento del historial.
 */
export const useEliminarMovimientoFlow = () => {
  const [seleccionado, setSeleccionado] = useState<MovimientoHistorial | null>(null);
  const eliminar = useEliminarMovimiento();
  const { showSuccess, showError } = useToast();

  const open = (movimiento: MovimientoHistorial) => {
    if (!eliminar.isPending) setSeleccionado(movimiento);
  };

  const cancel = () => {
    if (!eliminar.isPending) setSeleccionado(null);
  };

  const confirm = async () => {
    if (!seleccionado) return;

    try {
      await eliminar.mutateAsync({ pagoMensualId: seleccionado.pagoMensualId, movimientoId: seleccionado.id });
      showSuccess('Movimiento eliminado correctamente');
      setSeleccionado(null);
    } catch (mutationError) {
      console.error(mutationError);
      showError('No pudimos eliminar el movimiento. Intentalo nuevamente.');
    }
  };

  return {
    seleccionadoId: seleccionado?.id ?? null,
    resumen: seleccionado ? buildResumen(seleccionado) : null,
    isProcessing: eliminar.isPending,
    open,
    cancel,
    confirm,
  };
};
