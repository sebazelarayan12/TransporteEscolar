import { useId } from 'react';
import { Button } from '../../shared/ui';
import type { TitularDelViaje } from '../helpers/parada-fija.helpers';

interface ParadaFijaEditorProps {
  titularesDelViaje: TitularDelViaje[];
  titularSeleccionado: number | '';
  onSeleccionarTitular: (titularId: number | '') => void;
  onGuardar: () => void;
  onCancelar: () => void;
  isSaving: boolean;
}

/** Formulario para elegir el titular que queda como casa fija del viaje. */
export const ParadaFijaEditor = ({
  titularesDelViaje,
  titularSeleccionado,
  onSeleccionarTitular,
  onGuardar,
  onCancelar,
  isSaving,
}: ParadaFijaEditorProps) => {
  const selectId = useId();

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-transparent">
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Elegí la familia
      </label>
      <select
        id={selectId}
        value={titularSeleccionado}
        onChange={(event) => onSeleccionarTitular(event.target.value ? Number(event.target.value) : '')}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007a8a] dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white"
      >
        <option value="">Seleccioná un titular</option>
        {titularesDelViaje.map((titular) => (
          <option key={titular.titularId} value={titular.titularId} disabled={!titular.tieneUbicacion}>
            {titular.apellido}
            {!titular.tieneUbicacion ? ' — sin ubicación cargada' : ''}
          </option>
        ))}
      </select>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancelar} disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={onGuardar}
          disabled={!titularSeleccionado || isSaving}
          className="bg-[#007a8a] text-white hover:bg-[#00626e]"
        >
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
};
