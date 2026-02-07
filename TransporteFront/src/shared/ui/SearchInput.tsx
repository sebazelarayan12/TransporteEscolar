interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput = ({ 
  value, 
  onChange, 
  placeholder = "Buscar...",
  className = '' 
}: SearchInputProps) => {
  return (
    <div className={`relative group w-full md:w-80 ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#007a8a] transition-colors">
        <span className="material-symbols-outlined text-[20px]">search</span>
      </div>
      <input
        className="block w-full pl-10 pr-10 py-2.5 border-none rounded-lg bg-white dark:bg-[#27272a] shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#007a8a] focus:ring-offset-0 placeholder-gray-400 dark:placeholder-gray-500 transition-all outline-none"
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      )}
    </div>
  );
};
