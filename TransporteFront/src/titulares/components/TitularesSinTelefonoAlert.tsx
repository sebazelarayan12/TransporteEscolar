import { Alert } from '../../shared/ui/Alert';
import type { TitularSinTelefono } from '../types/titular.types';

const PREVIEW_LIMIT = 5;

interface TitularesSinTelefonoAlertProps {
  titulares: TitularSinTelefono[];
}

const pluralizeTitulares = (count: number) => `titular${count !== 1 ? 'es' : ''}`;

export const TitularesSinTelefonoAlert = ({ titulares }: TitularesSinTelefonoAlertProps) => {
  if (titulares.length === 0) return null;

  const preview = titulares.slice(0, PREVIEW_LIMIT);
  const restantes = titulares.length - preview.length;

  return (
    <Alert variant="warning" className="space-y-2 rounded-xl border-yellow-200 bg-yellow-50 text-yellow-900">
      <div>
        <p className="text-sm font-semibold">
          {titulares.length} {pluralizeTitulares(titulares.length)} sin teléfonos cargados
        </p>
      </div>
      <ul className="list-disc space-y-1 pl-4 text-xs text-yellow-900 sm:text-sm">
        {preview.map((titular) => (
          <li key={titular.id}>
            {titular.apellido}, {titular.nombreContacto}
          </li>
        ))}
      </ul>
      {restantes > 0 && (
        <p className="text-xs font-medium text-yellow-900">
          y {restantes} {pluralizeTitulares(restantes)} más sin teléfonos registrados.
        </p>
      )}
    </Alert>
  );
};
