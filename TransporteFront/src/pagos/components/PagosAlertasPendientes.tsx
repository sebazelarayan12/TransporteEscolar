import { Alert } from '../../shared/ui/Alert';
import { getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';
import type { ReinscripcionAlertItem } from '../../reinscripciones/types/reinscripcion.types';

const PREVIEW_LIMIT = 5;

interface PagosAlertasPendientesProps {
  pendientes: ReinscripcionAlertItem[];
  anio: number;
}

const pluralizePasajeros = (count: number) => `pasajero${count !== 1 ? 's' : ''}`;

export const PagosAlertasPendientes = ({ pendientes, anio }: PagosAlertasPendientesProps) => {
  if (pendientes.length === 0) return null;

  const preview = pendientes.slice(0, PREVIEW_LIMIT);
  const restantes = pendientes.length - preview.length;

  return (
    <Alert variant="warning" className="space-y-3 rounded-3xl border-yellow-200 bg-yellow-50 text-yellow-900">
      <div>
        <p className="text-sm font-semibold">
          Hay {pendientes.length} {pluralizePasajeros(pendientes.length)} pendientes en {anio}
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide">Pendientes ({pendientes.length})</p>
        <ul className="list-disc space-y-1 pl-4 text-xs text-yellow-900 sm:text-sm">
          {preview.map((alerta) => (
            <li key={alerta.reinscripcionId}>
              {alerta.pasajeroNombre} - Titular: {getTitularApellidoDisplay(undefined, alerta.titularNombre)}
            </li>
          ))}
        </ul>
        {restantes > 0 && (
          <p className="text-xs font-medium text-yellow-900">
            y {restantes} {pluralizePasajeros(restantes)} mas pendientes de confirmar.
          </p>
        )}
      </div>
    </Alert>
  );
};
