import { ENEMY_CONFIG, PLAYER_COMBAT_CONFIG, type WeaponId } from './CombatConfig';
import { applyPhase9EnemyPressure, HORDE_CONFIG } from './HordeConfig';

export type PlayerTier = 1 | 2 | 3;

export interface PlayerTierConfig {
  tier: PlayerTier;
  killsRequired: number;
  textureKey: 'soldier_1' | 'soldier_2' | 'soldier_3';
  weaponId: WeaponId;
  maxHealth: number;
  displayName: string;
}

export const PLAYER_TIERS: Record<PlayerTier, PlayerTierConfig> = {
  1: {
    tier: 1, killsRequired: 0, textureKey: 'soldier_1', weaponId: 'm416',
    maxHealth: PLAYER_COMBAT_CONFIG.maxHealth, displayName: 'SOLDADO I',
  },
  2: {
    tier: 2, killsRequired: 11, textureKey: 'soldier_2', weaponId: 'benelli_m4',
    maxHealth: 210, displayName: 'SOLDADO II',
  },
  3: {
    tier: 3, killsRequired: 27, textureKey: 'soldier_3', weaponId: 'minigun',
    maxHealth: 270, displayName: 'SOLDADO III',
  },
};

export const MEDKIT_CONFIG = {
  healFractionOfMaxHealth: 0.35,
  initialCount: 5,
  pickupDisplaySize: 32,
} as const;

export interface EnemyDifficultyProfile {
  healthMultiplier: number;
  moveSpeed: number;
  patrolSpeed: number;
  detectionRange: number;
  preferredDistance: number;
  minimumDistance: number;
  weaponRange: number;
  fireRateMs: number;
  projectileDamage: number;
  projectileSpeed: number;
  projectileRange: number;
  aimTimeMs: number;
  aimSpreadRadians: number;
}

/** Bandas ligadas a la profundidad de la sala; la presión global Fase 9 aplica a todas. */
export function getEnemyDifficultyForRoom(roomIndex: number): EnemyDifficultyProfile {
  const band = roomIndex <= 1 ? 0 : roomIndex <= 4 ? 1 : 2;
  const profiles: EnemyDifficultyProfile[] = [
    {
      healthMultiplier: 1,
      moveSpeed: ENEMY_CONFIG.moveSpeed,
      patrolSpeed: ENEMY_CONFIG.patrolSpeed,
      detectionRange: ENEMY_CONFIG.detectionRange,
      preferredDistance: ENEMY_CONFIG.preferredDistance,
      minimumDistance: ENEMY_CONFIG.minimumDistance,
      weaponRange: ENEMY_CONFIG.weaponRange,
      fireRateMs: ENEMY_CONFIG.fireRateMs,
      projectileDamage: ENEMY_CONFIG.projectileDamage,
      projectileSpeed: ENEMY_CONFIG.projectileSpeed,
      projectileRange: ENEMY_CONFIG.projectileRange,
      aimTimeMs: ENEMY_CONFIG.aimTimeMs,
      aimSpreadRadians: 0.09,
    },
    {
      healthMultiplier: 1.15,
      moveSpeed: ENEMY_CONFIG.moveSpeed * 1.04,
      patrolSpeed: ENEMY_CONFIG.patrolSpeed * 1.04,
      detectionRange: ENEMY_CONFIG.detectionRange * 1.05,
      preferredDistance: ENEMY_CONFIG.preferredDistance - 10,
      minimumDistance: ENEMY_CONFIG.minimumDistance - 5,
      weaponRange: ENEMY_CONFIG.weaponRange * 1.05,
      fireRateMs: Math.round(ENEMY_CONFIG.fireRateMs * 0.89),
      projectileDamage: ENEMY_CONFIG.projectileDamage + 1,
      projectileSpeed: ENEMY_CONFIG.projectileSpeed * 1.04,
      projectileRange: ENEMY_CONFIG.projectileRange * 1.04,
      aimTimeMs: Math.round(ENEMY_CONFIG.aimTimeMs * 0.88),
      aimSpreadRadians: 0.06,
    },
    {
      healthMultiplier: 1.3,
      moveSpeed: ENEMY_CONFIG.moveSpeed * 1.08,
      patrolSpeed: ENEMY_CONFIG.patrolSpeed * 1.08,
      detectionRange: ENEMY_CONFIG.detectionRange * 1.1,
      preferredDistance: ENEMY_CONFIG.preferredDistance - 20,
      minimumDistance: ENEMY_CONFIG.minimumDistance - 10,
      weaponRange: ENEMY_CONFIG.weaponRange * 1.1,
      fireRateMs: Math.round(ENEMY_CONFIG.fireRateMs * 0.8),
      projectileDamage: ENEMY_CONFIG.projectileDamage + 2,
      projectileSpeed: ENEMY_CONFIG.projectileSpeed * 1.08,
      projectileRange: ENEMY_CONFIG.projectileRange * 1.08,
      aimTimeMs: Math.round(ENEMY_CONFIG.aimTimeMs * 0.75),
      aimSpreadRadians: 0.035,
    },
  ];
  return applyPhase9EnemyPressure(profiles[band]!);
}

