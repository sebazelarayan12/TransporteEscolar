import { GASTO_TIPOS, type GastoTipo } from '../types/gastos.types';
import { TipoSelector } from './TipoSelector';

interface GastoTipoSectionProps {
  isEditMode: boolean;
  selectedTipo: GastoTipo;
  onSelectTipo: (tipo: GastoTipo) => void;
}

const GASTO_TIPO_OPTIONS = [
  { value: GASTO_TIPOS.VARIABLE, icon: 'dynamic_form' },
  { value: GASTO_TIPOS.FIJO, icon: 'deployed_code' },
] as const;

export const GastoTipoSection = ({ isEditMode, selectedTipo, onSelectTipo }: GastoTipoSectionProps) => (
  <TipoSelector
    title="Tipo de gasto"
    isEditMode={isEditMode}
    editMessage="Editás la plantilla del gasto fijo seleccionado. Los cambios impactan en este mes y los próximos."
    options={GASTO_TIPO_OPTIONS}
    selected={selectedTipo}
    onSelect={onSelectTipo}
  />
);
