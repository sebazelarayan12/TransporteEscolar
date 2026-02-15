import type { HorarioResponse } from '../types/horario.types';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui';

interface HorariosGridProps {
  horarios: HorarioResponse[];
  onSelectHorario: (horarioId: number) => void;
}

export const HorariosGrid = ({ horarios, onSelectHorario }: HorariosGridProps) => (
  <section className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Horarios disponibles</h2>
      <span className="text-sm text-gray-500">{horarios.length} horarios activos</span>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {horarios.map((horario) => (
        <Card
          key={horario.id}
          className="cursor-pointer border border-transparent bg-gradient-to-br from-white to-gray-50 transition hover:-translate-y-0.5 hover:border-[#007a8a]/30 dark:from-[#1e1e23] dark:to-[#27272f]"
          onClick={() => onSelectHorario(horario.id)}
        >
          <CardHeader className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Horario #{horario.orden}</p>
            <CardTitle className="text-2xl">{horario.etiqueta}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-baseline justify-between">
            <div>
              <p className="text-4xl font-black text-[#007a8a] dark:text-cyan-300">{horario.pasajerosActivos}</p>
              <p className="text-xs uppercase tracking-wide text-gray-400">Pasajeros</p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-[#007a8a]/10 px-3 py-1 text-xs font-semibold text-[#007a8a] dark:bg-cyan-400/10 dark:text-cyan-200">
              <span className="material-symbols-outlined text-[16px]">edit_square</span>
              Gestionar
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </section>
);
