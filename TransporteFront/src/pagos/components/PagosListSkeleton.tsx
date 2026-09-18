import { Skeleton, SkeletonTableRow } from '../../shared/ui/Skeleton';

const TABLE_COLUMNS = ['Titular', 'Periodo', 'Monto Generado', 'Total Pagado', 'Saldo Pendiente', 'Estado'];

export const PagosListSkeleton = () => (
  <div className="min-h-full w-full bg-zinc-50 dark:bg-zinc-900">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-5 shadow-sm dark:border-white/5 dark:bg-zinc-900">
        <Skeleton className="mb-2 h-3 w-28" />
        <Skeleton className="mb-2 h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-white/5 dark:bg-zinc-900">
        <div className="hidden md:block">
          <table className="w-full" aria-label="Cargando pagos">
            <thead className="border-b border-zinc-200 dark:border-zinc-700">
              <tr className="bg-zinc-50 dark:bg-zinc-800">
                {TABLE_COLUMNS.map((col) => (
                  <th key={col} scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonTableRow key={i} cols={6} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-700 md:hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
