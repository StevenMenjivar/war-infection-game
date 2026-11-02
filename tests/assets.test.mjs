import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const required = [
  'assets/images/soldiers/soldier_1.png',
  'assets/images/soldiers/soldier_2.png',
  'assets/images/soldiers/soldier_3.png',
  'assets/images/enemies/zombie_soldier_1.png',
  'assets/images/guns/m416.png',
  'assets/images/guns/benelli_m4.png',
  'assets/images/guns/minugun.png',
  'assets/images/animations/blood.png',
  'assets/images/tiles/UseCaseExample.png',
];

test('todos los recursos principales existen', () => {
  for (const asset of required) assert.ok(existsSync(join(root, asset)), `Falta ${asset}`);
});

test('la carpeta de tiles contiene recursos PNG', () => {
  const tiles = readdirSync(join(root, 'assets/images/tiles')).filter((name) => name.endsWith('.png'));
  assert.ok(tiles.length >= 70, `Se esperaban al menos 70 tiles; encontrados: ${tiles.length}`);
});
