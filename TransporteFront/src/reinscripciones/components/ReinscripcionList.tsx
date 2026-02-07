import type { ReinscripcionDetallada } from '../types/reinscripcion.types';
import { ReinscripcionCard } from './ReinscripcionCard';

interface ReinscripcionListProps {
  reinscripciones: ReinscripcionDetallada[];
  onConfirm: (id: number) => void;
  onMarkAsNotContinuing: (id: number) => void;
}

export const ReinscripcionList = ({ reinscripciones, onConfirm, onMarkAsNotContinuing }: ReinscripcionListProps) => {
  if (reinscripciones.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-[#1f1f24]">
        No se encontraron registros con ese criterio.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {reinscripciones.map((registro) => (
        <ReinscripcionCard
          key={registro.id}
          registro={registro}
          onConfirm={onConfirm}
          onMarkAsNotContinuing={onMarkAsNotContinuing}
        />
      ))}
    </section>
  );
};