/** Perfil de horda: resistencia, detección y presión crecen en cada oleada. */
export function getEnemyDifficultyForWave(waveNumber: number): EnemyDifficultyProfile {
  const index = Math.max(0, Math.min(HORDE_CONFIG.waveCounts.length - 1, Math.floor(waveNumber) - 1));
  const base = getEnemyDifficultyForRoom(2);
  return {
    ...base,
    healthMultiplier: base.healthMultiplier * HORDE_CONFIG.waveHealthMultiplier[index]!,
    moveSpeed: base.moveSpeed * HORDE_CONFIG.waveMoveSpeedMultiplier[index]!,
    patrolSpeed: base.patrolSpeed * HORDE_CONFIG.waveMoveSpeedMultiplier[index]!,
    detectionRange: HORDE_CONFIG.arenaDetectionRange,
    preferredDistance: Math.max(230, base.preferredDistance - index * 16),
    minimumDistance: Math.max(150, base.minimumDistance - index * 8),
    weaponRange: HORDE_CONFIG.arenaWeaponRange,
    fireRateMs: Math.round(base.fireRateMs * HORDE_CONFIG.waveFireRateMultiplier[index]!),
    projectileDamage: base.projectileDamage + HORDE_CONFIG.waveProjectileDamageBonus[index]!,
    projectileSpeed: base.projectileSpeed * (1 + index * 0.06),
    projectileRange: base.projectileRange * (1 + index * 0.08),
    aimTimeMs: Math.max(120, Math.round(base.aimTimeMs * (1 - index * 0.12))),
    aimSpreadRadians: Math.max(0.025, base.aimSpreadRadians - index * 0.01),
  };
}

/** La evolución del operador provoca una respuesta enemiga gradual y legible. */
export const ENEMY_TIER_PRESSURE = {
  1: { pursuitSpeedMultiplier: 1, fireRateMultiplier: 1, pursuitIncreasePercent: 0, fireFrequencyIncreasePercent: 0 },
  2: { pursuitSpeedMultiplier: 1.12, fireRateMultiplier: 0.88, pursuitIncreasePercent: 12, fireFrequencyIncreasePercent: 14 },
  3: { pursuitSpeedMultiplier: 1.25, fireRateMultiplier: 0.74, pursuitIncreasePercent: 25, fireFrequencyIncreasePercent: 35 },
} as const satisfies Record<PlayerTier, {
  pursuitSpeedMultiplier: number;
  fireRateMultiplier: number;
  pursuitIncreasePercent: number;
  fireFrequencyIncreasePercent: number;
}>;

export function getEnemyTierPressure(tier: PlayerTier) {
  return ENEMY_TIER_PRESSURE[tier];
}

