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

const transporteChipButtonClasses: Record<TransporteTipo, string> = {
  [TRANSPORTE_TIPOS.UNO]: 'border-[#007a8a]/40 text-[#007a8a] hover:bg-[#007a8a]/10 focus-visible:ring-[#007a8a]/30 dark:border-[#007a8a]/40 dark:text-cyan-100 dark:hover:bg-[#007a8a]/20',
  [TRANSPORTE_TIPOS.DOS]: 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 focus-visible:ring-emerald-200 dark:border-emerald-300/50 dark:text-emerald-100 dark:hover:bg-emerald-400/10',
};

const transporteMiniCardSurfaceClasses: Record<TransporteTipo, string> = {
  [TRANSPORTE_TIPOS.UNO]: 'bg-[#007a8a]/5 dark:bg-[#007a8a]/15',
  [TRANSPORTE_TIPOS.DOS]: 'bg-emerald-500/5 dark:bg-emerald-400/15',
};

const mobileTabClasses: Record<TransporteTipo, string> = {
  [TRANSPORTE_TIPOS.UNO]: 'border-[#007a8a]/40 text-[#007a8a] dark:text-cyan-200',
  [TRANSPORTE_TIPOS.DOS]: 'border-emerald-200 text-emerald-600 dark:text-emerald-200',
};

const mobileTabActiveClasses: Record<TransporteTipo, string> = {
  [TRANSPORTE_TIPOS.UNO]: 'bg-[#007a8a] text-white shadow-lg shadow-[#007a8a]/30',
  [TRANSPORTE_TIPOS.DOS]: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
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
  const [mobileTransporte, setMobileTransporte] = useState<TransporteTipo>(TRANSPORTE_TIPOS.UNO);

  const transporteData = TRANSPORTE_LIST.map((value) => {
    const count = value === TRANSPORTE_TIPOS.UNO
      ? horario.conteosPorTransporte.transporteUno
      : horario.conteosPorTransporte.transporteDos;
    return { value, count };
  });

  const mobileActive = transporteData.find((item) => item.value === mobileTransporte) ?? transporteData[0];

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
        <div className="border-t border-gray-100/80 dark:border-white/5">
          <div className="hidden flex-col gap-4 p-5 md:flex">
            {transporteData.map((transporte) => (
              <article
                key={transporte.value}
                className={`flex min-h-[160px] flex-col gap-3 rounded-2xl border border-gray-100/80 px-5 py-4 shadow-sm ring-1 ring-black/5 transition dark:border-white/5 dark:ring-white/5 ${transporteMiniCardSurfaceClasses[transporte.value]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${transporteAccentClasses[transporte.value]}`}>
                      {TRANSPORTE_LABELS[transporte.value]}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Turno asignado</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${transporteBadgeClasses[transporte.value]}`}>
                    {transporte.count > 0 ? 'En marcha' : 'Sin pasajeros'}
                  </span>
                </div>
                <div>
                  <p className={`text-5xl font-black leading-tight ${transporteAccentClasses[transporte.value]}`}>
                    {transporte.count}
                  </p>
                  <p className="text-xs text-gray-500">Pasajeros asignados</p>
                </div>
                <div className="mt-auto flex justify-end">
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${transporteChipButtonClasses[transporte.value]}`}
                    onClick={() => onSelectHorario(horario.id, transporte.value)}
                  >
                    <span className="material-symbols-outlined text-sm">edit_square</span>
                    Gestionar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="space-y-4 p-4 md:hidden">
            <div className="flex items-center gap-2">
              {transporteData.map((transporte) => {
                const isActive = transporte.value === mobileTransporte;
                return (
                  <button
                    key={transporte.value}
                    type="button"
                    className={`flex-1 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      mobileTabClasses[transporte.value]
                    } ${isActive ? mobileTabActiveClasses[transporte.value] : 'bg-transparent'} `}
                    onClick={() => setMobileTransporte(transporte.value)}
                  >
                    {TRANSPORTE_LABELS[transporte.value]}
                  </button>
                );
              })}
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm dark:border-white/5 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold uppercase tracking-wide ${transporteAccentClasses[mobileActive.value]}`}>
                  {TRANSPORTE_LABELS[mobileActive.value]}
                </p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${transporteBadgeClasses[mobileActive.value]}`}>
                  {mobileActive.count > 0 ? 'En marcha' : 'Sin pasajeros'}
                </span>
              </div>
              <p className={`mt-3 text-4xl font-black ${transporteAccentClasses[mobileActive.value]}`}>{mobileActive.count}</p>
              <p className="text-xs text-gray-500">Pasajeros asignados</p>
              <button
                type="button"
                className={`mt-4 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${transporteButtonClasses[mobileActive.value]}`}
                onClick={() => onSelectHorario(horario.id, mobileActive.value)}
              >
                <span className="material-symbols-outlined mr-1 text-base">edit_square</span>
                Gestionar {TRANSPORTE_LABELS[mobileActive.value]}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
