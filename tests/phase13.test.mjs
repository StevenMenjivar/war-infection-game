import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('la navegación destructiva se emite al router persistente desde los overlays', () => {
  const navigation = read('../src/systems/SceneNavigation.ts');
  const router = read('../src/scenes/SceneRouterScene.ts');
  const overlays = [
    read('../src/scenes/GameMenuScene.ts'),
    read('../src/scenes/CheckpointScene.ts'),
    read('../src/scenes/VictoryScene.ts'),
  ];
  assert.match(navigation, /source\.game\.events\.emit\(SCENE_NAVIGATION_EVENT, target\)/);
  for (const overlay of overlays) assert.match(overlay, /requestSceneNavigation\(this,/);
  assert.match(router, /this\.game\.events\.on\(SCENE_NAVIGATION_EVENT, this\.handleNavigation, this\)/);
  assert.match(router, /this\.scene\.run\(target\)/);
  assert.doesNotMatch(router, /this\.scene\.start\(target\)/);
  assert.doesNotMatch(navigation, /source\.scene\.(start|stop|resume)/);
});

test('el router permanece fuera de las escenas que detiene y limpia overlays/campaña antes del destino', () => {
  const router = read('../src/scenes/SceneRouterScene.ts');
  const boot = read('../src/scenes/BootScene.ts');
  const main = read('../src/main.ts');
  for (const key of ['GameScene', 'GameMenuScene', 'CheckpointScene', 'VictoryScene', 'MainMenuScene', 'NameInputScene', 'PrologueScene']) {
    assert.ok(router.includes(`'${key}'`), `Falta limpieza de ${key}`);
  }
  assert.match(router, /this\.scene\.isActive\(key\) \|\| this\.scene\.isPaused\(key\) \|\| this\.scene\.isSleeping\(key\)/);
  assert.match(boot, /launch\('SceneRouterScene'\)/);
  assert.match(main, /BootScene, SceneRouterScene/);
});

test('la búsqueda inicial y la segunda banda reciben +25% de velocidad de persecución', () => {
  const config = read('../src/config/ProgressionConfig.ts');
  assert.match(config, /PHASE13_EARLY_PURSUIT_MULTIPLIER = 1\.25/);
  assert.match(config, /band <= 1/);
  assert.match(config, /moveSpeed: selected\.moveSpeed \* PHASE13_EARLY_PURSUIT_MULTIPLIER/);
  assert.match(config, /return applyPhase9EnemyPressure\(pursuitAdjusted\)/);
  // El ajuste se aplica a moveSpeed (persecución/búsqueda), no a cadence ni a patrolSpeed.
  assert.doesNotMatch(config, /patrolSpeed: selected\.patrolSpeed \* PHASE13_EARLY_PURSUIT_MULTIPLIER/);
  assert.doesNotMatch(config, /fireRateMs: selected\.fireRateMs/);
});

test('la cantidad de obstáculos físicos de campaña cae de 21 a cinco', () => {
  const scene = read('../src/scenes/GameScene.ts');
  const props = scene.slice(scene.indexOf('private createEnvironmentalProps()'), scene.indexOf('private getObjectBounds('));
  const cover = scene.slice(scene.indexOf('private createCover()'), scene.indexOf('private createFloorDressing()'));
  const envRooms = [...props.matchAll(/roomIndex: \d+/g)].map((match) => match[0]);
  const coverRooms = [...cover.matchAll(/roomIndex: \d+/g)].map((match) => match[0]);
  assert.equal(envRooms.length, 3);
  assert.equal(coverRooms.length, 2);
  assert.match(props, /this\.obstacles\.create\(x, y, placement\.key\)/);
  assert.match(cover, /this\.obstacles\.add\(/);
});

test('los bloqueadores de visión y linterna usan el tamaño real de los cuerpos físicos', () => {
  const scene = read('../src/scenes/GameScene.ts');
  const bounds = scene.slice(scene.indexOf('private getObjectBounds('), scene.indexOf('private createPlayer('));
  assert.match(bounds, /body\.x, body\.y, body\.width, body\.height/);
  assert.match(scene, /this\.lightingBlockers = blockers\.map\(\(object\) =>/);
  assert.match(scene, /segmentIntersectsRectangle\(x1, y1, x2, y2, bounds\)/);
});
