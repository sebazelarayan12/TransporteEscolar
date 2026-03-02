export const GASTO_TIPOS = {
  FIJO: 'Fijo',
  VARIABLE: 'Variable',
} as const;

export type GastoTipo = (typeof GASTO_TIPOS)[keyof typeof GASTO_TIPOS];

export const GASTO_ESTADOS = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  PROGRAMADO: 'Programado',
} as const;

export type GastoEstadoPago = (typeof GASTO_ESTADOS)[keyof typeof GASTO_ESTADOS];

export interface PlanCuotasRequest {
  fechaPrimeraCuota: string;
  cantidadCuotas: number;
}

export interface ResumenTotales {
  totalCuotas: number;
  totalGastosFijos: number;
  totalGastosVariables: number;
  gananciaNeta: number;
}

export interface GastoItem {
  id: number;
  mes: number;
  anio: number;
  tipo: GastoTipo;
  categoria: string;
  descripcion: string;
  monto: number;
  fechaCuota: string;
  medioPago: string;
  estadoPago: GastoEstadoPago;
  observaciones?: string | null;
  templateId?: number | null;
  numeroCuota?: number | null;
  totalCuotas?: number | null;
  esPlanCuotas?: boolean;
  fechaPrimeraCuota?: string | null;
  cantidadCuotas?: number | null;
  montoCuota?: number | null;
}

export interface ResumenMensualResponse {
  totales: ResumenTotales;
  gastosFijos: GastoItem[];
  gastosVariables: GastoItem[];
}

export interface CrearGastoFijoRequest {
  mes: number;
  anio: number;
  categoria: string;
  descripcion: string;
  monto: number;
  diaDeAplicacion: number;
  medioPago: string;
  observaciones?: string;
  planCuotas?: PlanCuotasRequest;
}

export interface ActualizarGastoFijoRequest extends CrearGastoFijoRequest {
  estaActivo: boolean;
}

export interface CrearGastoVariableRequest {
  mes: number;
  anio: number;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string; // YYYY-MM-DD
  medioPago: string;
  estadoPago: GastoEstadoPago;
  observaciones?: string;
}

export type GastosTabValue = 'variables' | 'fijos';

export const GASTO_CATEGORIAS = {
  FIJOS: [
    { value: 'ServiciosPublicos', label: 'Servicios públicos (agua, luz, gas, IPV)' },
    { value: 'Comunicaciones', label: 'Comunicación (celular, teléfono)' },
    { value: 'EducacionActividades', label: 'Educación y actividades (colegio, deportes)' },
    { value: 'FinanzasTarjetas', label: 'Tarjetas y préstamos (Naranja, Visa, préstamos ANSES/Merca)' },
    { value: 'Seguros', label: 'Seguros' },
  ],
  VARIABLES: [
    { value: 'Combustible', label: 'Combustible (gasoil)' },
    { value: 'Mantenimiento', label: 'Mecánicos y repuestos' },
    { value: 'Alimentacion', label: 'Comida y viáticos' },
    { value: 'ViajesEventos', label: 'Viajes y eventos especiales' },
    { value: 'Otros', label: 'Varios / otros gastos' },
  ],
} as const;

export type GastoCategoriaValue =
  (typeof GASTO_CATEGORIAS.FIJOS)[number]['value'] |
  (typeof GASTO_CATEGORIAS.VARIABLES)[number]['value'];
