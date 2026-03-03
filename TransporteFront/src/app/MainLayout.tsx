import { Link, Outlet, useLocation } from 'react-router-dom';
import { Suspense, useState } from 'react';
import { Spinner } from '../shared/ui/Spinner';
import { NotificacionesDropdown } from '../notificaciones';

const LayoutContentFallback = () => (
  <div className="flex min-h-[360px] w-full items-center justify-center px-6 py-10">
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#d9e3e8] bg-white/80 px-6 py-8 text-[#1d8ca5] shadow-sm dark:border-white/10 dark:bg-[#1f1f24]/80">
      <Spinner size="lg" />
      <p className="text-xs font-semibold uppercase tracking-[0.3em]">Cargando sección</p>
    </div>
  </div>
);

type NavigationItem = {
  name: string;
  href: string;
  icon: string;
  match?: 'exact' | 'startsWith';
};

export const MainLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: 'dashboard', match: 'exact' },
    { name: 'Titulares', href: '/titulares', icon: 'group', match: 'startsWith' },
    { name: 'Pasajeros', href: '/pasajeros', icon: 'face', match: 'startsWith' },
    { name: 'Horarios', href: '/horarios', icon: 'schedule', match: 'startsWith' },
    { name: 'Reinscripciones', href: '/reinscripciones', icon: 'assignment_returned', match: 'startsWith' },
    { name: 'Pagos', href: '/pagos', icon: 'payments', match: 'exact' },
    { name: 'Control de gastos', href: '/gastos', icon: 'receipt_long', match: 'exact' },
    { name: 'Historial de movimientos', href: '/pagos/movimientos', icon: 'history', match: 'startsWith' },
  ];

  const isActive = (item: NavigationItem) => {
    if (item.match === 'exact') {
      return location.pathname === item.href;
    }
    return location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#18181b] antialiased flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          role="button"
          tabIndex={0}
          aria-label="Cerrar menú lateral"
          onClick={closeSidebar}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              closeSidebar();
            }
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#27272a] border-r border-[#e4e4e7] dark:border-[#3f3f46] flex flex-col
          transform transition-transform duration-300 z-50
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto shrink-0
        `}
      >
        {/* Brand */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-[#007a8a] to-cyan-400 flex items-center justify-center shadow-lg shadow-[#007a8a]/20 text-white">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold leading-tight text-gray-900 dark:text-white">
                Transporte<br />Escolar
              </h1>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Menú Principal</p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={closeSidebar}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group
                ${
                  isActive(item)
                    ? 'bg-[#007a8a]/10 text-[#007a8a] dark:text-cyan-400 font-semibold shadow-sm ring-1 ring-[#007a8a]/20 dark:ring-[#007a8a]/40'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                }
              `}
            >
              <span className={`material-symbols-outlined text-[22px] transition-colors ${isActive(item) ? "[font-variation-settings:'FILL'_1]" : 'group-hover:text-[#007a8a]'}`}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile Stub */}
        <div className="p-4 border-t border-[#e4e4e7] dark:border-[#3f3f46]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
            <div className="size-9 rounded-full bg-gradient-to-br from-[#007a8a] to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Admin Principal</p>
              <p className="text-xs text-gray-500 truncate">admin@school.edu</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden w-full">
        {/* Top Header - mobile */}
        <header className="bg-[#fafafa] dark:bg-[#18181b] z-10 shrink-0 lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Hamburger menu */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-900 dark:text-white"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <h2 className="flex-1 text-base font-semibold text-gray-900 dark:text-white">
              {navigation.find((item) => isActive(item))?.name || 'Dashboard'}
            </h2>

            {/* Notificaciones - siempre visibles en mobile */}
            <NotificacionesDropdown />
          </div>
        </header>

        {/* Desktop top bar - solo visible en lg+ */}
        <header className="hidden lg:flex items-center justify-end gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm relative z-50">
          <NotificacionesDropdown />
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#007a8a] to-cyan-400 flex items-center justify-center text-sm font-bold text-white">
            EA
          </div>
        </header>

        {/* Page Content - sin padding, cada página controla su layout */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          <Suspense fallback={<LayoutContentFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};
