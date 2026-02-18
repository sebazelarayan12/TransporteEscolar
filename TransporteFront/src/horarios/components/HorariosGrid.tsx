import { useState } from 'react';
import type { HorarioResponse } from '../types/horario.types';
import { Card, CardContent, CardHeader, CardTitle, ClockIcon, SchoolIcon } from '../../shared/ui';
import { TRANSPORTE_LABELS, TRANSPORTE_LIST, TRANSPORTE_TIPOS } from '../../shared/types/transporte.types';
import type { TransporteTipo } from '../../shared/types/transporte.types';

const getHorarioDisplayData = (etiqueta: string) => {
  const trimmedEtiqueta = etiqueta.trim();
  const match = trimmedEtiqueta.match(/^(\d{1,2}(?::\d{2})?)\s+(.*)$/);

  if (!match) {
    return {
      hora: `${trimmedEtiqueta} hs`,
      recorrido: trimmedEtiqueta,
    };
  }

  const [, horaBase, recorridoRaw] = match;
  const recorrido = recorridoRaw.trim() || trimmedEtiqueta;

  return {
    hora: `${horaBase} hs`,
    recorrido,
  };
};

const transporteAccentClasses: Record<TransporteTipo, string> = {
  [TRANSPORTE_TIPOS.UNO]: 'text-[#007a8a] dark:text-cyan-200',
  [TRANSPORTE_TIPOS.DOS]: 'text-emerald-600 dark:text-emerald-200',
};

const transporteBadgeClasses: Record<TransporteTipo, string> = {
  [TRANSPORTE_TIPOS.UNO]: 'bg-[#007a8a]/10 text-[#007a8a] dark:bg-[#007a8a]/20 dark:text-cyan-200',
  [TRANSPORTE_TIPOS.DOS]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100',
};

const transporteButtonClasses: Record<TransporteTipo, string> = {
  [TRANSPORTE_TIPOS.UNO]: 'bg-[#007a8a] text-white hover:bg-[#00626e]',
  [TRANSPORTE_TIPOS.DOS]: 'bg-emerald-500 text-white hover:bg-emerald-600',
};

const transporteTabClasses: Record<TransporteTipo, string> = {
  [TRANSPORTE_TIPOS.UNO]: 'border-[#007a8a]/40 text-[#007a8a] dark:text-cyan-200',
  [TRANSPORTE_TIPOS.DOS]: 'border-emerald-200 text-emerald-600 dark:text-emerald-200',
};

const transporteTabActiveClasses: Record<TransporteTipo, string> = {
  [TRANSPORTE_TIPOS.UNO]: 'bg-[#007a8a] text-white shadow-lg shadow-[#007a8a]/30 dark:shadow-[#007a8a]/40',
  [TRANSPORTE_TIPOS.DOS]: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 dark:shadow-emerald-400/40',
};

const TRANSPORTE_SHORT_LABELS: Record<TransporteTipo, string> = {
  [TRANSPORTE_TIPOS.UNO]: 'T1',
  [TRANSPORTE_TIPOS.DOS]: 'T2',
};

interface HorariosGridProps {
  horarios: HorarioResponse[];
  onSelectHorario: (horarioId: number, transporte: TransporteTipo) => void;
}

export const HorariosGrid = ({ horarios, onSelectHorario }: HorariosGridProps) => (
  <section className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Horarios disponibles</h2>
      <span className="text-sm text-gray-500">{horarios.length} horarios activos</span>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {horarios.map((horario) => (
        <HorarioCard key={horario.id} horario={horario} onSelectHorario={onSelectHorario} />
      ))}
    </div>
  </section>
);

interface HorarioCardProps {
  horario: HorarioResponse;
  onSelectHorario: (horarioId: number, transporte: TransporteTipo) => void;
}

const HorarioCard = ({ horario, onSelectHorario }: HorarioCardProps) => {
  const { hora, recorrido } = getHorarioDisplayData(horario.etiqueta);
  const [activeTransporte, setActiveTransporte] = useState<TransporteTipo>(TRANSPORTE_TIPOS.UNO);

  const transporteData = TRANSPORTE_LIST.map((value) => {
    const count = value === TRANSPORTE_TIPOS.UNO
      ? horario.conteosPorTransporte.transporteUno
      : horario.conteosPorTransporte.transporteDos;
    return { value, count };
  });

  const activePanel = transporteData.find((item) => item.value === activeTransporte) ?? transporteData[0];

  return (
    <Card className="border border-gray-100/70 bg-white/95 shadow-none transition hover:ring-1 hover:ring-[#007a8a]/20 dark:border-white/5 dark:bg-[#1e1e23]">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-white">
            <ClockIcon className="text-[28px] text-[#007a8a] dark:text-cyan-300" />
            <span>{hora}</span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-300">{horario.pasajerosActivos} pax activos</span>
        </div>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-200">
          <SchoolIcon className="text-base text-gray-400 dark:text-gray-200" />
          <span className="truncate">{recorrido}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-gray-100/80 p-4 dark:border-white/5 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {transporteData.map((transporte) => {
              const isActive = transporte.value === activeTransporte;
              return (
                <button
                  key={transporte.value}
                  type="button"
                  className={`flex-1 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:flex-none md:text-sm ${
                    transporteTabClasses[transporte.value]
                  } ${isActive ? transporteTabActiveClasses[transporte.value] : 'bg-transparent hover:bg-gray-50 dark:hover:bg-white/10'}`}
                  onClick={() => setActiveTransporte(transporte.value)}
                >
                  {TRANSPORTE_LABELS[transporte.value]}
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-3xl border border-gray-100 bg-white/90 p-4 shadow-sm dark:border-white/5 dark:bg-[#1a1b21]/80 sm:p-6 md:flex md:flex-col md:overflow-hidden md:rounded-2xl md:border-gray-100/70 md:bg-white md:shadow-lg dark:md:border-white/10 dark:md:bg-[#171821]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide ${transporteAccentClasses[activePanel.value]}`}>
                  {TRANSPORTE_LABELS[activePanel.value]}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">Turno asignado</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold md:px-2.5 md:py-0.5 md:text-[10px] ${transporteBadgeClasses[activePanel.value]}`}>
                {activePanel.count > 0 ? 'En marcha' : 'Sin pasajeros'}
              </span>
            </div>
            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className={`text-5xl font-black leading-tight ${transporteAccentClasses[activePanel.value]}`}>
                  {activePanel.count}
                </p>
                <p className="text-xs text-gray-500">Pasajeros asignados</p>
              </div>
              <button
                type="button"
                aria-label={`Gestionar ${TRANSPORTE_LABELS[activePanel.value]}`}
                className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:w-full md:max-w-[200px] md:self-end md:rounded-2xl md:px-4 md:py-1.5 md:text-xs ${transporteButtonClasses[activePanel.value]}`}
                onClick={() => onSelectHorario(horario.id, activePanel.value)}
              >
                <span className="material-symbols-outlined mr-1 text-base md:text-sm">edit_square</span>
                <span className="md:hidden">Gestionar {TRANSPORTE_LABELS[activePanel.value]}</span>
                <span className="hidden md:inline">Gestionar {TRANSPORTE_SHORT_LABELS[activePanel.value]}</span>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
