/** Arena final, balance de oleadas y presión adicional específica de la horda. */
export const HORDE_CONFIG = {
  /** Enemigos activos de forma simultánea por oleada; la última mantiene 50. */
  waveCounts: [12, 24, 50] as const,
  arenaRoomIndex: 8,
  arenaEntryRadius: 126,
  arenaWallInset: 58,
  spawnInset: 112,
  spawnJitter: 24,
  waveTransitionDelayMs: 1250,
  checkpointHealthFraction: 0.5,
  /** La presión aumenta entre oleadas además del +50% global de Fase 9. */
  waveMoveSpeedMultiplier: [1, 1.08, 1.18] as const,
  waveFireRateMultiplier: [1, 0.92, 0.84] as const,
  waveHealthMultiplier: [1, 1.12, 1.28] as const,
  waveProjectileDamageBonus: [0, 1, 2] as const,
  arenaDetectionRange: 1150,
  arenaWeaponRange: 700,
  maxEnemyGroupSize: 64,
} as const;

/** Multiplicadores globales de los hostiles desde la Fase 9. */
export const PHASE9_ENEMY_PRESSURE = {
  moveSpeedMultiplier: 1.5,
  patrolSpeedMultiplier: 1.5,
  fireFrequencyMultiplier: 1.5,
} as const;

/** El intervalo se reduce para conseguir una frecuencia real 50% mayor. */
export function applyPhase9EnemyPressure<T extends {
  moveSpeed: number;
  patrolSpeed: number;
  fireRateMs: number;
}>(profile: T): T {
  return {
    ...profile,
    moveSpeed: profile.moveSpeed * PHASE9_ENEMY_PRESSURE.moveSpeedMultiplier,
    patrolSpeed: profile.patrolSpeed * PHASE9_ENEMY_PRESSURE.patrolSpeedMultiplier,
    fireRateMs: Math.round(profile.fireRateMs / PHASE9_ENEMY_PRESSURE.fireFrequencyMultiplier),
  };
}
