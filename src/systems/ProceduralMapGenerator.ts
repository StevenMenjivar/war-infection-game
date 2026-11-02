export interface GridPoint { x: number; y: number }
export interface Room { id: number; x: number; y: number; width: number; height: number; center: GridPoint }
export interface ProceduralMap {
  columns: number;
  rows: number;
  cellSize: number;
  floor: Set<string>;
  rooms: Room[];
  start: GridPoint;
  exit: GridPoint;
  enemySpawnPoints: GridPoint[];
  seed: number;
}

const keyOf = (x: number, y: number): string => `${x},${y}`;

/** Genera una red reproducible de habitaciones y pasillos sobre una cuadrícula. */
export class ProceduralMapGenerator {
  constructor(
    private readonly columns = 54,
    private readonly rows = 40,
    private readonly cellSize = 52,
  ) {}

  generate(seed = Date.now()): ProceduralMap {
    let state = seed >>> 0;
    const random = (): number => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
    const floor = new Set<string>();
    const rooms: Room[] = [];
    const xSlots = [2, 19, 36];
    const ySlots = [2, 15, 28];

    // Nueve salas en una retícula de sectores: no se solapan y dejan espacio para conexiones.
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const width = 10 + Math.floor(random() * 3);
        const height = 7 + Math.floor(random() * 3);
        const room: Room = {
          id: rooms.length,
          x: xSlots[col], y: ySlots[row], width, height,
          center: { x: xSlots[col] + Math.floor(width / 2), y: ySlots[row] + Math.floor(height / 2) },
        };
        rooms.push(room);
        for (let y = room.y; y < room.y + room.height; y++) {
          for (let x = room.x; x < room.x + room.width; x++) floor.add(keyOf(x, y));
        }
      }
    }

    const carveHorizontal = (x1: number, x2: number, y: number): void => {
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        for (let dy = -1; dy <= 1; dy++) floor.add(keyOf(x, y + dy));
      }
    };
    const carveVertical = (y1: number, y2: number, x: number): void => {
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        for (let dx = -1; dx <= 1; dx++) floor.add(keyOf(x + dx, y));
      }
    };

    // Conecta cada fila y cada columna; la red resultante garantiza ruta inicio-salida.
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const a = rooms[row * 3 + col];
        const b = rooms[row * 3 + col + 1];
        carveHorizontal(a.x + a.width - 1, b.x, a.center.y);
      }
    }
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 2; row++) {
        const a = rooms[row * 3 + col];
        const b = rooms[(row + 1) * 3 + col];
        carveVertical(a.y + a.height - 1, b.y, a.center.x);
      }
    }

    const start = { ...rooms[0].center };
    const exit = { ...rooms[8].center };
    const enemySpawnPoints = rooms.slice(1, 8).map((room) => ({ ...room.center }));
    return { columns: this.columns, rows: this.rows, cellSize: this.cellSize, floor, rooms, start, exit, enemySpawnPoints, seed };
  }

  /** BFS sobre celdas transitables: sirve como guardia antes de iniciar la partida. */
  static hasPath(map: ProceduralMap, from = map.start, to = map.exit): boolean {
    const queue: GridPoint[] = [from];
    const visited = new Set<string>([keyOf(from.x, from.y)]);
    const directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    while (queue.length) {
      const point = queue.shift()!;
      if (point.x === to.x && point.y === to.y) return true;
      for (const direction of directions) {
        const next = { x: point.x + direction.x, y: point.y + direction.y };
        const key = keyOf(next.x, next.y);
        if (map.floor.has(key) && !visited.has(key)) { visited.add(key); queue.push(next); }
      }
    }
    return false;
  }
}
