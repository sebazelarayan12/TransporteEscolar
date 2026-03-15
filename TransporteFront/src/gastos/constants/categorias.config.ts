import { GASTO_CATEGORIAS } from '../types/gastos.types';

export type CategoriaVisualConfig = {
  label: string;
  icon: string;
  gradient: string;
  chipClass: string;
};

const createConfig = (config: CategoriaVisualConfig) => config;

const BASE_CONFIG = {
  Combustible: createConfig({
    label: 'Combustible',
    icon: 'local_gas_station',
    gradient: 'from-amber-400 via-orange-400 to-rose-400',
    chipClass: 'bg-amber-100 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100',
  }),
  Mantenimiento: createConfig({
    label: 'Mantenimiento',
    icon: 'build',
    gradient: 'from-slate-400 via-slate-500 to-slate-600',
    chipClass: 'bg-slate-200 text-slate-800 dark:bg-slate-500/20 dark:text-slate-100',
  }),
  Alimentacion: createConfig({
    label: 'Alimentación',
    icon: 'restaurant',
    gradient: 'from-lime-400 via-emerald-400 to-teal-400',
    chipClass: 'bg-lime-100 text-lime-900 dark:bg-lime-400/10 dark:text-lime-100',
  }),
  ViajesEventos: createConfig({
    label: 'Viajes y eventos',
    icon: 'public',
    gradient: 'from-indigo-400 via-sky-400 to-cyan-400',
    chipClass: 'bg-sky-100 text-sky-900 dark:bg-sky-400/10 dark:text-sky-100',
  }),
  Tarjeta: createConfig({
    label: 'Tarjetas y créditos',
    icon: 'credit_card',
    gradient: 'from-purple-400 via-fuchsia-400 to-rose-400',
    chipClass: 'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-400/10 dark:text-fuchsia-100',
  }),
  Servicio: createConfig({
    label: 'Servicio puntual',
    icon: 'handyman',
    gradient: 'from-teal-400 via-cyan-400 to-emerald-400',
    chipClass: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-400/10 dark:text-cyan-100',
  }),
  ServiciosPublicos: createConfig({
    label: 'Servicios públicos',
    icon: 'water_drop',
    gradient: 'from-sky-500 via-blue-500 to-indigo-500',
    chipClass: 'bg-sky-100 text-sky-900 dark:bg-sky-400/10 dark:text-sky-100',
  }),
  Comunicaciones: createConfig({
    label: 'Comunicación',
    icon: 'rss_feed',
    gradient: 'from-amber-300 via-amber-400 to-orange-400',
    chipClass: 'bg-amber-100 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100',
  }),
  EducacionActividades: createConfig({
    label: 'Educación',
    icon: 'school',
    gradient: 'from-rose-400 via-orange-400 to-amber-400',
    chipClass: 'bg-rose-100 text-rose-900 dark:bg-rose-400/10 dark:text-rose-100',
  }),
  FinanzasTarjetas: createConfig({
    label: 'Finanzas',
    icon: 'account_balance',
    gradient: 'from-slate-500 via-emerald-500 to-teal-500',
    chipClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100',
  }),
  Seguros: createConfig({
    label: 'Seguros',
    icon: 'verified_user',
    gradient: 'from-indigo-400 via-blue-400 to-cyan-400',
    chipClass: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-400/10 dark:text-indigo-100',
  }),
  Insumos: createConfig({
    label: 'Insumos',
    icon: 'inventory_2',
    gradient: 'from-orange-300 via-amber-300 to-yellow-300',
    chipClass: 'bg-orange-100 text-orange-900 dark:bg-orange-400/10 dark:text-orange-100',
  }),
  Peajes: createConfig({
    label: 'Peajes',
    icon: 'toll',
    gradient: 'from-yellow-400 via-amber-400 to-orange-400',
    chipClass: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-400/10 dark:text-yellow-100',
  }),
  Extraordinario: createConfig({
    label: 'Extraordinario',
    icon: 'bolt',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    chipClass: 'bg-rose-100 text-rose-900 dark:bg-rose-400/10 dark:text-rose-100',
  }),
  Sueldos: createConfig({
    label: 'Sueldos',
    icon: 'group',
    gradient: 'from-emerald-400 via-emerald-500 to-teal-500',
    chipClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100',
  }),
  Servicios: createConfig({
    label: 'Servicios',
    icon: 'design_services',
    gradient: 'from-sky-400 via-cyan-400 to-emerald-400',
    chipClass: 'bg-sky-100 text-sky-900 dark:bg-sky-400/10 dark:text-sky-100',
  }),
  Alquiler: createConfig({
    label: 'Alquiler',
    icon: 'apartment',
    gradient: 'from-purple-400 via-indigo-400 to-blue-400',
    chipClass: 'bg-purple-100 text-purple-900 dark:bg-purple-400/10 dark:text-purple-100',
  }),
  Licencias: createConfig({
    label: 'Licencias',
    icon: 'workspace_premium',
    gradient: 'from-teal-300 via-sky-300 to-blue-300',
    chipClass: 'bg-teal-100 text-teal-900 dark:bg-teal-400/10 dark:text-teal-100',
  }),
  Otros: createConfig({
    label: 'Otros',
    icon: 'category',
    gradient: 'from-slate-400 via-slate-500 to-slate-600',
    chipClass: 'bg-slate-200 text-slate-800 dark:bg-slate-500/20 dark:text-slate-100',
  }),
} as const satisfies Record<string, CategoriaVisualConfig>;

const categoriaLabelAliases = Object.values(GASTO_CATEGORIAS)
  .flat()
  .reduce<Record<string, string>>((acc, categoria) => {
    acc[categoria.label] = categoria.value;
    return acc;
  }, {});

const manualAliases: Record<string, string> = {
  'Servicios públicos': 'ServiciosPublicos',
  'Servicios públicos (agua, luz, gas, IPV)': 'ServiciosPublicos',
  'Comunicación (celular, teléfono)': 'Comunicaciones',
  'Educación y actividades (colegio, deportes)': 'EducacionActividades',
  'Tarjetas y préstamos (Naranja, Visa, préstamos ANSES/Merca)': 'FinanzasTarjetas',
  'Tarjeta (consumos con crédito)': 'Tarjeta',
  'Servicio contratado puntual': 'Servicio',
  'Varios / otros gastos': 'Otros',
  'Mecánicos y repuestos': 'Mantenimiento',
  'Comida y viáticos': 'Alimentacion',
  'Viajes y eventos especiales': 'ViajesEventos',
  'Combustible (gasoil)': 'Combustible',
  Servicios: 'Servicio',
  Servicio: 'Servicio',
  'Servicios puntuales': 'Servicio',
};

const CATEGORIA_ALIASES = {
  ...categoriaLabelAliases,
  ...manualAliases,
};

export const normalizeCategoriaKey = (categoria?: string | null): string => {
  if (!categoria) {
    return 'Otros';
  }
  const normalized = categoria.trim();
  return CATEGORIA_ALIASES[normalized] ?? normalized;
};

export const getCategoriaConfig = (categoria?: string | null): CategoriaVisualConfig => {
  const key = normalizeCategoriaKey(categoria);
  return BASE_CONFIG[key] ?? BASE_CONFIG.Otros;
};

export const CATEGORIA_CONFIG = BASE_CONFIG;
