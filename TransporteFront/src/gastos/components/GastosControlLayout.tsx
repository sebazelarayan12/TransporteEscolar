import type { ComponentProps } from 'react';
import { MonthYearFilter } from '../../shared/ui';
import { GastosPageHeader } from './GastosPageHeader';
import { GastosHeroCard } from './GastosHeroCard';
import { GastosToolbar } from './GastosToolbar';
import { GastosContent } from './GastosContent';
import { RegistrarGastoModal } from './RegistrarGastoModal';
import { RegistrarIngresoModal } from './RegistrarIngresoModal';
import { GastosDeleteDialog, type GastosDeleteDialogProps } from './GastosDeleteDialog';
import type { GastosTabValue } from '../types/gastos.types';

type GastosControlLayoutProps = {
  periodLabel: string;
  selectedMes: number;
  selectedAnio: number;
  activeTab: GastosTabValue;
  heroTotals: ComponentProps<typeof GastosHeroCard>['totales'];
  headerActions: {
    onRegistrarIngreso: () => void;
    onRegistrarGasto: () => void;
  };
  onFilterChange: (mes: number, anio: number) => void;
  onTabChange: (tab: GastosTabValue) => void;
  toolbarCounts: {
    variables: number;
    fijos: number;
  };
  isToolbarRefreshing: boolean;
  gastoModalKey: string;
  gastoSection: ComponentProps<typeof GastosContent>['gastoSection'];
  ingresosSection: ComponentProps<typeof GastosContent>['ingresosSection'];
  gastoModalProps: ComponentProps<typeof RegistrarGastoModal>;
  ingresoModalKey: string;
  ingresoModalProps: ComponentProps<typeof RegistrarIngresoModal>;
  deleteDialogProps: GastosDeleteDialogProps;
};

export const GastosControlLayout = ({
  periodLabel,
  selectedMes,
  selectedAnio,
  activeTab,
  heroTotals,
  headerActions,
  onFilterChange,
  onTabChange,
  toolbarCounts,
  isToolbarRefreshing,
  gastoModalKey,
  gastoSection,
  ingresosSection,
  gastoModalProps,
  ingresoModalKey,
  ingresoModalProps,
  deleteDialogProps,
}: GastosControlLayoutProps) => (
  <div className="min-h-screen w-full overflow-x-hidden bg-[#fafafa] pb-10 dark:bg-[#18181b]">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <GastosPageHeader
        onRegistrarIngreso={headerActions.onRegistrarIngreso}
        onRegistrarGasto={headerActions.onRegistrarGasto}
      />

      <MonthYearFilter selectedMes={selectedMes} selectedAnio={selectedAnio} onFilterChange={onFilterChange} />

      <GastosHeroCard totales={heroTotals} periodLabel={periodLabel} />

      <GastosToolbar
        activeTab={activeTab}
        onChange={onTabChange}
        counts={toolbarCounts}
        isRefreshing={isToolbarRefreshing}
      />

      <GastosContent gastoSection={gastoSection} ingresosSection={ingresosSection} />

      <RegistrarGastoModal key={gastoModalKey} {...gastoModalProps} />

      <RegistrarIngresoModal key={ingresoModalKey} {...ingresoModalProps} />

      <GastosDeleteDialog {...deleteDialogProps} />
    </div>
  </div>
);
