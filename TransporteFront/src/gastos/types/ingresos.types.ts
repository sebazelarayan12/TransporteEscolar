export const INGRESO_TIPOS = {
  FIJO: 'Fijo',
  VARIABLE: 'Variable',
} as const;

export type IngresoTipo = (typeof INGRESO_TIPOS)[keyof typeof INGRESO_TIPOS];

export const INGRESO_ESTADOS_COBRO = {
  PENDIENTE: 'Pendiente',
  COBRADO: 'Cobrado',
  PROGRAMADO: 'Programado',
} as const;

export type IngresoEstadoCobro = (typeof INGRESO_ESTADOS_COBRO)[keyof typeof INGRESO_ESTADOS_COBRO];

export interface IngresoResumenTotales {
  totalCuotas: number;
  totalIngresosFijos: number;
  totalIngresosVariables: number;
  totalIngresosExternos: number;
  totalGastos: number;
  gananciaNeta: number;
}

export interface IngresoItem {
  id: number;
  mes: number;
  anio: number;
  tipo: IngresoTipo;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string;
  medioCobro: string;
  estadoCobro: string;
  observaciones?: string | null;
  templateId?: number | null;
}

export interface IngresosResumenMensualResponse {
  totales: IngresoResumenTotales;
  ingresosFijos: IngresoItem[];
  ingresosVariables: IngresoItem[];
}

export interface CrearIngresoFijoRequest {
  mes: number;
  anio: number;
  categoria: string;
  descripcion: string;
  monto: number;
  diaDeAplicacion: number;
  medioCobro: string;
  observaciones?: string;
}

export interface CrearIngresoVariableRequest {
  mes: number;
  anio: number;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string;
  medioCobro: string;
  estadoCobro: string;
  observaciones?: string;
}

export type IngresosTabValue = 'fijos' | 'variables';

export const INGRESO_CATEGORIAS = {
  FIJOS: [
    { value: 'AlquilerUnidades', label: 'Alquiler de unidades / traslados especiales' },
    { value: 'ConveniosEscolares', label: 'Convenios escolares adicionales' },
    { value: 'Subsidios', label: 'Subsidios o reintegros gubernamentales' },
    { value: 'Sueldo', label: 'Sueldo / reintegro administrativo' },
  ],
  VARIABLES: [
    { value: 'TrasladosPuntuales', label: 'Traslados o servicios puntuales' },
    { value: 'EventosEspeciales', label: 'Eventos especiales' },
    { value: 'SubsidiosUnicos', label: 'Subsidios extraordinarios' },
    { value: 'SueldoExtra', label: 'Sueldo extraordinario' },
    { value: 'Otros', label: 'Otros ingresos extraordinarios' },
  ],
} as const;

export type IngresoCategoriaValue =
  (typeof INGRESO_CATEGORIAS.FIJOS)[number]['value'] |
  (typeof INGRESO_CATEGORIAS.VARIABLES)[number]['value'];
