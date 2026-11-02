import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create(): void {
    // El router vive durante toda la sesión y controla las transiciones destructivas.
    this.scene.launch('SceneRouterScene');
    this.scene.start('PreloadScene');
  }
}
