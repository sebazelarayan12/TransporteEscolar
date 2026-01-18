interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner = ({ size = 'md', className = '' }: SpinnerProps) => {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-3',
    lg: 'w-10 h-10 sm:w-12 sm:h-12 border-3 sm:border-4',
  };

  return (
    <div
      className={`${sizeStyles[size]} border-blue-600 border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
};

export const LoadingScreen = ({ message = 'Cargando...' }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] gap-3 sm:gap-4 p-4">
      <Spinner size="lg" />
      <p className="text-sm sm:text-base text-gray-600 text-center">{message}</p>
    </div>
  );
};
