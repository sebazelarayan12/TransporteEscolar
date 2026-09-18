/**
 * Ejecuta `task` para cada item, de a uno y en orden (cada tarea espera a la anterior).
 * Para cuando el orden importa o las llamadas modifican el mismo recurso.
 */
export const runInSequence = <T>(items: readonly T[], task: (item: T, index: number) => Promise<unknown>) =>
  items.reduce<Promise<unknown>>((chain, item, index) => chain.then(() => task(item, index)), Promise.resolve());
