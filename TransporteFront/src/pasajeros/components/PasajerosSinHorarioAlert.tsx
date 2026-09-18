import { Alert } from '../../shared/ui/Alert';
import type { PasajeroSinHorarioResponse } from '../types/pasajero.types';

const PREVIEW_LIMIT = 5;

interface PasajerosSinHorarioAlertProps {
  pasajeros: PasajeroSinHorarioResponse[];
}

const pluralizePasajeros = (count: number) => `pasajero${count !== 1 ? 's' : ''}`;

export const PasajerosSinHorarioAlert = ({ pasajeros }: PasajerosSinHorarioAlertProps) => {
  if (pasajeros.length === 0) return null;

  const preview = pasajeros.slice(0, PREVIEW_LIMIT);
  const restantes = pasajeros.length - preview.length;

  return (
    <Alert variant="warning" className="space-y-2 rounded-2xl border-yellow-200 bg-yellow-50 text-yellow-900">
      <div>
        <p className="text-sm font-semibold">
          {pasajeros.length} {pluralizePasajeros(pasajeros.length)} sin horario asignado
        </p>
      </div>
      <ul className="list-disc space-y-1 pl-4 text-xs text-yellow-900 sm:text-sm">
        {preview.map((pasajero) => (
          <li key={pasajero.id}>
            {pasajero.nombre} {pasajero.apellido}
          </li>
        ))}
      </ul>
      {restantes > 0 && (
        <p className="text-xs font-medium text-yellow-900">
          y {restantes} {pluralizePasajeros(restantes)} más sin horarios configurados.
        </p>
      )}
    </Alert>
  );
};
