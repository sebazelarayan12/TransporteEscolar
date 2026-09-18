import { getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';
import type { TitularResponse } from '../../titulares/types/titular.types';
import type { MedioPago } from '../constants/medios-pago.constants';
import type { PagoConfirmacionData } from '../components/registrar-pago/ConfirmacionPagoModal';
import type { PagoMensual } from '../types/pago.types';

export const parseMonto = (monto: string) => {
  const value = parseFloat(monto);
  return { value, isValid: monto.trim() !== '' && Number.isFinite(value) && value > 0 };
};

/** Versión más reciente del titular seleccionado (viene de la lista), o el seleccionado si ya no está en ella. */
export const resolveTitularActivo = (
  selected: TitularResponse | null,
  titulares: TitularResponse[],
): TitularResponse | null => {
  if (!selected) return null;
  return titulares.find((titular) => titular.id === selected.id) ?? selected;
};

interface BuildConfirmacionParams {
  pago: PagoMensual;
  titular: TitularResponse;
  monto: number;
  medioPago: MedioPago;
  observaciones: string;
}

export const buildConfirmacion = ({
  pago,
  titular,
  monto,
  medioPago,
  observaciones,
}: BuildConfirmacionParams): PagoConfirmacionData => ({
  pagoId: pago.id,
  titularLabel: getTitularApellidoDisplay(titular.apellido, titular.nombreContacto),
  monto,
  medioPago,
  observaciones: observaciones.trim() || undefined,
  fechaPagoIso: new Date().toISOString(),
  periodoDestino: pago.periodo,
});

export const getRegistrarPagoErrorMessage = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : 'No se pudo registrar el pago';
