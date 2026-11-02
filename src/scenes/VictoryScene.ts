import Phaser from 'phaser';

/** Pantalla de victoria reutilizable por el flujo de la horda final (Fase 9). */
export class VictoryScene extends Phaser.Scene {
  constructor() { super('VictoryScene'); }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#070c09');
    const atmosphere = this.add.graphics();
    atmosphere.fillGradientStyle(0x263b2b, 0x263b2b, 0x070c09, 0x070c09, 0.7);
    atmosphere.fillRect(0, 0, width, height);
    this.add.rectangle(width / 2, height / 2, 690, 430, 0x0d1711, 0.94)
      .setStrokeStyle(1, 0x9ebd83, 0.9);
    this.add.text(width / 2, height * 0.31, 'SEÑAL DE EXTRACCIÓN CONFIRMADA', {
      fontFamily: 'monospace', fontSize: '12px', color: '#b5d58a', letterSpacing: 2,
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.43, 'YOU WON!', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '64px', color: '#e7f0df',
      fontStyle: 'bold', stroke: '#36513b', strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.55, 'Has llegado justo a tiempo para el rescate.', {
      fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#c8d5c8',
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.64,
      `OPERADOR: ${String(this.registry.get('playerName') ?? 'SOLDADO').toUpperCase()}`,
      { fontFamily: 'monospace', fontSize: '12px', color: '#91a095', letterSpacing: 1.5 },
    ).setOrigin(0.5);

    const y = height * 0.77;
    const background = this.add.rectangle(width / 2, y, 290, 52, 0x26392d)
      .setStrokeStyle(1, 0xb5d58a, 0.95);
    const label = this.add.text(width / 2, y, 'REGRESAR AL MENÚ', {
      fontFamily: 'monospace', fontSize: '15px', color: '#e8eee8', fontStyle: 'bold', letterSpacing: 1.4,
    }).setOrigin(0.5);
    const hitArea = this.add.rectangle(width / 2, y, 290, 52, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => { background.setFillStyle(0x3b563f); label.setColor('#d8f0b7'); });
    hitArea.on('pointerout', () => { background.setFillStyle(0x26392d); label.setColor('#e8eee8'); });
    hitArea.on('pointerdown', () => this.scene.start('MainMenuScene'));

  }
}
