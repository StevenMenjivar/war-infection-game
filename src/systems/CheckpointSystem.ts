import type { PlayerTier } from '../config/ProgressionConfig';

export interface CheckpointSnapshot {
  x: number;
  y: number;
  tier: PlayerTier;
  health: number;
  maxHealth: number;
  kills: number;
}

export interface CheckpointRespawnState extends CheckpointSnapshot {
  health: number;
}

/**
 * Captura un estado estable y deriva una reaparición reproducible.
 * La arena final y su activación concreta se conectan en la Fase 9.
 */
export class CheckpointSystem {
  private snapshot: CheckpointSnapshot | null = null;

  constructor(private readonly respawnHealthFraction = 0.5) {
    if (!Number.isFinite(respawnHealthFraction) || respawnHealthFraction <= 0 || respawnHealthFraction > 1) {
      throw new RangeError('respawnHealthFraction debe estar en el intervalo (0, 1].');
    }
  }

  capture(state: CheckpointSnapshot): void {
    if (![state.x, state.y, state.health, state.maxHealth, state.kills].every(Number.isFinite)) {
      throw new TypeError('El checkpoint contiene valores no finitos.');
    }
    if (state.maxHealth <= 0 || state.health < 0 || state.health > state.maxHealth || state.kills < 0) {
      throw new RangeError('El estado del checkpoint está fuera de rango.');
    }
    this.snapshot = { ...state };
  }

  hasCheckpoint(): boolean {
    return this.snapshot !== null;
  }

  getSnapshot(): CheckpointSnapshot | null {
    return this.snapshot ? { ...this.snapshot } : null;
  }

  restoreForRespawn(): CheckpointRespawnState | null {
    if (!this.snapshot) return null;
    return {
      ...this.snapshot,
      health: Math.max(1, Math.ceil(this.snapshot.maxHealth * this.respawnHealthFraction)),
    };
  }

  clear(): void {
    this.snapshot = null;
  }
}
