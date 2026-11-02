import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('todos los overlays solicitan navegación mediante el router global', () => {
  const navigation = read('../src/systems/SceneNavigation.ts');
  const menu = read('../src/scenes/GameMenuScene.ts');
  const checkpoint = read('../src/scenes/CheckpointScene.ts');
  const victory = read('../src/scenes/VictoryScene.ts');
  for (const source of [menu, checkpoint, victory]) assert.match(source, /requestSceneNavigation\(this,/);
  assert.match(navigation, /source\.game\.events\.emit\(SCENE_NAVIGATION_EVENT, target\)/);
  assert.doesNotMatch(navigation, /source\.scene\.(stop|start|resume)/);
});

test('el router es persistente, detiene las escenas de flujo y ejecuta run desde su propio ScenePlugin', () => {
  const router = read('../src/scenes/SceneRouterScene.ts');
  const boot = read('../src/scenes/BootScene.ts');
  const main = read('../src/main.ts');
  assert.match(router, /this\.game\.events\.on\(SCENE_NAVIGATION_EVENT/);
  assert.match(router, /this\.scene\.stop\(key\)/);
  assert.match(router, /this\.scene\.run\(target\)/);
  assert.doesNotMatch(router, /this\.scene\.start\(target\)/);
  assert.match(boot, /this\.scene\.launch\('SceneRouterScene'\)/);
  assert.match(main, /SceneRouterScene/);
});

test('continuar conserva la reanudación normal y reiniciar/menú delegan en el router', () => {
  const menu = read('../src/scenes/GameMenuScene.ts');
  assert.match(menu, /if \(action === 'continue'\)/);
  assert.match(menu, /this\.scene\.stop\(\);\s*this\.scene\.resume\('GameScene'\)/);
  assert.match(menu, /requestSceneNavigation\(this, action === 'retry' \? 'GameScene' : 'MainMenuScene'\)/);
});

test('Game Over, checkpoint y victoria solicitan salida por la misma ruta central', () => {
  const menu = read('../src/scenes/GameMenuScene.ts');
  const checkpoint = read('../src/scenes/CheckpointScene.ts');
  const victory = read('../src/scenes/VictoryScene.ts');
  assert.match(menu, /mode === 'gameover'/);
  assert.match(menu, /requestSceneNavigation\(this, action === 'retry' \? 'GameScene' : 'MainMenuScene'\)/);
  assert.match(checkpoint, /events\.emit\('checkpoint-retry'\)/);
  assert.match(checkpoint, /requestSceneNavigation\(this, 'MainMenuScene'\)/);
  assert.match(victory, /requestSceneNavigation\(this, 'MainMenuScene'\)/);
});

test('los props de suelo con colisión son pocos y se limitan a las habitaciones seleccionadas', () => {
  const scene = read('../src/scenes/GameScene.ts');
  const props = scene.slice(scene.indexOf('private createEnvironmentalProps()'), scene.indexOf('private getObjectBounds('));
  const cover = scene.slice(scene.indexOf('private createCover()'), scene.indexOf('private createFloorDressing()'));
  assert.match(props, /roomIndex: 1/);
  assert.match(props, /roomIndex: 4/);
  assert.match(props, /roomIndex: 7/);
  assert.doesNotMatch(props, /rooms\.slice\(1, 8\)/);
  assert.match(cover, /roomIndex: 2/);
  assert.match(cover, /roomIndex: 6/);
  assert.doesNotMatch(cover, /rooms\.slice\(1, 8\)/);
});

test('los elementos de rejilla, agujero, ventilador y suciedad siguen sin cuerpos físicos', () => {
  const scene = read('../src/scenes/GameScene.ts');
  const tiles = read('../src/config/tileAssets.ts');
  const dressing = scene.slice(scene.indexOf('private createFloorDressing()'), scene.indexOf('private addFloorTileDecoration('));
  for (const key of ['ventilator', 'hole', 'lattice', 'floorGrungeA', 'floorGrungeB', 'floorDots']) {
    assert.match(dressing, new RegExp(`TILE_TEXTURE_KEYS\\.${key}`));
    assert.match(tiles, new RegExp(`${key}:`));
  }
  assert.doesNotMatch(dressing, /this\.obstacles\.create/);
});

test('todos los tiles referenciados existen', () => {
  const tilesDir = new URL('../assets/images/tiles/', import.meta.url);
  for (const name of [
    'BasicConstruction__0000s_0000s_0000_Lattice.png',
    'BasicConstruction__0000s_0000s_0001_Hole.png',
    'BasicConstruction__0000s_0000s_0002_Ventilator.png',
    'BasicConstruction__0000s_0001s_0003_Old-climate-control-surface.png',
    'BasicConstruction__0000s_0001s_0005_Ventilation-surface.png',
    'BasicConstruction__0000s_0002s_0014_Foam-Nozzle.png',
    'BasicConstruction__0000s_0003s_0005_Floor-dots-texture.png',
    'BasicConstruction__0000s_0003s_0006_Floor-grunge-texture-1.png',
    'BasicConstruction__0000s_0003s_0007_Floor-grunge-texture-2.png',
  ]) assert.ok(existsSync(new URL(name, tilesDir)), `No existe ${name}`);
});
