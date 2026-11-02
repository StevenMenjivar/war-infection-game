import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';

interface PreviewItem { key: string; label: string; x: number; y: number; maxWidth: number; maxHeight: number }

export class AssetPreviewScene extends Phaser.Scene {
  constructor() { super('AssetPreviewScene'); }

  create(): void {
    this.cameras.main.setBackgroundColor('#151c18');
    this.add.text(32, 24, 'WAR INFECTION  /  ASSET CHECK', {
      fontFamily: 'Arial, sans-serif', fontSize: '18px',
      color: '#e4eee5', fontStyle: 'bold', letterSpacing: 2,
    });
    this.add.text(32, 52, 'Fase 2 · Validación visual de recursos cargados', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#91a092',
    });

    const items: PreviewItem[] = [
      { key: 'soldier_1', label: 'SOLDADO 01', x: 155, y: 220, maxWidth: 95, maxHeight: 155 },
      { key: 'soldier_2', label: 'SOLDADO 02', x: 365, y: 220, maxWidth: 95, maxHeight: 155 },
      { key: 'soldier_3', label: 'SOLDADO 03', x: 575, y: 220, maxWidth: 95, maxHeight: 155 },
      { key: 'zombie_soldier_1', label: 'ENEMIGO', x: 825, y: 220, maxWidth: 100, maxHeight: 155 },
      { key: 'blood', label: 'EFECTO / SANGRE', x: 1090, y: 220, maxWidth: 110, maxHeight: 110 },
      { key: 'm416', label: 'CARABINA M416', x: 270, y: 500, maxWidth: 130, maxHeight: 105 },
      { key: 'benelli_m4', label: 'ESCOPETA M4', x: 640, y: 500, maxWidth: 130, maxHeight: 105 },
      { key: 'minigun', label: 'AMETRALLADORA', x: 1000, y: 500, maxWidth: 130, maxHeight: 105 },
    ];

    items.forEach((item) => this.addPreview(item));
    this.add.rectangle(32, 630, GAME_WIDTH - 64, 1, 0x344139).setOrigin(0);
    this.add.text(32, 650, 'Los recursos principales se cargaron. Esta escena es temporal y sirve para validar escalas y anclajes.', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#aab6ab',
    });
    this.add.text(GAME_WIDTH - 32, GAME_HEIGHT - 24, 'ESC / F5 · RECARGAR', {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#718174',
    }).setOrigin(1, 1);

    const missing = items.filter((item) => !this.textures.exists(item.key));
    if (missing.length > 0) {
      console.error('[AssetCheck] Assets faltantes:', missing.map((item) => item.key));
      this.add.text(640, 690, `Recursos faltantes: ${missing.map((item) => item.key).join(', ')}`, {
        fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#ff7777',
      }).setOrigin(0.5);
    } else {
      console.info('[AssetCheck] Todos los sprites principales están disponibles.');
    }
  }

  private addPreview(item: PreviewItem): void {
    this.add.rectangle(item.x, item.y, 170, 220, 0x202a23)
      .setStrokeStyle(1, 0x3c4b3f);
    const image = this.add.image(item.x, item.y - 12, item.key);
    const scale = Math.min(item.maxWidth / image.width, item.maxHeight / image.height);
    image.setScale(scale);
    this.add.text(item.x, item.y + 95, item.label, {
      fontFamily: 'Arial, sans-serif', fontSize: '10px',
      color: '#d5dfd6', letterSpacing: 1, align: 'center',
    }).setOrigin(0.5);
  }
}
