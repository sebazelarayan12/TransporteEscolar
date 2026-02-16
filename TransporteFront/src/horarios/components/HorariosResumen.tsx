import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui';
import type { HorarioResponse } from '../types/horario.types';

interface HorariosResumenProps {
  horarios: HorarioResponse[];
  totalPasajeros: number;
}

export const HorariosResumen = ({ horarios, totalPasajeros }: HorariosResumenProps) => {
  const topHorarios = horarios.slice(0, 5);

  return (
    <aside className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-r from-[#007a8a] to-cyan-400 p-4 text-white shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] opacity-80">Total pasajeros</p>
            <p className="mt-2 text-3xl font-black">{totalPasajeros}</p>
          </div>
          <div className="space-y-3">
            {topHorarios.map((horario) => (
              <div key={horario.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{horario.etiqueta}</p>
                  <p className="text-xs text-gray-500">Orden {horario.orden}</p>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{horario.pasajerosActivos}</span>
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
