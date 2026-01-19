import { SectionHeader } from '../../shared/ui';

interface Pasajero {
  name: string;
  level: string;
  route: string;
  initial: string;
  colorClass: string;
  active: boolean;
}

interface TitularPasajerosListProps {
  apellido: string;
  pasajeros?: Pasajero[];
}

// Mock data
const getMockPasajeros = (apellido: string): Pasajero[] => [
  {
    name: `Sofía ${apellido}`,
    level: 'Primaria - 4to Grado',
    route: 'Ruta A - Mañana',
    initial: 'S',
    colorClass: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300',
    active: true,
  },
  {
    name: `Lucas ${apellido}`,
    level: 'Secundaria - 1er Año',
    route: 'Ruta B - Tarde',
    initial: 'L',
    colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
    active: true,
  },
];

export const TitularPasajerosList = ({ apellido, pasajeros }: TitularPasajerosListProps) => {
  const displayPasajeros = pasajeros || getMockPasajeros(apellido);

  return (
    <section>
      <SectionHeader 
        icon="school" 
        title="Pasajeros Asociados"
        badge={displayPasajeros.length.toString()}
      />
      <div className="grid grid-cols-1 gap-3">
        {displayPasajeros.map((pasajero, idx) => (
          <div 
            key={idx}
            className="p-3 rounded-xl border border-[#e4e4e7] dark:border-[#3f3f46] bg-white dark:bg-[#27272a] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            {pasajero.active && (
              <div className="absolute top-0 right-0 p-2">
                <span className="block size-2 rounded-full bg-green-500 ring-2 ring-white dark:ring-[#27272a]" />
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className={`size-12 rounded-lg ${pasajero.colorClass} flex items-center justify-center text-lg font-bold`}>
                {pasajero.initial}
              </div>
              <div className="flex flex-col w-full">
                <h5 className="font-bold text-gray-900 dark:text-white text-sm">{pasajero.name}</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{pasajero.level}</p>
                <div className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-white/5 p-1.5 rounded-md border border-gray-100 dark:border-gray-700">
                  <span className="material-symbols-outlined text-[14px] text-[#007a8a]">directions_bus</span>
                  <span className="truncate font-medium text-gray-700 dark:text-gray-300">{pasajero.route}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:text-[#007a8a] hover:border-[#007a8a] hover:bg-[#007a8a]/5 transition-all flex items-center justify-center gap-2 text-sm font-medium h-[80px]">
          <span className="material-symbols-outlined">add_circle</span>
          Vincular Pasajero
        </button>
      </div>
    </section>
  );
};
