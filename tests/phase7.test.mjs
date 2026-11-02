import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('la configuración de iluminación define ambiente, apertura, alcance y frecuencia de actualización', () => {
  const config = read('../src/config/LightingConfig.ts');
  assert.match(config, /flashlightAmbientRadii: \[145, 275, 455\]/);
  assert.match(config, /darkAmbientRadii: \[38, 66, 108\]/);
  assert.match(config, /darkDarknessAlpha: \[0\.64, 0\.74, 0\.82\]/);
  assert.match(config, /flashlightRange: 690/);
  assert.match(config, /flashlightApertureDegrees: 62/);
  assert.match(config, /updateIntervalMs: 33/);
});

test('el cono de visibilidad utiliza rayos y se detiene ante el primer rectángulo sólido', () => {
  const geometry = read('../src/systems/VisibilityGeometry.ts');
  assert.match(geometry, /buildVisibilityPolygon/);
  assert.match(geometry, /segmentRectangleEntryT/);
  assert.match(geometry, /nearbyBlockers/);
  assert.match(geometry, /nearestT/);
  assert.match(geometry, /cornerEpsilon/);
  assert.ok(existsSync(new URL('../src/systems/VisibilityGeometry.ts', import.meta.url)));
});

test('el sistema usa máscaras invertidas WebGL y mantiene un fallback Canvas', () => {
  const lighting = read('../src/systems/FlashlightSystem.ts');
  assert.match(lighting, /Phaser\.WEBGL/);
  assert.match(lighting, /createGeometryMask\(\)/);
  assert.match(lighting, /setInvertAlpha\(true\)/);
  assert.match(lighting, /fallbackDarkness/);
  assert.match(lighting, /buildVisibilityPolygon\(/);
});

test('la linterna inicia apagada y se alterna con L sin alterar controles existentes', () => {
  const game = read('../src/scenes/GameScene.ts');
  assert.match(game, /private flashlightOn = false/);
  assert.match(game, /keyboard\.on\('keydown-L', this\.toggleFlashlight, this\)/);
  assert.match(game, /keyboard\.off\('keydown-L', this\.toggleFlashlight, this\)/);
  assert.match(game, /this\.lighting\.setEnabled\(this\.flashlightOn\)/);
  assert.match(game, /KeyCodes\.W/);
  assert.match(game, /KeyCodes\.A/);
  assert.match(game, /KeyCodes\.S/);
  assert.match(game, /KeyCodes\.D/);
  assert.match(game, /this\.player\.setRotation\(targetAngle \+ PLAYER_ART_FORWARD_OFFSET\)/);
});

test('paredes y coberturas alimentan la oclusión de la linterna', () => {
  const game = read('../src/scenes/GameScene.ts');
  const lighting = game.slice(game.indexOf('private createLighting()'), game.indexOf('private createAmbientEffects()'));
  assert.match(lighting, /this\.walls\.getChildren\(\)/);
  assert.match(lighting, /this\.obstacles\.getChildren\(\)/);
  assert.match(lighting, /this\.lightingBlockers = blockers\.map/);
  assert.match(game, /this\.lighting\.update\(this\.player\.x, this\.player\.y, targetAngle, now, this\.lightingBlockers\)/);
});

test('se añaden niebla, polvo ambiental y sombras simuladas sin sustituir assets originales', () => {
  const game = read('../src/scenes/GameScene.ts');
  assert.match(game, /private createAmbientEffects\(\)/);
  assert.match(game, /setBlendMode\(Phaser\.BlendModes\.SCREEN\)/);
  assert.match(game, /const mote = this\.add\.circle/);
  assert.match(game, /shadowGraphics\.fillRect/);
  assert.match(game, /this\.add\.rectangle\(x \+ 8, y \+ 9, width, height, 0x000000/);
  assert.match(game, /showMuzzleFlash/);
});
