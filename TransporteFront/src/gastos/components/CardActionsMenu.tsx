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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  className?: string;
  triggerClassName?: string;
  menuOffsetClassName?: string;
}

const MENU_OFFSET_DEFAULT = 'right-0 top-10';

export const CardActionsMenu = ({
  items,
  disabled = false,
  open,
  onOpenChange,
  hideTrigger = false,
  className = '',
  triggerClassName = '',
  menuOffsetClassName = MENU_OFFSET_DEFAULT,
}: CardActionsMenuProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isControlled = typeof open === 'boolean';
  const rawIsOpen = isControlled ? (open as boolean) : internalOpen;
  const isMenuOpen = rawIsOpen && !disabled;

  const setOpenState = (next: boolean) => {
    if (disabled) {
      return;
    }
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  };

  const toggleMenu = () => {
    setOpenState(!rawIsOpen);
  };

  const closeMenu = () => {
    setOpenState(false);
  };

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (disabled) {
          return;
        }
        if (isControlled) {
          onOpenChange?.(false);
        } else {
          setInternalOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [disabled, isControlled, isMenuOpen, onOpenChange]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative ${className}`.trim()}
      ref={menuRef}
      role="presentation"
      tabIndex={-1}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.stopPropagation();
        }
      }}
    >
      {hideTrigger ? null : (
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#1f1f24] dark:text-gray-300 dark:hover:text-white ${triggerClassName}`.trim()}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => {
            if (disabled) {
              return;
            }
            toggleMenu();
          }}
          disabled={disabled}
        >
          <span className="material-symbols-outlined text-[20px]">more_horiz</span>
          <span className="sr-only">Acciones de la tarjeta!</span>
        </button>
      )}

      {isMenuOpen ? (
        <div
          className={`absolute z-20 w-48 rounded-2xl border border-gray-100 bg-white p-1 shadow-lg ring-1 ring-black/5 dark:border-white/10 dark:bg-[#1f1f24] ${menuOffsetClassName}`.trim()}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.disabled) {
                  return;
                }
                item.onSelect();
                closeMenu();
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
