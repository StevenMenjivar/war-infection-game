import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { PLAYER_TIERS, type PlayerTier } from '../config/ProgressionConfig';
import { requestSceneNavigation } from '../systems/SceneNavigation';

interface CheckpointSceneData {
  tier: PlayerTier;
  maxHealth: number;
  kills: number;
  healthFraction: number;
  waveCount: number;
}

/** Pantalla de reintento exclusiva de la arena; GameScene permanece pausada debajo. */
export class CheckpointScene extends Phaser.Scene {
  private dataFromGame!: CheckpointSceneData;
  private transitioning = false;

  constructor() { super('CheckpointScene'); }

  init(data: CheckpointSceneData): void {
    this.dataFromGame = data;
    this.transitioning = false;
  }

  create(): void {
    const tier = PLAYER_TIERS[this.dataFromGame.tier];
    const respawnHealth = Math.max(1, Math.ceil(this.dataFromGame.maxHealth * this.dataFromGame.healthFraction));
    this.cameras.main.setBackgroundColor('#050806');
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020403, 0.94);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 640, 430, 0x101a14, 0.99)
      .setStrokeStyle(2, 0x9e5547, 0.9);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 164, 'CHECKPOINT DE LA HORDA', {
      fontFamily: 'monospace', fontSize: '27px', color: '#e16a58', fontStyle: 'bold', letterSpacing: 1.7,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 92,
      `OPERADOR: ${tier.displayName}\nHOSTILES DE CAMPAÑA: ${this.dataFromGame.kills}\nREAPARICIÓN: ${respawnHealth}/${this.dataFromGame.maxHealth} HP\nOLEADAS POR REINICIAR: ${this.dataFromGame.waveCount}`,
      { fontFamily: 'monospace', fontSize: '14px', color: '#d4dfd3', align: 'center', lineSpacing: 9 },
    ).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 18,
      'La campaña se conserva. La horda regresará a su primera oleada.', {
        fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#9fac9e', align: 'center',
      }).setOrigin(0.5);

    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 'REINTENTAR HORDA', () => {
      if (this.transitioning) return;
      this.transitioning = true;
      const gameScene = this.scene.get('GameScene');
      gameScene.events.emit('checkpoint-retry');
      this.scene.stop();
      this.scene.resume('GameScene');
    });
    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 166, 'REGRESAR AL MENÚ', () => {
      if (this.transitioning) return;
      this.transitioning = true;
      requestSceneNavigation(this, 'MainMenuScene');
    });
  }

  private createButton(x: number, y: number, label: string, action: () => void): void {
    const background = this.add.rectangle(x, y, 310, 48, 0x26392d, 1)
      .setStrokeStyle(1, 0xb5d58a, 0.9);
    const text = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '14px', color: '#e8eee8', fontStyle: 'bold', letterSpacing: 1,
    }).setOrigin(0.5);
    const hitArea = this.add.rectangle(x, y, 310, 48, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => { background.setFillStyle(0x3b563f); text.setColor('#d8f0b7'); });
    hitArea.on('pointerout', () => { background.setFillStyle(0x26392d); text.setColor('#e8eee8'); });
    hitArea.on('pointerdown', action);
  }
}
