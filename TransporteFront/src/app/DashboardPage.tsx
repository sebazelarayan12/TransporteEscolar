import { Link } from 'react-router-dom';
import { useBackendHealth } from '../shared/hooks/useBackendHealth';
import { useDashboardResumen } from './services/dashboard.queries';
import { Spinner } from '../shared/ui/Spinner';
import { Alert } from '../shared/ui/Alert';

const quickActions = [
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

const getNameInitials = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0))
    .join('')
    .toUpperCase() || '--';

export const DashboardPage = () => {
  const { data: healthCheck } = useBackendHealth();
  const { data, isLoading, error } = useDashboardResumen();
  const isSystemActive = healthCheck?.isHealthy ?? false;
  const summary = data?.summary;
  const chartData = data?.recaudacion ?? [];
  const activityItems = data?.actividadReciente ?? [];
  const chartTotals = chartData.map((point) => point.totalGenerado || point.totalPagado || 0);
  const maxValue = Math.max(0, ...chartTotals) || 1;
  const showSummarySkeleton = isLoading && !summary;
  const showChartSkeleton = isLoading && chartData.length === 0;
  const showActivitySpinner = isLoading && activityItems.length === 0;

  const currencyFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
  const formatCurrency = (value?: number) => currencyFormatter.format(value ?? 0);
  const formatMonth = (anio: number, mes: number) =>
    new Date(anio, mes - 1).toLocaleString('es-AR', { month: 'short' }).replace('.', '');
  const formatFechaCorta = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  const getInitials = (apellido: string, nombre: string) =>
    `${apellido?.charAt(0) ?? ''}${nombre?.charAt(0) ?? ''}`.toUpperCase() || '--';
  const renderSkeleton = (className: string) => (
    <span className={`inline-block animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`} />
  );
  const getErrorMessage = (err: unknown) => {
    if (!err) return 'No se pudieron cargar los datos del dashboard.';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && 'message' in err && typeof (err as { message?: string }).message === 'string') {
      return (err as { message?: string }).message ?? 'No se pudieron cargar los datos del dashboard.';
    }
    return 'No se pudieron cargar los datos del dashboard.';
  };
  const adminDisplayName = 'Esteban Albornoz';
  const adminInitials = getNameInitials(adminDisplayName);

  return (
    <div className="min-h-full w-full bg-[#f6f8f8] dark:bg-[#0f1416] text-[#0f181a] dark:text-white overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {error && (
          <Alert variant="error" className="border border-rose-100 text-sm sm:text-base">
            {getErrorMessage(error)}
          </Alert>
        )}
        {/* Header */}
        <div className="rounded-3xl border border-[#e1e8ec] bg-white px-5 py-4 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1d8ca5]">Transporte Escolar</p>
              <h1 className="text-2xl font-bold text-[#0f181a] dark:text-white">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#1d8ca5] dark:text-gray-300 dark:hover:bg-white/10"
                aria-label="Notificaciones"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500 dark:border-[#1f1f24]" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#007a8a] to-cyan-400 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#007a8a]/30 dark:border-white/30">
                {adminInitials}
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Resumen general</p>
            <h2 className="text-3xl font-bold text-[#0f181a] dark:text-white">Hola Estela y Esteban 👋</h2>
            <p className="text-sm text-gray-500">Conoce rápidamente el estado del servicio de transporte escolar.</p>
          </div>
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1 shadow-sm ${
            isSystemActive 
              ? 'border-[#e1e8ec] bg-white dark:border-white/5 dark:bg-[#1f1f24]'
              : 'border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-900/20'
          }`}>
            <span className={`h-2 w-2 rounded-full ${
              isSystemActive 
                ? 'animate-pulse bg-emerald-500' 
                : 'bg-rose-500'
            }`} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${
              isSystemActive
                ? 'text-gray-600 dark:text-gray-300'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {isSystemActive ? 'Sistema activo' : 'Sistema inactivo'}
            </span>
          </div>
        </div>

        {/* KPI Grid */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-[#d9e3e8] bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
            <div className="absolute -right-10 -top-6 h-28 w-28 rounded-full bg-[#1d8ca5]/10" />
            <div className="relative space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1d8ca5]/10 text-[#1d8ca5]">
                <span className="material-symbols-outlined text-[24px]">pending_actions</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pagos pendientes</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-[#0f181a] dark:text-white">
                  {showSummarySkeleton ? renderSkeleton('h-8 w-24') : summary ? formatCurrency(summary.totalPendiente) : '--'}
                </span>
                <span className="text-xs font-bold text-[#1d8ca5]">
                  {showSummarySkeleton
                    ? renderSkeleton('h-4 w-16')
                    : summary
                      ? `${summary.cantidadPendiente} cuentas`
                      : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[#d9e3e8] bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
            <div className="absolute -right-10 -top-6 h-28 w-28 rounded-full bg-rose-500/10" />
              <div className="relative space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                  <span className="material-symbols-outlined text-[24px]">warning</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pagos vencidos</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-[#0f181a] dark:text-white">
                    {showSummarySkeleton ? renderSkeleton('h-8 w-24') : summary ? formatCurrency(summary.totalVencido) : '--'}
                  </span>
                  <span className="text-xs font-bold text-rose-500">
                    {showSummarySkeleton
                      ? renderSkeleton('h-4 w-16')
                      : summary
                        ? `${summary.cantidadVencido} cuentas`
                        : '--'}
                  </span>
                </div>
              </div>
            </div>

          <div className="md:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-2xl border border-[#d9e3e8] bg-white px-5 py-4 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300">
                <span className="material-symbols-outlined text-[22px]">supervisor_account</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f181a] dark:text-white">
                  {showSummarySkeleton ? renderSkeleton('h-7 w-16') : summary ? summary.titularesActivos : '--'}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Titulares activos</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-[#d9e3e8] bg-white px-5 py-4 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300">
                <span className="material-symbols-outlined text-[22px]">school</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f181a] dark:text-white">
                  {showSummarySkeleton ? renderSkeleton('h-7 w-16') : summary ? summary.pasajerosActivos : '--'}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Pasajeros</p>
              </div>
            </div>
          </div>
        </section>

        {/* Chart Section */}
        <section className="rounded-3xl border border-[#e1e8ec] bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#0f181a] dark:text-white">Recaudación</h3>
              <p className="text-xs text-gray-500">Ciclo lectivo (Mar-Dic)</p>
            </div>
            <div className="ml-auto flex rounded-2xl border border-[#e1e8ec] bg-[#f6f8f8] p-1 dark:border-white/5 dark:bg-[#0f1416] w-full sm:w-auto">
              <button
                type="button"
                className="flex-1 rounded-xl bg-white px-4 py-1.5 text-xs font-semibold text-[#0f181a] shadow-sm dark:bg-[#0f1416] dark:text-white sm:flex-none"
              >
                Mensual
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl px-4 py-1.5 text-xs font-semibold text-gray-500 transition hover:text-[#0f181a] dark:text-gray-400 sm:flex-none"
              >
                Anual
              </button>
            </div>
          </div>
          <div className="flex h-48 items-end gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar sm:gap-3 sm:overflow-x-visible sm:mx-0 sm:px-0">
            {showChartSkeleton &&
              Array.from({ length: 10 }).map((_, index) => (
                <div key={`chart-skeleton-${index}`} className="flex min-w-[40px] flex-1 flex-col items-center gap-2 sm:min-w-0">
                  <div className="relative w-full rounded-2xl bg-[#e9eff2] dark:bg-white/5" style={{ height: '160px' }}>
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-2xl bg-[#8ed2df] dark:bg-white/10 animate-pulse"
                      style={{ height: `${40 + index * 5}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-600 animate-pulse">---</span>
                </div>
              ))}
            {!showChartSkeleton && chartData.length > 0 &&
              chartData.map((point, index) => {
                const percent = Math.min(((point.totalPagado ?? 0) / maxValue) * 100, 100);
                const isLatest = index === chartData.length - 1;
                return (
                  <div key={`${point.anio}-${point.mes}`} className="flex min-w-[40px] flex-1 flex-col items-center gap-2 sm:min-w-0">
                    <div className="relative w-full rounded-2xl bg-[#e9eff2] dark:bg-white/5" style={{ height: '160px' }}>
                      {isLatest && point.totalPagado > 0 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-[#0f181a] px-2 py-1 text-[10px] font-semibold text-white shadow-sm dark:bg-white/10 dark:text-white">
                          {formatCurrency(point.totalPagado)}
                        </div>
                      )}
                      <div
                        className={`absolute inset-x-0 bottom-0 rounded-2xl ${
                          isLatest
                            ? 'bg-[#1d8ca5] shadow-[0_8px_20px_rgba(29,140,165,0.35)]'
                            : 'bg-[#8ed2df] dark:bg-[#38bdf8]'
                        }`}
                        style={{ height: `${percent}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        isLatest ? 'text-[#1d8ca5]' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {formatMonth(point.anio, point.mes)}
                    </span>
                  </div>
                );
              })}
            {!showChartSkeleton && chartData.length === 0 && (
              <div className="flex w-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                No hay datos de recaudación disponibles
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="overflow-hidden">
          <h3 className="mb-4 text-lg font-bold text-[#0f181a] dark:text-white">Acciones rápidas</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 no-scrollbar sm:gap-4 sm:mx-0 sm:px-0">
            {quickActions.map((action) => {
              const isPrimary = action.variant === 'primary';
              const isSubtle = action.variant === 'subtle';
              const baseClasses = isPrimary
                ? 'bg-[#38bdf8] text-[#0c4a6e] shadow-lg shadow-[#38bdf8]/30 hover:bg-[#0ea5e9]'
                : 'bg-white border border-[#e1e8ec] text-[#0f181a] shadow-sm dark:bg-[#1f1f24] dark:border-white/5';
              const subtleClasses = isSubtle
                ? 'text-gray-600 dark:text-gray-300'
                : 'text-[#1d8ca5]';

              return (
                <Link
                  key={action.id}
                  to={action.href}
                  className={`flex min-w-[180px] flex-shrink-0 items-center gap-3 rounded-2xl px-4 py-4 transition sm:min-w-[210px] sm:gap-4 sm:px-5 ${baseClasses}`}
                >
                  <div
                    className={`rounded-2xl p-2 text-[24px] ${
                      isPrimary
                        ? 'bg-[#0c4a6e]/10 text-[#0c4a6e]'
                        : isSubtle
                          ? 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-300'
                          : 'bg-gray-100 text-[#1d8ca5] dark:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">{action.icon}</span>
                  </div>
                  <div className={`text-sm font-bold leading-tight ${isPrimary ? 'text-[#0c4a6e]' : subtleClasses}`}>
                    <span className="block">{action.lines[0]}</span>
                    <span className="block">{action.lines[1]}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Activity Feed */}
        <section className="pb-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#0f181a] dark:text-white">Actividad reciente</h3>
            <Link to="/pagos" className="text-sm font-semibold text-[#1d8ca5] hover:underline">
              Ver todo
            </Link>
          </div>
          <div className="rounded-3xl border border-[#e1e8ec] bg-white p-3 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
            {showActivitySpinner && (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            )}
            {!showActivitySpinner && activityItems.length > 0 &&
              activityItems.map((item, index) => {
                const initials = getInitials(item.titularApellido, item.titularNombre);
                const montoClass = item.saldoPendiente <= 0 ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400';
                return (
                  <div key={`${item.movimientoId}-${item.titularId}`}>
                    <div className="flex items-center gap-4 rounded-2xl p-3 transition hover:bg-gray-50 dark:hover:bg-white/5">
                      <div className="h-14 w-14 flex-shrink-0 rounded-2xl bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white flex items-center justify-center text-lg font-bold">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#0f181a] dark:text-white truncate">
                          {item.titularNombre} {item.titularApellido}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          Pago {item.periodo} • {item.medioPago}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${montoClass}`}>{formatCurrency(item.monto)}</p>
                        <p className="text-[11px] text-gray-400">{formatFechaCorta(item.fechaPago)}</p>
                      </div>
                    </div>
                    {index < activityItems.length - 1 && <div className="mx-4 h-px bg-[#e1e8ec] dark:bg-white/5" />}
                  </div>
                );
              })}
            {!showActivitySpinner && activityItems.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <span className="material-symbols-outlined text-3xl text-[#1d8ca5]">event_available</span>
                <p>No registramos actividad reciente aún.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
