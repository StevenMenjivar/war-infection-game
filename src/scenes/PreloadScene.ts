import Phaser from 'phaser';
import { ASSET_PATHS, TILE_ASSET_PATHS } from '../config/AssetManifest';

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressTrack!: Phaser.GameObjects.Rectangle;
  private statusText!: Phaser.GameObjects.Text;

  constructor() { super('PreloadScene'); }

  create(): void {
    this.cameras.main.setBackgroundColor('#101512');
    this.add.text(640, 300, 'WAR INFECTION', {
      fontFamily: 'Arial, sans-serif', fontSize: '34px',
      color: '#e8eee8', fontStyle: 'bold', letterSpacing: 5,
    }).setOrigin(0.5);
    this.add.text(640, 345, 'PREPARANDO RECURSOS', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px',
      color: '#8c9b8e', letterSpacing: 3,
    }).setOrigin(0.5);
    this.progressTrack = this.add.rectangle(640, 390, 360, 8, 0x29342d).setOrigin(0.5);
    this.progressBar = this.add.rectangle(460, 390, 0, 8, 0x9bc36a).setOrigin(0, 0.5);
    this.statusText = this.add.text(640, 415, 'Cargando...', {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#9eaa9f',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      this.progressBar.width = 360 * value;
      this.statusText.setText(`Cargando recursos ${Math.round(value * 100)}%`);
    });
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error(`[AssetLoader] No se pudo cargar: ${file.key} (${file.src})`);
    });
    this.load.once('complete', () => this.scene.start('MainMenuScene'));

    this.load.image('soldier_1', ASSET_PATHS.player.soldier1);
    this.load.image('soldier_2', ASSET_PATHS.player.soldier2);
    this.load.image('soldier_3', ASSET_PATHS.player.soldier3);
    this.load.image('zombie_soldier_1', ASSET_PATHS.enemy.zombieSoldier1);
    this.load.image('m416', ASSET_PATHS.weapons.m416);
    this.load.image('benelli_m4', ASSET_PATHS.weapons.benelliM4);
    this.load.image('minigun', ASSET_PATHS.weapons.minigun);
    this.load.image('blood', ASSET_PATHS.effects.blood);
    this.load.image('use_case', ASSET_PATHS.reference.useCase);
    TILE_ASSET_PATHS.forEach((path, index) => this.load.image(`tile_${index}`, path));

    this.load.start();
  }
}
