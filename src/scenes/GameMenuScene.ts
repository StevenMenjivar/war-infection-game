import Phaser from 'phaser';
import { requestSceneNavigation } from '../systems/SceneNavigation';

type GameMenuMode = 'pause' | 'gameover';
type GameMenuAction = 'continue' | 'retry' | 'menu';

interface GameMenuData {
  mode: GameMenuMode;
  kills?: number;
  playerName?: string;
}

/**
 * Los menús se renderizan en una escena independiente de GameScene.
 * Esto mantiene el input activo aunque la escena de combate esté pausada.
 */
export class GameMenuScene extends Phaser.Scene {
  private mode: GameMenuMode = 'pause';
  private kills = 0;
  private playerName = 'SOLDADO';
  private transitioning = false;

  constructor() { super('GameMenuScene'); }

  init(data: GameMenuData): void {
    this.mode = data.mode === 'gameover' ? 'gameover' : 'pause';
    this.kills = Number.isFinite(data.kills) ? Number(data.kills) : 0;
    this.playerName = String(data.playerName ?? this.registry.get('playerName') ?? 'SOLDADO').toUpperCase();
    this.transitioning = false;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.add.rectangle(width / 2, height / 2, width, height, 0x030605, 0.88);
    const panelHeight = this.mode === 'pause' ? 390 : 350;
    this.add.rectangle(width / 2, height / 2, 560, panelHeight, 0x101a16, 0.99)
      .setStrokeStyle(1, this.mode === 'pause' ? 0x60765f : 0x6a554d, 0.95);

    if (this.mode === 'pause') this.createPauseMenu(width, height);
    else this.createGameOverMenu(width, height);

    const keyboard = this.input.keyboard;
    keyboard?.off('keydown-ESC', this.handleEscape, this);
    keyboard?.on('keydown-ESC', this.handleEscape, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard?.off('keydown-ESC', this.handleEscape, this);
    });
  }

  private createPauseMenu(width: number, height: number): void {
    this.add.text(width / 2, height / 2 - 135, 'JUEGO EN PAUSA', {
      fontFamily: 'monospace', fontSize: '30px', color: '#dbe7d9', fontStyle: 'bold', letterSpacing: 2,
    }).setOrigin(0.5);
    this.createButton(width / 2, height / 2 - 42, 'CONTINUAR', () => this.finish('continue'));
    this.createButton(width / 2, height / 2 + 28, 'REINICIAR PARTIDA', () => this.finish('retry'));
    this.createButton(width / 2, height / 2 + 98, 'MENÚ PRINCIPAL', () => this.finish('menu'));
    this.add.text(width / 2, height / 2 + 160, 'ESC · CONTINUAR', {
      fontFamily: 'monospace', fontSize: '10px', color: '#8b9c8e', letterSpacing: 1.5,
    }).setOrigin(0.5);
  }

  private createGameOverMenu(width: number, height: number): void {
    this.add.text(width / 2, height / 2 - 104, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '46px', color: '#d95050', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 - 35,
      `OPERADOR: ${this.playerName}\nHOSTILES ELIMINADOS: ${this.kills}`,
      { fontFamily: 'monospace', fontSize: '13px', color: '#d8e0d8', align: 'center', lineSpacing: 7 },
    ).setOrigin(0.5);
    this.createButton(width / 2, height / 2 + 52, 'REINTENTAR', () => this.finish('retry'));
    this.createButton(width / 2, height / 2 + 122, 'REGRESAR AL MENÚ', () => this.finish('menu'));
  }

  private createButton(x: number, y: number, label: string, action: () => void): void {
    const background = this.add.rectangle(x, y, 310, 48, 0x26392d, 1)
      .setStrokeStyle(1, 0xb5d58a, 0.9);
    const text = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '14px', color: '#e8eee8', fontStyle: 'bold', letterSpacing: 1.3,
    }).setOrigin(0.5);
    // La hit-area es independiente de la decoración para tener un área de clic fiable.
    const hitArea = this.add.rectangle(x, y, 310, 48, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => { background.setFillStyle(0x3b563f); text.setColor('#d8f0b7'); });
    hitArea.on('pointerout', () => { background.setFillStyle(0x26392d); text.setColor('#e8eee8'); });
    hitArea.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: { stopPropagation(): void }) => {
      event.stopPropagation();
      action();
    });
  }

  private handleEscape(): void {
    if (this.mode === 'pause') this.finish('continue');
  }

  private finish(action: GameMenuAction): void {
    if (this.transitioning) return;
    this.transitioning = true;

    if (action === 'continue') {
      // Único caso que debe reanudar el combate; no hay transición de escena.
      this.scene.stop();
      this.scene.resume('GameScene');
      return;
    }

    // Reiniciar y salir nunca reanudan una escena que van a descartar.
    requestSceneNavigation(this, action === 'retry' ? 'GameScene' : 'MainMenuScene');
  }
}
