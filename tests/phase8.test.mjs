import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('linterna apagada reduce el radio de iluminación y aumenta la oscuridad ambiental', () => {
  const config = read('../src/config/LightingConfig.ts');
  const system = read('../src/systems/FlashlightSystem.ts');
  assert.match(config, /darkAmbientRadii: \[38, 66, 108\]/);
  assert.match(config, /darkDarknessAlpha: \[0\.64, 0\.74, 0\.82\]/);
  assert.match(config, /flashlightAmbientRadii: \[145, 275, 455\]/);
  assert.match(system, /const radii = this\.enabled[\s\S]*?LIGHTING_CONFIG\.darkAmbientRadii/);
  assert.match(system, /const darknessAlpha = this\.enabled[\s\S]*?LIGHTING_CONFIG\.darkDarknessAlpha/);
  assert.match(system, /canvasDarknessAlphaOff/);
});

test('la evolución de personaje incrementa persecución y frecuencia de disparo de los enemigos', () => {
  const config = read('../src/config/ProgressionConfig.ts');
  const enemy = read('../src/entities/Enemy.ts');
  const scene = read('../src/scenes/GameScene.ts');
  assert.match(config, /2: \{ pursuitSpeedMultiplier: 1\.12, fireRateMultiplier: 0\.88/);
  assert.match(config, /3: \{ pursuitSpeedMultiplier: 1\.25, fireRateMultiplier: 0\.74/);
  assert.match(enemy, /setPlayerTierPressure\(tier: PlayerTier\)/);
  assert.match(enemy, /this\.difficulty\.moveSpeed \* this\.pursuitSpeedMultiplier/);
  assert.match(enemy, /this\.difficulty\.fireRateMs \* this\.fireRateMultiplier/);
  assert.match(enemy, /setMaxVelocity\(/);
  assert.match(scene, /this\.applyEnemyTierPressure\(tier\)/);
  assert.match(scene, /enemy\.setPlayerTierPressure\(this\.progression\.getCurrentTierId\(\)\)/);
});

test('la pausa ofrece continuar, reiniciar y volver al menú, y detiene reloj, física y tweens', () => {
  const scene = read('../src/scenes/GameScene.ts');
  assert.match(scene, /private openPauseMenu\(\)/);
  assert.match(scene, /'CONTINUAR'/);
  assert.match(scene, /'REINICIAR PARTIDA'/);
  assert.match(scene, /'MENÚ PRINCIPAL'/);
  assert.match(scene, /this\.time\.paused = true/);
  assert.match(scene, /this\.physics\.world\.isPaused = true/);
  assert.match(scene, /this\.tweens\.pauseAll\(\)/);
  assert.match(scene, /private resumeGame\(\)/);
});

test('Game Over permite reintentar o regresar al menú', () => {
  const scene = read('../src/scenes/GameScene.ts');
  assert.match(scene, /'REINTENTAR'/);
  assert.match(scene, /'REGRESAR AL MENÚ'/);
  assert.match(scene, /this\.scene\.start\('MainMenuScene'\)/);
});

test('NameInput limpia el estado al entrar de nuevo y mantiene validación y Enter', () => {
  const scene = read('../src/scenes/NameInputScene.ts');
  assert.match(scene, /this\.playerName = ''/);
  assert.match(scene, /clean\.length < 3/);
  assert.match(scene, /this\.scene\.start\('PrologueScene'\)/);
});

test('la pantalla de victoria está registrada y contiene el texto y retorno al menú solicitados', () => {
  const scene = read('../src/scenes/VictoryScene.ts');
  const main = read('../src/main.ts');
  assert.ok(existsSync(new URL('../src/scenes/VictoryScene.ts', import.meta.url)));
  assert.match(scene, /YOU WON!/);
  assert.match(scene, /Has llegado justo a tiempo para el rescate\./);
  assert.match(scene, /REGRESAR AL MENÚ/);
  assert.match(main, /VictoryScene/);
});

test('el sistema de checkpoint preserva posición, personaje, bajas y restaura el 50% de vida máxima', () => {
  const checkpoint = read('../src/systems/CheckpointSystem.ts');
  assert.ok(existsSync(new URL('../src/systems/CheckpointSystem.ts', import.meta.url)));
  assert.match(checkpoint, /respawnHealthFraction = 0\.5/);
  assert.match(checkpoint, /capture\(state: CheckpointSnapshot\)/);
  assert.match(checkpoint, /restoreForRespawn\(\)/);
  assert.match(checkpoint, /health: Math\.max\(1, Math\.ceil\(this\.snapshot\.maxHealth \* this\.respawnHealthFraction\)\)/);
  assert.match(checkpoint, /tier: PlayerTier/);
  assert.match(checkpoint, /kills: number/);
});
