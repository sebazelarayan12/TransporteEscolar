import { Link } from 'react-router-dom';
import { PasajeroForm } from '../components/PasajeroForm';

export const PasajeroCreatePage = () => {
  return (
    <div className="min-h-full w-full bg-[#fafafa] dark:bg-[#18181b] flex flex-col">
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/pasajeros"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#007a8a] dark:hover:text-[#007a8a] transition-colors mb-4"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Volver a Pasajeros
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Nuevo Pasajero
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Complete los datos del nuevo pasajero. Todos los campos son obligatorios excepto observaciones.
          </p>
        </div>

        {/* Card con formulario */}
        <div className="bg-white dark:bg-[#27272a] rounded-xl border border-[#e4e4e7] dark:border-[#3f3f46] shadow-sm p-6 sm:p-8">
          <PasajeroForm />
        </div>
      </div>
    </div>
  );
};
