export type WeaponId = 'm416' | 'benelli_m4' | 'minigun';

export interface WeaponConfig {
  id: WeaponId;
  displayName: string;
  damage: number;
  damageMultiplier: 1 | 2 | 3;
  fireRateMs: number;
  spreadRadians: number;
  range: number;
  projectileSpeed: number;
  pellets: number;
  projectileColor: number;
  muzzleFlashColor: number;
}

/** Balance centralizado: la Fase 6 podrá cambiar el arma sin modificar el sistema de disparo. */
export const WEAPONS: Record<WeaponId, WeaponConfig> = {
  m416: {
    id: 'm416', displayName: 'Carabina M416', damage: 10, damageMultiplier: 1,
    fireRateMs: 260, spreadRadians: 0.035, range: 900,
    projectileSpeed: 1100, pellets: 1,
    projectileColor: 0xffd76a, muzzleFlashColor: 0xffe7a1,
  },
  benelli_m4: {
    id: 'benelli_m4', displayName: 'Escopeta M4', damage: 20, damageMultiplier: 2,
    fireRateMs: 850, spreadRadians: 0.30, range: 430,
    projectileSpeed: 850, pellets: 4,
    projectileColor: 0xffd18a, muzzleFlashColor: 0xffe0a8,
  },
  minigun: {
    id: 'minigun', displayName: 'Ametralladora Minigun', damage: 30, damageMultiplier: 3,
    fireRateMs: 95, spreadRadians: 0.12, range: 780,
    projectileSpeed: 1200, pellets: 1,
    projectileColor: 0xffd45b, muzzleFlashColor: 0xffed9a,
  },
};

export const PLAYER_COMBAT_CONFIG = {
  maxHealth: 150,
  muzzleOffset: 49,
};

/** Campaña ampliada de Fase 10: duplica objetivos iniciales y refuerzos. */
export const CAMPAIGN_CONFIG = {
  combatRoomCount: 7,
  initialEnemiesPerRoom: 4,
  initialEnemyCount: 28,
  reinforcementCount: 26,
  totalEnemyCount: 54,
} as const;

export const ENEMY_CONFIG = {
  initialCountPerRoom: CAMPAIGN_CONFIG.initialEnemiesPerRoom,
  maxHealth: 96,
  displayWidth: 64,
  displayHeight: 102,
  moveSpeed: 82,
  patrolSpeed: 58,
  detectionRange: 700,
  preferredDistance: 365,
  minimumDistance: 225,
  weaponRange: 560,
  fireRateMs: 1650,
  projectileDamage: 8,
  projectileSpeed: 430,
  projectileRange: 590,
  muzzleOffset: 43,
  aimTimeMs: 300,
  hitRecoveryMs: 145,
  separationDistance: 54,
  separationStrength: 40,
  lineOfSightRefreshMs: 180,
} as const;

export const COMBAT_CONFIG = {
  maxPlayerProjectiles: 180,
  maxEnemyProjectiles: 220,
  projectileRadius: 4,
  hitParticles: 8,
  hitParticleLifeMs: 260,
  deathFadeMs: 520,
  bloodFadeDelayMs: 2400,
  bloodFadeMs: 1100,
  initialSeed: 20261101,
} as const;
