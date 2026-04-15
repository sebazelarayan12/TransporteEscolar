import { formatCurrency } from '../../shared/utils/currency.helpers';

interface PaymentStatsProps {
  generated: number;
  paid: number;
  balance: number;
}

export const PaymentStats = ({ generated, paid, balance }: PaymentStatsProps) => {
  const stats = [
    { label: 'Total generado', value: generated, description: 'Actualizado con los filtros aplicados' },
    { label: 'Pagos confirmados', value: paid, description: 'Actualizado con los filtros aplicados' },
    { label: 'Saldo pendiente', value: balance, description: 'Saldo concentrado en familias con vencimiento', isBalance: true },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-[#e1e8ec] bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
          <p className={`mt-2 text-3xl font-bold ${stat.isBalance ? 'text-rose-500' : 'text-[#0f181a] dark:text-white'}`}>
            {formatCurrency(stat.value)}
          </p>
          <p className="text-xs text-gray-500">{stat.description}</p>
        </div>
      ))}
    </section>
  );
};
