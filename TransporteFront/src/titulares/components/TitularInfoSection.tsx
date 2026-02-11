import { SectionHeader } from '../../shared/ui';
import { formatDateOnly } from '../../shared/utils/date.helpers';
import type { TitularResponse } from '../types/titular.types';

interface TitularInfoSectionProps {
  titular: TitularResponse;
}

export const TitularInfoSection = ({ titular }: TitularInfoSectionProps) => {
  return (
    <section>
      <SectionHeader icon="info" title="Información General" />
      <div className="space-y-3">
        <div className="flex justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-[#e4e4e7] dark:border-[#3f3f46]">
          <span className="text-sm text-gray-500">Monto Mensual</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            ${titular.montoMensualPactado.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-[#e4e4e7] dark:border-[#3f3f46]">
          <span className="text-sm text-gray-500">Fecha de Alta</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {formatDateOnly(titular.fechaAlta, { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        </div>
        <div className="flex justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-[#e4e4e7] dark:border-[#3f3f46]">
          <span className="text-sm text-gray-500">Dirección</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white text-right">
            {titular.direccion}
          </span>
        </div>
      </div>
    </section>
  );
};
