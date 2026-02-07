interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination = ({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  className = '',
}: PaginationProps) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Generar array de páginas a mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // Máximo de números de página visibles

    if (totalPages <= maxVisible) {
      // Si hay pocas páginas, mostrarlas todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para páginas con ellipsis
      if (currentPage <= 3) {
        // Cerca del inicio
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Cerca del final
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        // En el medio
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Info de resultados */}
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Mostrando <span className="font-medium">{startItem}</span> a{' '}
        <span className="font-medium">{endItem}</span> de{' '}
        <span className="font-medium">{totalCount}</span> resultados
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        {/* Botón Primera */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#27272a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3f3f46] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Primera página"
        >
          <span className="hidden sm:inline">Primera</span>
          <span className="sm:hidden material-symbols-outlined text-[18px]">first_page</span>
        </button>

        {/* Botón Anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#27272a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3f3f46] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {/* Números de página */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md border transition-colors
                  ${
                    isActive
                      ? 'bg-[#007a8a] text-white border-[#007a8a]'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#27272a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3f3f46]'
                  }
                `}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Indicador de página actual en móvil */}
        <div className="sm:hidden px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentPage} / {totalPages}
        </div>

        {/* Botón Siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#27272a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3f3f46] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>

        {/* Botón Última */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#27272a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3f3f46] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Última página"
        >
          <span className="hidden sm:inline">Última</span>
          <span className="sm:hidden material-symbols-outlined text-[18px]">last_page</span>
        </button>
      </div>
    </div>
  );
};
