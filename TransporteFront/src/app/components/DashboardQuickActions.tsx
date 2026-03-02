import { Link } from 'react-router-dom';

export interface DashboardQuickAction {
  id: string;
  lines: [string, string];
  icon: string;
  href: string;
  variant: 'primary' | 'default' | 'subtle';
}

interface DashboardQuickActionsProps {
  actions: DashboardQuickAction[];
}

export const DashboardQuickActions = ({ actions }: DashboardQuickActionsProps) => (
  <section className="overflow-hidden">
    <h3 className="mb-4 text-lg font-bold text-[#0f181a] dark:text-white">Acciones rápidas</h3>
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 no-scrollbar sm:gap-4 sm:mx-0 sm:px-0">
      {actions.map((action) => {
        const isPrimary = action.variant === 'primary';
        const isSubtle = action.variant === 'subtle';
        const baseClasses = isPrimary
          ? 'bg-[#38bdf8] text-[#0c4a6e] shadow-lg shadow-[#38bdf8]/30 hover:bg-[#0ea5e9]'
          : 'bg-white border border-[#e1e8ec] text-[#0f181a] shadow-sm dark:bg-[#1f1f24] dark:border-white/5';
        const subtleClasses = isSubtle ? 'text-gray-600 dark:text-gray-300' : 'text-[#1d8ca5]';

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
);
