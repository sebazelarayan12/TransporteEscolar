export const getInitials = (nombre: string, apellido: string): string => {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
};

export const getAvatarColor = (id: number): string => {
  const colors = [
    'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300',
    'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300',
    'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
    'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300',
    'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300',
  ];
  return colors[id % colors.length];
};
