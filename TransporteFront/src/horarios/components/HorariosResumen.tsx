import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui';
import type { HorarioResponse, HorarioConteosPorTransporte } from '../types/horario.types';
import { TRANSPORTE_LABELS, TRANSPORTE_TIPOS } from '../../shared/types/transporte.types';
import type { TransporteTipo } from '../../shared/types/transporte.types';

interface HorariosResumenProps {
  horarios: HorarioResponse[];
  totalPasajeros: number;
  totalPorTransporte: HorarioConteosPorTransporte;
}

const transporteAccentClasses: Record<TransporteTipo, string> = {
  [TRANSPORTE_TIPOS.UNO]: 'text-[#007a8a] dark:text-cyan-200',
  [TRANSPORTE_TIPOS.DOS]: 'text-emerald-600 dark:text-emerald-200',
};

const transporteBadgeClasses: Record<TransporteTipo, string> = {
  [TRANSPORTE_TIPOS.UNO]: 'bg-[#007a8a]/10 text-[#007a8a] dark:bg-[#007a8a]/20 dark:text-cyan-200',
  [TRANSPORTE_TIPOS.DOS]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100',
};

export const HorariosResumen = ({ horarios, totalPasajeros, totalPorTransporte }: HorariosResumenProps) => {
  const topHorarios = horarios.slice(0, 5);

  return (
    <aside className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-gradient-to-r from-[#007a8a] to-cyan-500 p-4 text-white shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] opacity-80">Total pasajeros</p>
              <p className="mt-2 text-3xl font-black">{totalPasajeros}</p>
              <p className="text-xs text-white/70">Suma de ambos transportes</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-sm dark:border-white/5 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Capacidad por transporte</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[TRANSPORTE_TIPOS.UNO, TRANSPORTE_TIPOS.DOS].map((transporte) => (
                  <div key={transporte} className="rounded-xl bg-gray-50 p-3 dark:bg-white/10">
                    <p className={`text-[11px] font-semibold uppercase tracking-wide ${transporteAccentClasses[transporte]}`}>
                      {TRANSPORTE_LABELS[transporte]}
                    </p>
                    <p className={`mt-1 text-2xl font-black ${transporteAccentClasses[transporte]}`}>
                      {transporte === TRANSPORTE_TIPOS.UNO
                        ? totalPorTransporte.transporteUno
                        : totalPorTransporte.transporteDos}
                    </p>
                    <p className="text-xs text-gray-500">Pasajeros</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {topHorarios.map((horario) => (
              <div key={horario.id} className="rounded-2xl border border-gray-100 bg-white/80 p-3 shadow-sm dark:border-white/5 dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{horario.etiqueta}</p>
                    <p className="text-xs text-gray-500">Orden {horario.orden}</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{horario.pasajerosActivos}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {[TRANSPORTE_TIPOS.UNO, TRANSPORTE_TIPOS.DOS].map((transporte) => {
                    const count = transporte === TRANSPORTE_TIPOS.UNO
                      ? horario.conteosPorTransporte.transporteUno
                      : horario.conteosPorTransporte.transporteDos;
                    return (
                      <span
                        key={transporte}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${transporteBadgeClasses[transporte]}`}
                      >
                        {TRANSPORTE_LABELS[transporte].replace('Transporte ', 'T')}: {count}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <Link to="/pasajeros" className="inline-flex items-center gap-2 text-sm font-semibold text-[#007a8a] hover:text-[#005c69]">
            Ver listado de pasajeros
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </Link>
        </CardContent>
      </Card>
    </aside>
  );
};
