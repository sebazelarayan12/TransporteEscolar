import { VEHICULOS_COMBUSTIBLE, type VehiculoCombustible } from '../types/gastos.types';

interface VehiculoSelectorDialogProps {
  isOpen: boolean;
  onSelect: (vehiculo: VehiculoCombustible) => void;
  onClose: () => void;
}

const VEHICULO_CONFIG: Record<VehiculoCombustible, { icon: string; descripcion: string }> = {
  Ducato: { icon: 'directions_bus', descripcion: 'Fiat Ducato' },
  Sprinter: { icon: 'airport_shuttle', descripcion: 'Mercedes Sprinter' },
};

export const VehiculoSelectorDialog = ({ isOpen, onSelect, onClose }: VehiculoSelectorDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 text-center">
          <span className="material-symbols-rounded mb-2 block text-3xl text-amber-400">
            local_gas_station
          </span>
          <h3 className="text-base font-bold text-white">¿Para qué vehículo?</h3>
          <p className="mt-1 text-sm text-slate-400">Seleccioná el vehículo para este gasto de combustible</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {VEHICULOS_COMBUSTIBLE.map((vehiculo) => {
            const config = VEHICULO_CONFIG[vehiculo];
            return (
              <button
                key={vehiculo}
                type="button"
                onClick={() => onSelect(vehiculo)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-slate-800 px-4 py-5 text-center transition hover:border-teal-500/50 hover:bg-slate-700 active:scale-95"
              >
                <span className="material-symbols-rounded text-3xl text-teal-400">{config.icon}</span>
                <span className="text-sm font-bold text-white">{vehiculo}</span>
                <span className="text-xs text-slate-400">{config.descripcion}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 transition hover:text-white"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
