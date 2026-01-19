interface SectionHeaderProps {
  icon: string;
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  badge?: string;
  className?: string;
}

export const SectionHeader = ({ icon, title, action, badge, className = '' }: SectionHeaderProps) => {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-[#007a8a]">{icon}</span>
        {title}
      </h4>
      {action && (
        <button 
          onClick={action.onClick}
          className="text-xs font-bold text-[#007a8a] hover:text-[#00626e] transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-[#007a8a]/5"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          {action.label}
        </button>
      )}
      {badge && (
        <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
};
