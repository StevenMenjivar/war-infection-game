import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';

/** Primera escena de juego: movimiento, orientación y cámara. El mapa y combate llegan en fases posteriores. */
export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private cursors!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private pauseLabel?: Phaser.GameObjects.Text;

  constructor() { super('GameScene'); }

  create(): void {
    this.cameras.main.setBackgroundColor('#111913');
    const worldWidth = 1900, worldHeight = 1300;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.add.tileSprite(0, 0, worldWidth, worldHeight, 'tile_0').setOrigin(0).setAlpha(0.38);
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x344238, 0.35);
    for (let x = 0; x <= worldWidth; x += 64) grid.lineBetween(x, 0, x, worldHeight);
    for (let y = 0; y <= worldHeight; y += 64) grid.lineBetween(0, y, worldWidth, y);
    this.add.rectangle(worldWidth / 2, 20, worldWidth, 40, 0x28362d);
    this.add.rectangle(worldWidth / 2, worldHeight - 20, worldWidth, 40, 0x28362d);
    this.add.rectangle(20, worldHeight / 2, 40, worldHeight, 0x28362d);
    this.add.rectangle(worldWidth - 20, worldHeight / 2, 40, worldHeight, 0x28362d);

    this.player = this.physics.add.image(280, 280, 'soldier_1').setDisplaySize(70, 112);
    this.player.setCollideWorldBounds(true);
    this.player.setDamping(true).setDrag(0.86).setMaxVelocity(230);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.05);

    const keyboard = this.input.keyboard!;
    this.cursors = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    keyboard.on('keydown-ESC', this.togglePause, this);

    const name = String(this.registry.get('playerName') ?? 'Soldado');
    this.add.text(24, 22, `OPERADOR: ${name.toUpperCase()}\nPROTOCOLO DE MOVIMIENTO // WASD · APUNTAR CON MOUSE`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#d7e4d7', lineSpacing: 7,
      backgroundColor: '#0a100ddd', padding: { x: 12, y: 9 },
    }).setScrollFactor(0).setDepth(10);
    this.add.text(GAME_WIDTH - 24, 22, 'FASE 3  //  ENTRENAMIENTO', {
      fontFamily: 'monospace', fontSize: '11px', color: '#b5d58a',
      backgroundColor: '#0a100ddd', padding: { x: 12, y: 9 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);
    this.pauseLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PAUSA\n\nESC PARA CONTINUAR', {
      fontFamily: 'monospace', fontSize: '25px', color: '#e8eee8', align: 'center',
      backgroundColor: '#080d0bee', padding: { x: 35, y: 25 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setVisible(false);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard.off('keydown-ESC', this.togglePause, this));
  }

  update(): void {
    if (!this.physics.world.isPaused) {
      const direction = new Phaser.Math.Vector2(
        Number(this.cursors.D.isDown) - Number(this.cursors.A.isDown),
        Number(this.cursors.S.isDown) - Number(this.cursors.W.isDown),
      );
      if (direction.lengthSq() > 0) direction.normalize().scale(230);
      this.player.setAcceleration(direction.x * 5, direction.y * 5);
      const pointer = this.input.activePointer;
      const worldPointer = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.player.setRotation(Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPointer.x, worldPointer.y));
    }
  }

  private togglePause(): void {
    const paused = !this.physics.world.isPaused;
    this.physics.world.isPaused = paused;
    this.pauseLabel?.setVisible(paused);
  }
}
