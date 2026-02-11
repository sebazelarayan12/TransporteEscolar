import type { ReinscripcionDetallada, ReinscripcionEstado } from '../types/reinscripcion.types';
import { formatDateOnlyCompact } from '../../shared/utils/date.helpers';

const statusConfig: Record<ReinscripcionEstado, { label: string; chip: string; card: string; foreground: string }> = {
  Confirmado: {
    label: 'Confirmado',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-900/20 dark:text-emerald-300',
    card: 'border border-transparent shadow-sm hover:shadow-lg',
    foreground: 'text-emerald-600 dark:text-emerald-300',
  },
  Pendiente: {
    label: 'Pendiente',
    chip: 'bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-900/20 dark:text-amber-300',
    card: 'border-l-4 border-l-amber-400 border-y border-r border-slate-100/80 dark:border-slate-800',
    foreground: 'text-amber-600 dark:text-amber-300',
  },
  NoContinua: {
    label: 'No Continúa',
    chip: 'bg-slate-100 text-slate-600 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-300',
    card: 'bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-slate-700 opacity-90',
    foreground: 'text-slate-500 dark:text-slate-300',
  },
};

interface ReinscripcionCardProps {
  registro: ReinscripcionDetallada;
  onConfirm?: (registro: ReinscripcionDetallada) => void;
  onMarkAsNotContinuing?: (registro: ReinscripcionDetallada) => void;
  onMarkAsPending?: (registro: ReinscripcionDetallada) => void;
}

export const ReinscripcionCard = ({ registro, onConfirm, onMarkAsNotContinuing, onMarkAsPending }: ReinscripcionCardProps) => {
  const getInitial = (nombre: string) => nombre.charAt(0).toUpperCase();

  const renderActionButtons = () => {
    if (registro.estado === 'Pendiente') {
      return (
        <div className="flex gap-1">
          <button
            onClick={() => onConfirm?.(registro)}
            className="rounded-lg bg-emerald-500 p-1.5 text-white hover:bg-emerald-600 transition"
            title="Confirmar reinscripción"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
          </button>
          <button
            onClick={() => onMarkAsNotContinuing?.(registro)}
            className="rounded-lg bg-slate-400 p-1.5 text-white hover:bg-slate-500 transition"
            title="Marcar como no continúa"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      );
    }

    if (registro.estado === 'Confirmado') {
      return (
        <div className="flex gap-1">
          <button
            onClick={() => onMarkAsPending?.(registro)}
            className="rounded-lg bg-amber-500 p-1.5 text-white hover:bg-amber-600 transition"
            title="Marcar como pendiente"
          >
            <span className="material-symbols-outlined text-[18px]">schedule</span>
          </button>
          <button
            onClick={() => onMarkAsNotContinuing?.(registro)}
            className="rounded-lg bg-slate-400 p-1.5 text-white hover:bg-slate-500 transition"
            title="Marcar como no continúa"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      );
    }

    if (registro.estado === 'NoContinua') {
      return (
        <div className="flex gap-1">
          <button
            onClick={() => onMarkAsPending?.(registro)}
            className="rounded-lg bg-amber-500 p-1.5 text-white hover:bg-amber-600 transition"
            title="Marcar como pendiente"
          >
            <span className="material-symbols-outlined text-[18px]">schedule</span>
          </button>
          <button
            onClick={() => onConfirm?.(registro)}
            className="rounded-lg bg-emerald-500 p-1.5 text-white hover:bg-emerald-600 transition"
            title="Confirmar reinscripción"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <article
      className={`group relative flex flex-col gap-3 rounded-2xl bg-white p-4 transition dark:bg-[#1f1f24] ${
        statusConfig[registro.estado].card
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-[#1d8ca5]/10 text-lg font-bold text-[#1d8ca5] ${
              registro.estado === 'Pendiente'
                ? 'bg-amber-50 text-amber-600'
                : registro.estado === 'NoContinua'
                  ? 'bg-slate-200 text-slate-600 dark:bg-white/5 dark:text-white'
                  : ''
            }`}
          >
            {getInitial(registro.pasajeroNombre)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0f181a] dark:text-white">{registro.pasajeroNombre}</h3>
            <p className="text-xs text-gray-500">ID #{registro.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset ${
              statusConfig[registro.estado].chip
            }`}
          >
            {statusConfig[registro.estado].label}
          </span>
          {renderActionButtons()}
        </div>
      </div>

      <div className="grid gap-y-2 gap-x-4 border-t border-dashed border-gray-200 pt-3 text-sm dark:border-gray-700 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-gray-400">account_circle</span>
          <span className="text-gray-600 dark:text-gray-300">{registro.titularNombre}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-gray-400">school</span>
          <span className="text-gray-600 dark:text-gray-300">{registro.colegio}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-gray-400">local_library</span>
          <span className="text-gray-600 dark:text-gray-300">{registro.curso}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-gray-400">wb_sunny</span>
          <span className="text-gray-600 dark:text-gray-300">Turno {registro.turno}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1 text-xs text-gray-400">
        <span className="inline-flex items-center gap-1 text-[#1d8ca5]">
          <span className="material-symbols-outlined text-[16px]">timeline</span>
          Creada {formatDateOnlyCompact(registro.fechaCreacion)}
        </span>
        {registro.fechaConfirmacion && (
          <>
            <span>•</span>
            <span>
              Confirmada {formatDateOnlyCompact(registro.fechaConfirmacion)}
            </span>
          </>
        )}
      </div>
    </article>
  );
};
