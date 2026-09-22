import type { ReactNode } from 'react';
import { Amount } from '../../shared/ui/Amount';
import type { DashboardSummary } from '../types/dashboard.types';

interface DashboardSummaryKpisProps {
  summary?: DashboardSummary;
  isLoading: boolean;
}

const Skeleton = ({ className }: { className: string }) => (
  <span className={`inline-block animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`} />
);

interface KpiValueProps {
  showSkeleton: boolean;
  skeletonClassName: string;
  children: ReactNode;
}

/** Muestra el skeleton mientras carga, o el contenido (o "--" si no hay dato). */
const KpiValue = ({ showSkeleton, skeletonClassName, children }: KpiValueProps) =>
  showSkeleton ? <Skeleton className={skeletonClassName} /> : (children ?? '--');

interface PaymentKpiCardProps {
  icon: string;
  label: string;
  accentBubbleClass: string;
  iconBoxClass: string;
  countClass: string;
  showSkeleton: boolean;
  total?: number;
  count?: number;
}

const PaymentKpiCard = ({
  icon,
  label,
  accentBubbleClass,
  iconBoxClass,
  countClass,
  showSkeleton,
  total,
  count,
}: PaymentKpiCardProps) => (
  <div className="relative overflow-hidden rounded-2xl border border-[#d9e3e8] bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
    <div className={`absolute -right-10 -top-6 h-28 w-28 rounded-full ${accentBubbleClass}`} />
    <div className="relative space-y-3">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBoxClass}`}>
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-[#0f181a] dark:text-white">
          <KpiValue showSkeleton={showSkeleton} skeletonClassName="h-8 w-24">
            {total === undefined ? null : <Amount value={total} />}
          </KpiValue>
        </span>
        <span className={`text-xs font-bold ${countClass}`}>
          <KpiValue showSkeleton={showSkeleton} skeletonClassName="h-4 w-16">
            {count === undefined ? null : `${count} cuentas`}
          </KpiValue>
        </span>
      </div>
    </div>
  </div>
);

interface CountKpiCardProps {
  icon: string;
  iconClassName: string;
  label: string;
  showSkeleton: boolean;
  value?: number;
}

const CountKpiCard = ({ icon, iconClassName, label, showSkeleton, value }: CountKpiCardProps) => (
  <div className="flex items-center gap-4 rounded-2xl border border-[#d9e3e8] bg-white px-5 py-4 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300">
      <span className={`material-symbols-outlined ${iconClassName}`}>{icon}</span>
    </div>
    <div>
      <p className="text-2xl font-bold text-[#0f181a] dark:text-white">
        <KpiValue showSkeleton={showSkeleton} skeletonClassName="h-7 w-16">
          {value}
        </KpiValue>
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  </div>
);

export const DashboardSummaryKpis = ({ summary, isLoading }: DashboardSummaryKpisProps) => {
  const showSkeleton = isLoading && !summary;

  // Nunca se muestran pendientes y vencidos a la vez (ver PagosStatusFilters): mientras no pasó
  // el vencimiento del mes se ve "pendientes"; después, "vencidos". Mientras summary es
  // undefined (skeleton) se muestra la tarjeta de pendientes por defecto, sin parpadeo.
  const mostrarVencidos = summary?.vencimientoPasado ?? false;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        {mostrarVencidos ? (
          <PaymentKpiCard
            icon="warning"
            label="Pagos vencidos"
            accentBubbleClass="bg-rose-500/10"
            iconBoxClass="bg-rose-500/10 text-rose-500"
            countClass="text-rose-500"
            showSkeleton={showSkeleton}
            total={summary?.totalVencido}
            count={summary?.cantidadVencido}
          />
        ) : (
          <PaymentKpiCard
            icon="pending_actions"
            label="Pagos pendientes"
            accentBubbleClass="bg-[#1d8ca5]/10"
            iconBoxClass="bg-[#1d8ca5]/10 text-[#1d8ca5]"
            countClass="text-[#1d8ca5]"
            showSkeleton={showSkeleton}
            total={summary?.totalPendiente}
            count={summary?.cantidadPendiente}
          />
        )}
      </div>

      <div className="md:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CountKpiCard
          icon="supervisor_account"
          iconClassName="text-[22px]"
          label="Titulares activos"
          showSkeleton={showSkeleton}
          value={summary?.titularesActivos}
        />
        <CountKpiCard
          icon="school"
          iconClassName="text-[22px]"
          label="Pasajeros"
          showSkeleton={showSkeleton}
          value={summary?.pasajerosActivos}
        />
      </div>
    </section>
  );
};
