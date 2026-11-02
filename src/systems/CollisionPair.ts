/**
 * Obtiene el otro objeto de una colisión/overlap sin asumir el orden de los
 * argumentos de Arcade Physics. Se usa `object` porque Phaser puede entregar
 * GameObjectWithBody, Body, StaticBody o Tile en el callback tipado.
 */
export function getOtherCollisionObject(first: object, second: object, expected: object): object | null {
  if (first === expected) return second;
  if (second === expected) return first;
  return null;
}
