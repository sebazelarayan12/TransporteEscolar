interface Stat {
  label: string;
  value: number;
  trend: string;
  color: string;
  badge: string;
}

interface ReinscripcionStatsProps {
  stats: Stat[];
}

export const ReinscripcionStats = ({ stats }: ReinscripcionStatsProps) => {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {stats.map((item) => (
        <div key={item.label} className="rounded-2xl border border-[#e1e8ec] bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold ${item.color}`}>{item.value}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.badge}`}>{item.trend}</span>
          </div>
        </div>
      ))}
    </section>
  );
};
