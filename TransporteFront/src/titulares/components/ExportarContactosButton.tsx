import { useState } from 'react';
import { exportarContactosVcf } from '../helpers/vcard.helpers';
import type { TitularResponse } from '../types/titular.types';

interface ExportarContactosButtonProps {
  titulares: TitularResponse[];
}

export const ExportarContactosButton = ({ titulares }: ExportarContactosButtonProps) => {
  const [exportando, setExportando] = useState(false);

  const handleExportar = async () => {
    const activos = titulares.filter((titular) => titular.activo);
    setExportando(true);
    try {
      await exportarContactosVcf(activos);
    } finally {
      setExportando(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExportar}
      disabled={exportando}
      className="flex items-center justify-center gap-2 rounded-lg border border-[#007a8a] px-4 py-2.5 text-sm font-bold text-[#007a8a] transition-colors hover:bg-[#007a8a]/10 disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-[20px]">
        {exportando ? 'hourglass_empty' : 'contacts'}
      </span>
      {exportando ? 'Exportando...' : 'Exportar contactos'}
    </button>
  );
};
