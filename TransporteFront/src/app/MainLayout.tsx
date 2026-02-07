import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';

export const MainLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'dashboard' },
    { name: 'Titulares', href: '/titulares', icon: 'group' },
    { name: 'Pasajeros', href: '/pasajeros', icon: 'face' },
    { name: 'Reinscripciones', href: '/reinscripciones', icon: 'assignment_returned' },
    { name: 'Pagos', href: '/pagos', icon: 'payments' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#18181b] antialiased flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
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
                  isActive(item.href)
                    ? 'bg-[#007a8a]/10 text-[#007a8a] dark:text-cyan-400 font-semibold shadow-sm ring-1 ring-[#007a8a]/20 dark:ring-[#007a8a]/40'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                }
              `}
            >
              <span className={`material-symbols-outlined text-[22px] transition-colors ${isActive(item.href) ? '[font-variation-settings:\'FILL\'_1]' : 'group-hover:text-[#007a8a]'}`}>
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
        {/* Top Header - solo visible en mobile */}
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
            
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {navigation.find((item) => isActive(item.href))?.name || 'Dashboard'}
            </h2>
          </div>
        </header>

        {/* Page Content - sin padding, cada página controla su layout */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
