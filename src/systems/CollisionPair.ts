/**
 * Obtiene el otro objeto de una colisión/overlap sin asumir el orden de los
 * argumentos del callback de Arcade Physics.
 */
export function getOtherCollisionObject<T extends object>(first: T, second: T, expected: T): T | null {
  if (first === expected) return second;
  if (second === expected) return first;
  return null;
}
