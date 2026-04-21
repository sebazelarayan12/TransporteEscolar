import { useState } from 'react';
import { VEHICULOS_COMBUSTIBLE } from '../types/gastos.types';

interface VehiculoSelectorDialogProps {
  isOpen: boolean;
  onSelect: (vehiculo: string) => void;
  onClose: () => void;
}

const VEHICULO_ICONS: Record<string, string> = {
  Ducato: 'directions_bus',
  Sprinter: 'airport_shuttle',
};

export const VehiculoSelectorDialog = ({ isOpen, onSelect, onClose }: VehiculoSelectorDialogProps) => {
  const [modoOtro, setModoOtro] = useState(false);
  const [otroNombre, setOtroNombre] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setModoOtro(false);
    setOtroNombre('');
    onClose();
  };

  const handleSelect = (vehiculo: string) => {
    setModoOtro(false);
    setOtroNombre('');
    onSelect(vehiculo);
  };

  const handleConfirmarOtro = () => {
    const nombre = otroNombre.trim();
    if (!nombre) return;
    handleSelect(nombre);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 text-center">
          <span className="material-symbols-rounded mb-2 block text-3xl text-amber-400">
            local_gas_station
          </span>
          <h3 className="text-base font-bold text-white">¿Para qué vehículo?</h3>
        </div>

        {modoOtro ? (
          <div className="space-y-3">
            <input
              autoFocus
              type="text"
              value={otroNombre}
              onChange={(e) => setOtroNombre(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmarOtro(); }}
              placeholder="Nombre del vehículo"
              className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setModoOtro(false); setOtroNombre(''); }}
                className="flex-1 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 transition hover:text-white"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmarOtro}
                disabled={!otroNombre.trim()}
                className="flex-1 rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-40"
              >
                Confirmar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {VEHICULOS_COMBUSTIBLE.map((vehiculo) => (
                <button
                  key={vehiculo}
                  type="button"
                  onClick={() => handleSelect(vehiculo)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-slate-800 px-4 py-5 text-center transition hover:border-teal-500/50 hover:bg-slate-700 active:scale-95"
                >
                  <span className="material-symbols-rounded text-3xl text-teal-400">
                    {VEHICULO_ICONS[vehiculo] ?? 'directions_car'}
                  </span>
                  <span className="text-sm font-bold text-white">{vehiculo}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 transition hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setModoOtro(true)}
                className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 transition hover:text-white"
              >
                Otro
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
