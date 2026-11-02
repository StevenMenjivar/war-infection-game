import { segmentRectangleEntryT, type RectangleBounds } from './Geometry';

export interface Point2D {
  x: number;
  y: number;
}

function normalizeAngle(angle: number): number {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;
  return normalized;
}

function distanceSquaredToRectangle(x: number, y: number, rectangle: RectangleBounds): number {
  const dx = Math.max(rectangle.left - x, 0, x - rectangle.right);
  const dy = Math.max(rectangle.top - y, 0, y - rectangle.bottom);
  return dx * dx + dy * dy;
}

/**
 * Calcula un polígono de visibilidad para un cono de linterna.
 * Cada rayo termina en el primer rectángulo sólido que encuentra o en el alcance máximo.
 * Se lanzan rayos adicionales a ambos lados de los vértices para reducir fugas de luz.
 */
export function buildVisibilityPolygon(
  originX: number,
  originY: number,
  directionAngle: number,
  range: number,
  halfAngleRadians: number,
  blockers: readonly RectangleBounds[],
  rayCount = 52,
  cornerEpsilon = 0.0015,
): Point2D[] {
  if (range <= 0 || halfAngleRadians <= 0 || rayCount < 2) return [{ x: originX, y: originY }];

  const nearbyBlockers = blockers.filter(
    (rectangle) => distanceSquaredToRectangle(originX, originY, rectangle) <= range * range,
  );
  const offsets = new Set<number>();
  for (let index = 0; index <= rayCount; index++) {
    offsets.add(-halfAngleRadians + (2 * halfAngleRadians * index) / rayCount);
  }

  for (const rectangle of nearbyBlockers) {
    const corners: Point2D[] = [
      { x: rectangle.left, y: rectangle.top },
      { x: rectangle.right, y: rectangle.top },
      { x: rectangle.right, y: rectangle.bottom },
      { x: rectangle.left, y: rectangle.bottom },
    ];
    for (const corner of corners) {
      const offset = normalizeAngle(Math.atan2(corner.y - originY, corner.x - originX) - directionAngle);
      if (Math.abs(offset) > halfAngleRadians + cornerEpsilon) continue;
      offsets.add(Math.max(-halfAngleRadians, offset - cornerEpsilon));
      offsets.add(Math.min(halfAngleRadians, offset + cornerEpsilon));
    }
  }

  const sortedOffsets = [...offsets].sort((a, b) => a - b);
  const polygon: Point2D[] = [{ x: originX, y: originY }];
  for (const offset of sortedOffsets) {
    const angle = directionAngle + offset;
    const targetX = originX + Math.cos(angle) * range;
    const targetY = originY + Math.sin(angle) * range;
    let nearestT = 1;

    for (const rectangle of nearbyBlockers) {
      const entryT = segmentRectangleEntryT(originX, originY, targetX, targetY, rectangle);
      if (entryT !== null && entryT > 0.00001 && entryT < nearestT) nearestT = entryT;
    }

    polygon.push({
      x: originX + (targetX - originX) * nearestT,
      y: originY + (targetY - originY) * nearestT,
    });
  }
  return polygon;
}
