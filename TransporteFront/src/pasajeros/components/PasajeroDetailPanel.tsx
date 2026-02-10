import { Link } from 'react-router-dom';
import type { PasajeroResponse } from '../types/pasajero.types';

interface PasajeroDetailPanelProps {
  pasajero: PasajeroResponse | null;
  onClose?: () => void;
}

const formatDate = (value: string | null) => {
  if (!value) return null;
  const formatter = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' });
  return formatter.format(new Date(value));
};

export const PasajeroDetailPanel = ({ pasajero, onClose }: PasajeroDetailPanelProps) => {
  if (!pasajero) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <span className="material-symbols-outlined text-4xl text-gray-300">school</span>
        Selecciona un pasajero para ver la información detallada.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-white/5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#007a8a]">Resumen</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{pasajero.nombreCompleto}</h2>
          <p className="text-sm text-gray-500">
            ID #{pasajero.id}
            {pasajero.fechaAlta ? ` • Alta ${formatDate(pasajero.fechaAlta)}` : null}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 p-2 text-gray-500 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 custom-scrollbar">
        <div className="rounded-2xl bg-[#f6f8f8] p-4 text-sm dark:bg-white/5">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${pasajero.activo ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</span>
          </div>
          <p className={`mt-1 text-lg font-bold ${pasajero.activo ? 'text-emerald-600' : 'text-gray-500'}`}>
            {pasajero.activo ? 'Activo' : 'Inactivo'}
          </p>
          {pasajero.fechaBaja && <p className="text-xs text-gray-500">Baja: {formatDate(pasajero.fechaBaja)}</p>}
        </div>

        <div className="space-y-4 text-sm">
          {[
            { label: 'Titular', value: pasajero.titularApellido || 'Sin titular asignado' },
            { label: 'Colegio', value: pasajero.colegio },
            { label: 'Grado / Curso', value: pasajero.gradoCurso },
            { label: 'Turno', value: pasajero.turno },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-100 p-4 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-gray-200 p-4 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Observaciones</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {pasajero.observaciones || 'Sin observaciones registradas.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm">
          <Link
            to={`/titulares/${pasajero.titularId}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#007a8a] px-4 py-2 font-semibold text-white transition hover:bg-[#00626e]"
          >
            <span className="material-symbols-outlined text-[18px]">supervisor_account</span>
            Ver titular
          </Link>
        </div>
      </div>
    </div>
  );
};
