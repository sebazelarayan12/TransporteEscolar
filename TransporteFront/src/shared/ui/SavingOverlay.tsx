/** Capa de "Guardando cambios..." que cubre el contenido de un modal mientras se guarda. */
export const SavingOverlay = () => (
  <div className="absolute inset-0 bg-white/80 dark:bg-[#27272a]/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007a8a]" />
      <p className="text-sm text-gray-600 dark:text-gray-400">Guardando cambios...</p>
    </div>
  </div>
);
