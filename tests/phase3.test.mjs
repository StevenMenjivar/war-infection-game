import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('las escenas del flujo inicial están registradas', () => {
  const main = read('../src/main.ts');
  for (const scene of ['MainMenuScene', 'NameInputScene', 'PrologueScene', 'GameScene']) {
    assert.match(main, new RegExp(`import \\{ ${scene} \\}`));
    assert.ok(existsSync(new URL(`../src/scenes/${scene}.ts`, import.meta.url)));
  }
});

test('el prólogo conserva los cinco parlamentos y el avance con Enter', () => {
  const prologue = read('../src/scenes/PrologueScene.ts');
  for (const phrase of [
    'CAPITÁN MILLER', 'escuadrón Centauro', 'base Alfa-B', 'elemento HK',
    'convoy de rescate llegará a las 0400', 'Demasiado tarde (No signal sound)...',
    'PRESIONA ENTER PARA CONTINUAR...',
  ]) assert.ok(prologue.includes(phrase), `Falta la frase: ${phrase}`);
});

test('la escena de juego incluye movimiento, orientación y cámara', () => {
  const game = read('../src/scenes/GameScene.ts');
  for (const token of ['KeyCodes.W', 'KeyCodes.A', 'KeyCodes.S', 'KeyCodes.D', 'setRotation', 'startFollow']) {
    assert.ok(game.includes(token), `Falta el control: ${token}`);
  }
});
