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
    <Card className="border border-transparent bg-gradient-to-br from-white to-gray-50 transition hover:-translate-y-0.5 hover:border-[#007a8a]/30 dark:from-[#1e1e23] dark:to-[#27272f]">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-white">
            <ClockIcon className="text-[28px] text-[#007a8a] dark:text-cyan-300" />
            <span>{hora}</span>
          </div>
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{horario.pasajerosActivos} pax</span>
        </div>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <SchoolIcon className="text-xl text-gray-500 dark:text-gray-200" />
          <span className="truncate">{recorrido}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="hidden gap-4 md:grid md:grid-cols-2">
          {transporteData.map((transporte) => (
            <div
              key={transporte.value}
              className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm dark:border-white/5 dark:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold uppercase tracking-wide ${transporteAccentClasses[transporte.value]}`}>
                  {TRANSPORTE_LABELS[transporte.value]}
                </p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${transporteBadgeClasses[transporte.value]}`}>
                  {transporte.count > 0 ? 'En marcha' : 'Sin pasajeros'}
                </span>
              </div>
              <p className={`text-4xl font-black ${transporteAccentClasses[transporte.value]}`}>{transporte.count}</p>
              <p className="text-xs text-gray-500">Pasajeros asignados</p>
              <button
                type="button"
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${transporteButtonClasses[transporte.value]}`}
                onClick={() => onSelectHorario(horario.id, transporte.value)}
              >
                <span className="material-symbols-outlined mr-1 text-base">edit_square</span>
                Gestionar
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-4 md:hidden">
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
      </CardContent>
    </Card>
  );
};
