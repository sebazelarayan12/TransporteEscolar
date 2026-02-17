import { useState } from 'react';
import type { PagoMovimiento } from '../types/pago.types';
import { formatDateOnly } from '../../shared/utils/date.helpers';
import { Button } from '../../shared/ui';
import { useToast } from '../../shared/hooks';
import { useEliminarMovimiento } from '../services/pagos.queries';
import { EliminarMovimientoDialog } from './EliminarMovimientoDialog';

interface PaymentHistoryProps {
  movimientos: PagoMovimiento[];
  pagoId: number;
  titularLabel?: string;
  periodo?: string;
}

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
});

export const PaymentHistory = ({ movimientos, pagoId, titularLabel, periodo }: PaymentHistoryProps) => {
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<PagoMovimiento | null>(null);
  const { showSuccess, showError } = useToast();
  const eliminarMovimiento = useEliminarMovimiento();

  const handleOpenConfirm = (movimiento: PagoMovimiento) => {
    if (eliminarMovimiento.isPending) {
      return;
    }

    setMovimientoSeleccionado(movimiento);
  };

  const handleCloseConfirm = () => {
    if (eliminarMovimiento.isPending) {
      return;
    }

    setMovimientoSeleccionado(null);
  };

  const handleConfirmDelete = async () => {
    if (!movimientoSeleccionado) {
      return;
    }

    try {
      await eliminarMovimiento.mutateAsync({
        pagoMensualId: pagoId,
        movimientoId: movimientoSeleccionado.id,
      });
      showSuccess('Movimiento eliminado correctamente');
      setMovimientoSeleccionado(null);
    } catch (error) {
      console.error(error);
      showError('No pudimos eliminar el movimiento. Intentalo nuevamente.');
    }
  };

  if (movimientos.length === 0) {
    return <p className="text-center text-sm text-gray-500">No hay movimientos registrados</p>;
  }

  return (
    <>
      <div className="space-y-5">
        {movimientos.map((movimiento, index) => (
          <div key={movimiento.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-50 text-emerald-600">
                <span className="material-symbols-outlined text-[14px]">payments</span>
              </div>
              {index < movimientos.length - 1 && <div className="mt-1 h-full w-px bg-gray-200 dark:bg-gray-700" />}
            </div>
            <div className="flex-1 rounded-xl border border-gray-100 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-2 text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-bold text-[#0f181a] dark:text-white">Pago registrado</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs">
                    {formatDateOnly(movimiento.fechaPago, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-200"
                    onClick={() => handleOpenConfirm(movimiento)}
                    disabled={eliminarMovimiento.isPending}
                  >
                    {eliminarMovimiento.isPending && movimientoSeleccionado?.id === movimiento.id ? (
                      <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    )}
                    <span>Eliminar</span>
                  </Button>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-gray-500">{movimiento.medioPago}</span>
                <span className="text-sm font-bold text-emerald-600">+{currencyFormatter.format(movimiento.monto)}</span>
              </div>
              {movimiento.observaciones && <p className="mt-2 text-xs text-gray-500">{movimiento.observaciones}</p>}
            </div>
          </div>
        ))}
      </div>

      <EliminarMovimientoDialog
        isOpen={Boolean(movimientoSeleccionado)}
        resumen=
          {movimientoSeleccionado
            ? {
                monto: movimientoSeleccionado.monto,
                medioPago: movimientoSeleccionado.medioPago,
                fechaPago: movimientoSeleccionado.fechaPago,
                periodo,
                titularLabel,
                observaciones: movimientoSeleccionado.observaciones,
              }
            : null}
        onCancel={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
        isProcessing={eliminarMovimiento.isPending}
      />
    </>
  );
};
