import Phaser from 'phaser';

const C = { bg: 0x090e0c, panel: 0x101a16, green: 0xb5d58a, muted: '#91a095', red: 0xb94a42, white: '#e8eee8' };

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(C.bg);
    this.drawAtmosphere();

    this.add.rectangle(width * 0.5, height * 0.5, width * 0.48, height * 0.78, C.panel, 0.78)
      .setStrokeStyle(1, 0x405347, 0.65);
    this.add.rectangle(width * 0.5, height * 0.5, 5, height * 0.78, C.green, 0.8);

    this.add.text(width * 0.5, 150, 'TRANSMISIÓN DE EMERGENCIA  //  BASE ALFA-B', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9caf9f', letterSpacing: 2,
    }).setOrigin(0.5);
    this.add.text(width * 0.5, 235, 'WAR', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '76px', color: C.white,
      fontStyle: 'bold', letterSpacing: 10, stroke: '#27382e', strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(width * 0.5, 305, 'INFECTION', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '54px', color: C.red,
      fontStyle: 'bold', letterSpacing: 7,
    }).setOrigin(0.5);
    this.add.rectangle(width * 0.5, 354, 290, 1, 0x637568, 0.65);
    this.add.text(width * 0.5, 390, 'LA CONTENCIÓN HA FALLADO', {
      fontFamily: 'monospace', fontSize: '13px', color: '#c4cec5', letterSpacing: 3,
    }).setOrigin(0.5);
    this.add.text(width * 0.5, 420, 'SUPERVIVE. AVANZA. LLEGA A EXTRACCIÓN.', {
      fontFamily: 'monospace', fontSize: '10px', color: C.muted, letterSpacing: 1.5,
    }).setOrigin(0.5);

    this.makeButton(width * 0.5, 520, 'JUGAR AHORA', () => this.scene.start('NameInputScene'));
    this.add.text(width * 0.5, 600, 'PROTOCOLO HK  //  CLASIFICACIÓN: CRÍTICA', {
      fontFamily: 'monospace', fontSize: '10px', color: '#65766b', letterSpacing: 1.5,
    }).setOrigin(0.5);

    const soldier = this.add.image(width * 0.82, height * 0.52, 'soldier_1')
      .setScale(0.72).setAlpha(0.9);
    soldier.setDepth(2);
    this.tweens.add({ targets: soldier, y: soldier.y - 5, duration: 2100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(width * 0.82, height * 0.78, 'UNIDAD CENTAURO\nSEÑAL PERDIDA', {
      fontFamily: 'monospace', fontSize: '10px', color: '#9aaba0', align: 'center', lineSpacing: 5,
    }).setOrigin(0.5);
  }

  private drawAtmosphere(): void {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.fillGradientStyle(0x18241c, 0x18241c, 0x070b09, 0x070b09, 0.48);
    g.fillRect(0, 0, width, height);
    for (let i = 0; i < 34; i++) {
      const x = Phaser.Math.Between(0, width), y = Phaser.Math.Between(0, height);
      g.fillStyle(i % 4 === 0 ? 0x9bb77f : 0x52675a, Phaser.Math.FloatBetween(0.04, 0.14));
      g.fillCircle(x, y, Phaser.Math.Between(1, 3));
    }
    g.lineStyle(1, 0x506252, 0.16);
    for (let x = 0; x < width; x += 48) g.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 48) g.lineBetween(0, y, width, y);
  }

  private makeButton(x: number, y: number, label: string, action: () => void): void {
    const bg = this.add.rectangle(x, y, 260, 58, 0x26392d).setStrokeStyle(1, 0xb5d58a, 0.9);
    const txt = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '17px', color: '#e8eee8', fontStyle: 'bold', letterSpacing: 2,
    }).setOrigin(0.5);
    const hit = this.add.rectangle(x, y, 260, 58, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { bg.setFillStyle(0x3b563f); txt.setColor('#d8f0b7'); });
    hit.on('pointerout', () => { bg.setFillStyle(0x26392d); txt.setColor('#e8eee8'); });
    hit.on('pointerdown', action);
  }
}
