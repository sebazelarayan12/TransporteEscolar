import { SectionHeader } from '../../shared/ui';

interface Phone {
  number: string;
  type: string;
  isPrimary: boolean;
}

interface TitularPhoneListProps {
  phones?: Phone[];
}

// Mock data para mostrar
const mockPhones: Phone[] = [
  { number: '+54 9 11 1234-5678', type: 'Principal', isPrimary: true },
  { number: '+54 9 11 8765-4321', type: 'Casa', isPrimary: false },
];

export const TitularPhoneList = ({ phones = mockPhones }: TitularPhoneListProps) => {
  return (
    <section>
      <SectionHeader 
        icon="perm_phone_msg" 
        title="Teléfonos"
        action={{ label: 'Agregar', onClick: () => console.log('Add phone') }}
      />
      <div className="space-y-2">
        {phones.map((phone, idx) => (
          <div 
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-[#e4e4e7] dark:border-[#3f3f46] group hover:border-[#007a8a]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`size-8 rounded-full flex items-center justify-center ${
                phone.isPrimary 
                  ? 'bg-[#007a8a]/10 text-[#007a8a]' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                <span className="material-symbols-outlined text-[16px]">
                  {phone.isPrimary ? 'call' : 'home'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                  {phone.number}
                </span>
                <span className={`text-[10px] uppercase tracking-wide ${
                  phone.isPrimary 
                    ? 'font-semibold text-[#007a8a]' 
                    : 'font-medium text-gray-400'
                }`}>
                  {phone.type}
                </span>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 text-gray-400 hover:text-[#007a8a] rounded hover:bg-white dark:hover:bg-white/10">
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
              {!phone.isPrimary && (
                <button className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-white dark:hover:bg-white/10">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
