import { HORDE_CONFIG } from '../config/HordeConfig';

export interface HordeWaveState {
  number: number;
  totalWaves: number;
  enemyCount: number;
  remaining: number;
  isFinal: boolean;
}

/** Control determinista de oleadas; no depende de Phaser ni crea entidades. */
export class HordeWaveSystem {
  private waveIndex = -1;
  private remaining = 0;
  private started = false;

  start(): HordeWaveState | null {
    this.reset();
    return this.startNextWave();
  }

  startNextWave(): HordeWaveState | null {
    if (this.remaining > 0) return null;
    const nextIndex = this.waveIndex + 1;
    if (nextIndex >= HORDE_CONFIG.waveCounts.length) {
      this.started = false;
      return null;
    }
    this.waveIndex = nextIndex;
    this.remaining = HORDE_CONFIG.waveCounts[nextIndex]!;
    this.started = true;
    return this.getState();
  }

  registerEnemyDefeated(): boolean {
    if (!this.started || this.remaining <= 0) return false;
    this.remaining--;
    if (this.remaining === 0) this.started = false;
    return this.remaining === 0;
  }

  getState(): HordeWaveState | null {
    if (this.waveIndex < 0) return null;
    return {
      number: this.waveIndex + 1,
      totalWaves: HORDE_CONFIG.waveCounts.length,
      enemyCount: HORDE_CONFIG.waveCounts[this.waveIndex]!,
      remaining: this.remaining,
      isFinal: this.waveIndex === HORDE_CONFIG.waveCounts.length - 1,
    };
  }

  isComplete(): boolean {
    return this.waveIndex === HORDE_CONFIG.waveCounts.length - 1
      && this.remaining === 0 && !this.started;
  }

  reset(): void {
    this.waveIndex = -1;
    this.remaining = 0;
    this.started = false;
  }
}
