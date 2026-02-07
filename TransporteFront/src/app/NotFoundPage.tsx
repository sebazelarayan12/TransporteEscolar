import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen w-full bg-[#fafafa] dark:bg-[#18181b] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="rounded-3xl border border-[#e1e8ec] bg-white p-8 shadow-lg dark:border-white/5 dark:bg-[#1f1f24]">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <span className="material-symbols-outlined text-[120px] text-gray-300 dark:text-gray-600">
              sentiment_dissatisfied
            </span>
          </div>

          {/* Error Code */}
          <h1 className="text-6xl font-bold text-[#1d8ca5] mb-4">404</h1>

          {/* Title */}
          <h2 className="text-2xl font-bold text-[#0f181a] dark:text-white mb-3">
            Página no encontrada
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Lo sentimos, la página que estás buscando no existe o aún no está disponible.
          </p>

          {/* Action Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#1d8ca5] px-6 py-3 font-semibold text-white shadow-lg shadow-[#1d8ca5]/30 hover:bg-[#187286] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
            Volver al inicio
          </Link>

          {/* Additional Help */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Si crees que esto es un error, por favor contacta al administrador del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
