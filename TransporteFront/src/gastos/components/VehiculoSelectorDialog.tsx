import { useEffect, useRef, useState } from 'react';
import { Modal } from '../../shared/ui/Modal';
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

const SECONDARY_BUTTON_CLASS =
  'rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 transition hover:text-gray-900 dark:border-white/10 dark:text-slate-400 dark:hover:text-white';

interface OtroVehiculoFormProps {
  nombre: string;
  onNombreChange: (nombre: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

const OtroVehiculoForm = ({ nombre, onNombreChange, onConfirm, onBack }: OtroVehiculoFormProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Al entrar en este modo el foco va al campo de nombre
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="text"
        value={nombre}
        onChange={(e) => onNombreChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onConfirm();
        }}
        aria-label="Nombre del vehículo"
        placeholder="Nombre del vehículo"
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
      />
      <div className="flex gap-2">
        <button type="button" onClick={onBack} className={`flex-1 ${SECONDARY_BUTTON_CLASS}`}>
          Volver
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!nombre.trim()}
          className="flex-1 rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-40"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

interface VehiculoOpcionesProps {
  onSelect: (vehiculo: string) => void;
  onCancel: () => void;
  onOtro: () => void;
}

const VehiculoOpciones = ({ onSelect, onCancel, onOtro }: VehiculoOpcionesProps) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      {VEHICULOS_COMBUSTIBLE.map((vehiculo) => (
        <button
          key={vehiculo}
          type="button"
          onClick={() => onSelect(vehiculo)}
          className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-5 text-center transition hover:border-teal-500/50 hover:bg-gray-100 active:scale-95 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <span className="material-symbols-rounded text-3xl text-teal-500 dark:text-teal-400">
            {VEHICULO_ICONS[vehiculo] ?? 'directions_car'}
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{vehiculo}</span>
        </button>
      ))}
    </div>

    <div className="mt-4 flex gap-2">
      <button type="button" onClick={onCancel} className={`flex-1 ${SECONDARY_BUTTON_CLASS}`}>
        Cancelar
      </button>
      <button type="button" onClick={onOtro} className={SECONDARY_BUTTON_CLASS}>
        Otro
      </button>
    </div>
  </>
);

export const VehiculoSelectorDialog = ({ isOpen, onSelect, onClose }: VehiculoSelectorDialogProps) => {
  const [modoOtro, setModoOtro] = useState(false);
  const [otroNombre, setOtroNombre] = useState('');

  const resetOtro = () => {
    setModoOtro(false);
    setOtroNombre('');
  };

  const handleClose = () => {
    resetOtro();
    onClose();
  };

  const handleSelect = (vehiculo: string) => {
    resetOtro();
    onSelect(vehiculo);
  };

  const handleConfirmarOtro = () => {
    const nombre = otroNombre.trim();
    if (nombre) handleSelect(nombre);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="¿Para qué vehículo?" maxWidth="sm">
      {modoOtro ? (
        <OtroVehiculoForm
          nombre={otroNombre}
          onNombreChange={setOtroNombre}
          onConfirm={handleConfirmarOtro}
          onBack={resetOtro}
        />
      ) : (
        <VehiculoOpciones onSelect={handleSelect} onCancel={handleClose} onOtro={() => setModoOtro(true)} />
      )}
    </Modal>
  );
};
