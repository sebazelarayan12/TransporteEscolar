import { useState, useRef, useEffect } from 'react';
import type { TitularResponse } from '../../titulares/types/titular.types';
import { getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';

interface TitularComboboxProps {
  titulares: TitularResponse[];
  value: number;
  onChange: (titularId: number) => void;
  error?: string;
  disabled?: boolean;
  initialSearchTerm?: string;
  inputId?: string;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
}

export const TitularCombobox = ({ titulares, value, onChange, error, disabled, initialSearchTerm, inputId, ariaDescribedBy, ariaInvalid }: TitularComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedInitialSearchTerm = initialSearchTerm?.trim() ?? '';
  const [searchTerm, setSearchTerm] = useState(normalizedInitialSearchTerm);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTitular = titulares.find(t => t.id === value);
  const displayText = selectedTitular
    ? getTitularApellidoDisplay(selectedTitular.apellido, selectedTitular.nombreContacto)
    : '';

  const filteredTitulares = titulares.filter(titular =>
    titular.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    titular.nombreContacto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (titularId: number) => {
    onChange(titularId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const inputValue = isOpen || !selectedTitular ? searchTerm : displayText;

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        id={inputId}
        value={inputValue}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        disabled={disabled}
        placeholder="Buscar titular por apellido o nombre..."
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        className={`
          w-full px-4 py-2.5 rounded-lg border text-gray-900 dark:text-white
          bg-white dark:bg-[#27272a]
          focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent
          transition-colors
          ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-[#3f3f46]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
      
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredTitulares.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No se encontraron titulares
            </div>
          ) : (
            filteredTitulares.map((titular) => {
              const label = getTitularApellidoDisplay(titular.apellido, titular.nombreContacto);
              return (
                <button
                  key={titular.id}
                  type="button"
                  onClick={() => handleSelect(titular.id)}
                  className={`
                    w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-[#3f3f46]
                    ${titular.id === value ? 'bg-[#007a8a]/10 text-[#007a8a] dark:text-cyan-400' : 'text-gray-900 dark:text-white'}
                  `}
                  aria-label={`Seleccionar titular ${label}`}
                >
                  {label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
