interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

export const Alert = ({ children, variant = 'info', className = '' }: AlertProps) => {
  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`border-l-4 p-3 sm:p-4 rounded text-sm sm:text-base ${variantStyles[variant]} ${className}`} role="alert">
      {children}
    </div>
  );
};

export const EmptyState = ({ message = 'No hay datos para mostrar' }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px] gap-2 sm:gap-3 p-4">
      <svg
        className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <p className="text-sm sm:text-base text-gray-500 text-center">{message}</p>
    </div>
  );
};

export const ErrorState = ({ message = 'Ocurrió un error' }: { message?: string }) => {
  return (
    <Alert variant="error">
      <p className="font-medium text-sm sm:text-base">Error</p>
      <p className="text-xs sm:text-sm mt-1">{message}</p>
    </Alert>
  );
};
