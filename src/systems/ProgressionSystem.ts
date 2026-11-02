import { MEDKIT_CONFIG, PLAYER_TIERS, type PlayerTier, type PlayerTierConfig } from '../config/ProgressionConfig';

const EVOLUTION_MILESTONES: ReadonlyArray<{ kills: number; tier: PlayerTier }> = [
  { kills: 11, tier: 2 },
  { kills: 27, tier: 3 },
];

/** Reglas de progreso separadas del ciclo de renderizado y de la física de Phaser. */
export class ProgressionSystem {
  private readonly spawnedEvolutionTiers = new Set<PlayerTier>();
  private currentTier: PlayerTier = 1;

  getCurrentTier(): PlayerTierConfig {
    return PLAYER_TIERS[this.currentTier];
  }

  getCurrentTierId(): PlayerTier {
    return this.currentTier;
  }

  /** Restaura un nivel persistido por checkpoint sin borrar los hitos ya descubiertos. */
  restoreTier(tier: PlayerTier): void {
    if (tier !== 1 && tier !== 2 && tier !== 3) throw new RangeError('Nivel de personaje inválido.');
    this.currentTier = tier;
  }

  /** Devuelve cada hito una sola vez; los objetos quedan a cargo de la escena y no caducan. */
  registerKill(totalKills: number): PlayerTier[] {
    const unlocked: PlayerTier[] = [];
    for (const milestone of EVOLUTION_MILESTONES) {
      if (milestone.kills === totalKills && !this.spawnedEvolutionTiers.has(milestone.tier)) {
        this.spawnedEvolutionTiers.add(milestone.tier);
        unlocked.push(milestone.tier);
      }
    }
    return unlocked;
  }

  /** Evita que recoger el objeto de una evolución anterior provoque un retroceso. */
  collectEvolution(tier: PlayerTier): PlayerTierConfig | null {
    if (tier <= this.currentTier) return null;
    this.currentTier = tier;
    return PLAYER_TIERS[tier];
  }

  getMedkitHealing(maxHealth: number): number {
    return Math.ceil(maxHealth * MEDKIT_CONFIG.healFractionOfMaxHealth);
  }
}
