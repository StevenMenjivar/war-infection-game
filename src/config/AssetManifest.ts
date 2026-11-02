import { TILE_ASSETS } from './tileAssets';

export const ASSET_PATHS = {
  player: {
    soldier1: 'assets/images/soldiers/soldier_1.png',
    soldier2: 'assets/images/soldiers/soldier_2.png',
    soldier3: 'assets/images/soldiers/soldier_3.png',
  },
  enemy: { zombieSoldier1: 'assets/images/enemies/zombie_soldier_1.png' },
  weapons: {
    m416: 'assets/images/guns/m416.png',
    benelliM4: 'assets/images/guns/benelli_m4.png',
    // El archivo entregado se llama minugun.png; no se renombra para preservar el asset original.
    minigun: 'assets/images/guns/minugun.png',
  },
  effects: { blood: 'assets/images/animations/blood.png' },
  reference: { useCase: 'assets/images/tiles/UseCaseExample.png' },
} as const;

export const TILE_ASSET_PATHS = TILE_ASSETS.map(
  (fileName) => `assets/images/tiles/${fileName}`,
);

export const REQUIRED_ASSET_KEYS = [
  'soldier_1', 'soldier_2', 'soldier_3', 'zombie_soldier_1',
  'm416', 'benelli_m4', 'minigun', 'blood', 'use_case',
] as const;
