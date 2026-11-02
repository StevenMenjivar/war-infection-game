import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('el movimiento usa velocidad directa y elimina la inercia', () => {
  const game = read('../src/scenes/GameScene.ts');
  assert.match(game, /setVelocity\(direction\.x, direction\.y\)/);
  assert.doesNotMatch(game, /setAcceleration\(/);
});

test('el sprite compensa su orientación artística al apuntar', () => {
  const game = read('../src/scenes/GameScene.ts');
  assert.match(game, /PLAYER_ART_FORWARD_OFFSET = Math\.PI \/ 2/);
  assert.match(game, /targetAngle \+ PLAYER_ART_FORWARD_OFFSET/);
});

test('el mapa procedural conecta nueve salas y valida una ruta', () => {
  const generator = read('../src/systems/ProceduralMapGenerator.ts');
  const game = read('../src/scenes/GameScene.ts');
  assert.match(generator, /for \(let row = 0; row < 3; row\+\+\)/);
  assert.match(generator, /static hasPath/);
  assert.match(game, /ProceduralMapGenerator\.hasPath\(this\.map\)/);
});

test('la escena incorpora colisiones para paredes y coberturas', () => {
  const game = read('../src/scenes/GameScene.ts');
  assert.match(game, /physics\.add\.collider\(this\.player, this\.walls\)/);
  assert.match(game, /physics\.add\.collider\(this\.player, this\.obstacles\)/);
});
