import { useEffect, useRef, useState } from 'react';

interface CardActionItem {
  id: string;
  label: string;
  icon: string;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface CardActionsMenuProps {
  items: CardActionItem[];
  disabled?: boolean;
}

export const CardActionsMenu = ({ items, disabled = false }: CardActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isMenuOpen = isOpen && !disabled;

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#1f1f24] dark:text-gray-300 dark:hover:text-white"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={() => {
          if (disabled) {
            return;
          }
          setIsOpen((prev) => !prev);
        }}
        disabled={disabled}
      >
        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
        <span className="sr-only">Acciones de la tarjeta!</span>
      </button>

      {isMenuOpen ? (
        <div className="absolute right-0 top-10 z-20 w-48 rounded-2xl border border-gray-100 bg-white p-1 shadow-lg ring-1 ring-black/5 dark:border-white/10 dark:bg-[#1f1f24]">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.disabled) {
                  return;
                }
                item.onSelect();
                setIsOpen(false);
              }}
              disabled={item.disabled}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-gray-50 dark:hover:bg-white/5 ${item.destructive ? 'text-rose-600 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200' : 'text-gray-700 dark:text-gray-200'
                } ${item.disabled ? 'opacity-60 hover:bg-transparent dark:hover:bg-transparent' : ''}`}
            >
              <span>{item.label}</span>
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export type { CardActionItem };
