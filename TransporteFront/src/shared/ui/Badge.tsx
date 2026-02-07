interface BadgeProps {
  variant: 'active' | 'inactive';
  animated?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const Badge = ({ variant, animated = false, size = 'sm', className = '' }: BadgeProps) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
  };

  const dotSizeClasses = {
    xs: 'size-1',
    sm: 'size-1.5',
    md: 'size-2',
  };

  if (variant === 'active') {
    return (
      <span className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-semibold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 ${className}`}>
        <span className={`${dotSizeClasses[size]} rounded-full bg-green-500 ${animated ? 'animate-pulse' : ''}`} />
        Activo
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-semibold bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 ${className}`}>
      Inactivo
    </span>
  );
};
