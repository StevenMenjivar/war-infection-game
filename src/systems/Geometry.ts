export interface RectangleBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Devuelve el parámetro de entrada (0..1) del segmento sobre un rectángulo. */
export function segmentRectangleEntryT(
  x1: number, y1: number, x2: number, y2: number, rectangle: RectangleBounds,
): number | null {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rectangle.left, rectangle.right - x1, y1 - rectangle.top, rectangle.bottom - y1];
  let t0 = 0;
  let t1 = 1;

  for (let index = 0; index < 4; index++) {
    if (p[index] === 0) {
      if (q[index]! < 0) return null;
      continue;
    }
    const ratio = q[index]! / p[index]!;
    if (p[index]! < 0) t0 = Math.max(t0, ratio);
    else t1 = Math.min(t1, ratio);
    if (t0 > t1) return null;
  }
  return t0;
}

/** Intersección de segmento y rectángulo mediante Liang-Barsky. */
export function segmentIntersectsRectangle(
  x1: number, y1: number, x2: number, y2: number, rectangle: RectangleBounds,
): boolean {
  return segmentRectangleEntryT(x1, y1, x2, y2, rectangle) !== null;
}
