import type { GastoItem } from '../types/gastos.types';
import type { IngresoItem } from '../types/ingresos.types';
import { GastoListSection } from './GastoListSection';
import { IngresosExternosSection } from './IngresosExternosSection';

type GastoSectionProps = {
  title: string;
  subtitle: string;
  gastos: GastoItem[];
  totalAmount: number;
  emptyMessage: string;
  isRefreshing: boolean;
  actionsDisabled: boolean;
  onEditGasto: (gasto: GastoItem) => void;
  onDeleteGasto: (gasto: GastoItem) => void;
};

type IngresosSectionProps = {
  ingresosFijos: IngresoItem[];
  ingresosVariables: IngresoItem[];
  totalGeneral: number;
  totalFijos: number;
  totalVariables: number;
  isLoading: boolean;
  isRefreshing: boolean;
  actionsDisabled: boolean;
  onRegistrarIngreso: () => void;
  onEditIngreso: (ingreso: IngresoItem) => void;
  onDeleteIngreso: (ingreso: IngresoItem) => void;
};

type GastosContentProps = {
  gastoSection: GastoSectionProps;
  ingresosSection: IngresosSectionProps;
};

export const GastosContent = ({ gastoSection, ingresosSection }: GastosContentProps) => (
  <>
    <GastoListSection
      title={gastoSection.title}
      subtitle={gastoSection.subtitle}
      gastos={gastoSection.gastos}
      totalAmount={gastoSection.totalAmount}
      isLoading={false}
      isRefreshing={gastoSection.isRefreshing}
      emptyMessage={gastoSection.emptyMessage}
      onEditGasto={gastoSection.onEditGasto}
      onDeleteGasto={gastoSection.onDeleteGasto}
      actionsDisabled={gastoSection.actionsDisabled}
    />

    <IngresosExternosSection
      ingresosFijos={ingresosSection.ingresosFijos}
      ingresosVariables={ingresosSection.ingresosVariables}
      totalGeneral={ingresosSection.totalGeneral}
      totalFijos={ingresosSection.totalFijos}
      totalVariables={ingresosSection.totalVariables}
      isLoading={ingresosSection.isLoading}
      isRefreshing={ingresosSection.isRefreshing}
      onRegistrarIngreso={ingresosSection.onRegistrarIngreso}
      onEditIngreso={ingresosSection.onEditIngreso}
      onDeleteIngreso={ingresosSection.onDeleteIngreso}
      actionsDisabled={ingresosSection.actionsDisabled}
    />
  </>
);
