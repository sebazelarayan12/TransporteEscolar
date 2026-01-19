interface BadgeProps {
  variant: 'active' | 'inactive';
  animated?: boolean;
  className?: string;
}

export const Badge = ({ variant, animated = false, className = '' }: BadgeProps) => {
  if (variant === 'active') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 ${className}`}>
        <span className={`size-1.5 rounded-full bg-green-500 ${animated ? 'animate-pulse' : ''}`} />
        Activo
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 ${className}`}>
      Inactivo
    </span>
  );
};
