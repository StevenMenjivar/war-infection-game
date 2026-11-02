import Phaser from 'phaser';

export class NameInputScene extends Phaser.Scene {
  private playerName = '';
  private nameText!: Phaser.GameObjects.Text;
  private errorText!: Phaser.GameObjects.Text;
  private submitting = false;

  constructor() { super('NameInputScene'); }

  create(): void {
    this.playerName = '';
    this.submitting = false;
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#090e0c');
    this.add.rectangle(width / 2, height / 2, 650, 390, 0x101a16, 0.96).setStrokeStyle(1, 0x526b58);
    this.add.text(width / 2, 205, 'IDENTIFICACIÓN DEL PERSONAL', {
      fontFamily: 'monospace', fontSize: '13px', color: '#b5d58a', letterSpacing: 2,
    }).setOrigin(0.5);
    this.add.text(width / 2, 270, 'Indica tu nombre, soldado', {
      fontFamily: 'Arial, sans-serif', fontSize: '30px', color: '#e8eee8', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(width / 2, 325, 'MÍNIMO 3 CARACTERES  //  CONFIRMAR CON ENTER', {
      fontFamily: 'monospace', fontSize: '10px', color: '#91a095', letterSpacing: 1,
    }).setOrigin(0.5);
    this.add.rectangle(width / 2, 405, 390, 58, 0x080d0a).setStrokeStyle(1, 0x81977f);
    this.nameText = this.add.text(width / 2, 405, ' _', {
      fontFamily: 'monospace', fontSize: '24px', color: '#d7e6d4',
    }).setOrigin(0.5);
    this.errorText = this.add.text(width / 2, 462, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#df8278',
    }).setOrigin(0.5);
    this.add.text(width / 2, 535, 'ESC  ·  VOLVER AL MENÚ', {
      fontFamily: 'monospace', fontSize: '11px', color: '#718176', letterSpacing: 1,
    }).setOrigin(0.5);

    const keyboard = this.input.keyboard;
    keyboard?.off('keydown', this.handleKey, this);
    keyboard?.on('keydown', this.handleKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard?.off('keydown', this.handleKey, this));
  }

  private handleKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') { this.scene.start('MainMenuScene'); return; }
    if (event.key === 'Enter') {
      if (this.submitting) return;
      const clean = this.playerName.trim();
      if (clean.length < 3) { this.errorText.setText('El nombre debe contener al menos 3 caracteres.'); return; }
      this.submitting = true;
      this.registry.set('playerName', clean);
      this.scene.start('PrologueScene');
      return;
    }
    if (event.key === 'Backspace') this.playerName = this.playerName.slice(0, -1);
    else if (event.key.length === 1 && !event.ctrlKey && !event.altKey && this.playerName.length < 18) {
      if (/^[\p{L}\p{N} _-]$/u.test(event.key)) this.playerName += event.key;
    }
    this.errorText.setText('');
    this.nameText.setText(`${this.playerName || ' _'}${this.playerName.length ? '▌' : ''}`);
  }
}
