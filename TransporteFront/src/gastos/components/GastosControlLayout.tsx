import type { ComponentProps } from 'react';
import { MonthYearFilter } from '../../shared/ui';
import { GastosPageHeader } from './GastosPageHeader';
import { GastosHeroCard } from './GastosHeroCard';
import { GastosToolbar } from './GastosToolbar';
import { GastosContent } from './GastosContent';
import { RegistrarGastoModal } from './RegistrarGastoModal';
import { RegistrarIngresoModal } from './RegistrarIngresoModal';
import { GastosDeleteDialog, type GastosDeleteDialogProps } from './GastosDeleteDialog';
import { GastosCategoriasCarousel, type GastosCategoriasCarouselItem } from './GastosCategoriasCarousel';
import type { GastosTabValue } from '../types/gastos.types';

type GastosControlLayoutProps = {
  periodLabel: string;
  selectedMes: number;
  selectedAnio: number;
  activeTab: GastosTabValue;
  heroTotals: ComponentProps<typeof GastosHeroCard>['totales'];
  categoriaResumen: GastosCategoriasCarouselItem[];
  headerActions: {
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
  categoriaResumen,
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
  <div className="min-h-screen w-full overflow-x-hidden bg-slate-100 pb-24 dark:bg-slate-950">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <GastosHeroCard
        totales={heroTotals}
        periodLabel={periodLabel}
        periodFilter={
          <div className="rounded-2xl border border-white/50 bg-white/90 p-4 text-slate-700 shadow-lg dark:border-white/10 dark:bg-slate-900">
            <MonthYearFilter selectedMes={selectedMes} selectedAnio={selectedAnio} onFilterChange={onFilterChange} />
          </div>
        }
      />

      <GastosCategoriasCarousel items={categoriaResumen} />

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

    <button
      type="button"
      onClick={headerActions.onRegistrarGasto}
      className="fixed bottom-6 right-5 z-30 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 px-6 py-3 text-base font-semibold text-white shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 dark:from-teal-400 dark:to-cyan-400"
    >
      <span className="material-symbols-rounded text-3xl" aria-hidden>
        add
      </span>
      Nuevo gasto
    </button>
  </div>
);
