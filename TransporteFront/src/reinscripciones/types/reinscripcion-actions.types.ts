export type ReinscripcionActionVariant = 'pendiente' | 'confirmado' | 'noContinua';

export type ReinscripcionImmediateActionVariant = Extract<
  ReinscripcionActionVariant,
  'pendiente' | 'noContinua'
>;

export interface ReinscripcionActionDefinition {
  id: ReinscripcionActionVariant;
  label: string;
  description: string;
  icon: string;
  classes: string;
  iconColor: string;
}
