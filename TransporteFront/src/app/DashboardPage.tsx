import { useBackendHealth } from '../shared/hooks/useBackendHealth';
import { useDashboardResumen } from './services/dashboard.queries';
import { Alert } from '../shared/ui/Alert';
import { DashboardHeaderCard } from './components/DashboardHeaderCard';
import { DashboardWelcomeStatus } from './components/DashboardWelcomeStatus';
import { DashboardSummaryKpis } from './components/DashboardSummaryKpis';
import { DashboardRecaudacionChart } from './components/DashboardRecaudacionChart';
import { DashboardQuickActions, type DashboardQuickAction } from './components/DashboardQuickActions';
import { DashboardActivityFeed } from './components/DashboardActivityFeed';

const quickActions: DashboardQuickAction[] = [
  {
    id: 'pago',
    lines: ['Registrar', 'Pago'],
    icon: 'payments',
    href: '/pagos',
    variant: 'primary',
  },
  {
    id: 'inscripcion',
    lines: ['Nueva', 'Inscripción'],
    icon: 'person_add',
    href: '/titulares/nuevo',
    variant: 'default',
  },
  {
    id: 'aviso',
    lines: ['Enviar', 'Aviso'],
    icon: 'send',
    href: '/not-found',
    variant: 'subtle',
  },
];

export const DashboardPage = () => {
  const { data: healthCheck } = useBackendHealth();
  const { data, isLoading, error } = useDashboardResumen();
  const isSystemActive = healthCheck?.isHealthy ?? false;
  const summary = data?.summary;
  const chartData = data?.recaudacion ?? [];
  const activityItems = data?.actividadReciente ?? [];
  const getErrorMessage = (err: unknown) => {
    if (!err) return 'No se pudieron cargar los datos del dashboard.';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && 'message' in err && typeof (err as { message?: string }).message === 'string') {
      return (err as { message?: string }).message ?? 'No se pudieron cargar los datos del dashboard.';
    }
    return 'No se pudieron cargar los datos del dashboard.';
  };
  return (
    <div className="min-h-full w-full bg-[#f6f8f8] dark:bg-[#0f1416] text-[#0f181a] dark:text-white overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {error && (
          <Alert variant="error" className="border border-rose-100 text-sm sm:text-base">
            {getErrorMessage(error)}
          </Alert>
        )}
        <DashboardHeaderCard />
        <DashboardWelcomeStatus isSystemActive={isSystemActive} />
        <DashboardSummaryKpis summary={summary} isLoading={isLoading} />
        <DashboardRecaudacionChart chartData={chartData} isLoading={isLoading} />
        <DashboardQuickActions actions={quickActions} />
        <DashboardActivityFeed activityItems={activityItems} isLoading={isLoading} />
      </div>
    </div>
  );
};
