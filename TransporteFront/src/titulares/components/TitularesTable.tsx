import type { TitularResponse } from '../types/titular.types';
import { TitularTableHeader } from './TitularTableHeader';
import { TitularTableRow } from './TitularTableRow';

interface TitularesTableProps {
  titulares: TitularResponse[];
  selectedTitularId?: number;
  onSelect: (titular: TitularResponse) => void;
}

export const TitularesTable = ({ titulares, selectedTitularId, onSelect }: TitularesTableProps) => (
  <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a]">
    <div className="custom-scrollbar flex-1 overflow-y-auto">
      <TitularTableHeader />
      {titulares.length > 0 ? (
        titulares.map((titular, rowIndex) => (
          <TitularTableRow
            key={titular.id}
            titular={titular}
            isSelected={selectedTitularId === titular.id}
            onClick={() => onSelect(titular)}
            rowIndex={rowIndex}
          />
        ))
      ) : (
        <div className="flex h-32 items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No se encontraron titulares para este filtro</p>
        </div>
      )}
    </div>
  </div>
);
