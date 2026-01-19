interface AvatarProps {
  initials: string;
  colorClass: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'size-10',
  md: 'size-12',
  lg: 'size-14',
  xl: 'size-16',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
};

export const Avatar = ({ initials, colorClass, size = 'sm', className = '' }: AvatarProps) => {
  return (
    <div className={`${sizeClasses[size]} rounded-full ${colorClass} flex items-center justify-center font-bold ${textSizeClasses[size]} border border-transparent shadow-sm ${className}`}>
      {initials}
    </div>
  );
};
