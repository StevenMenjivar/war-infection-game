import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('todos los perfiles enemigos reciben +50% de velocidad y +50% de frecuencia de disparo', () => {
  const config = read('../src/config/HordeConfig.ts');
  const progression = read('../src/config/ProgressionConfig.ts');
  const enemy = read('../src/entities/Enemy.ts');
  assert.match(config, /moveSpeedMultiplier: 1\.5/);
  assert.match(config, /patrolSpeedMultiplier: 1\.5/);
  assert.match(config, /fireFrequencyMultiplier: 1\.5/);
  assert.match(config, /fireRateMs: Math\.round\(profile\.fireRateMs \/ PHASE9_ENEMY_PRESSURE\.fireFrequencyMultiplier\)/);
  assert.match(progression, /return applyPhase9EnemyPressure\(profiles\[band\]!\)/);
  assert.match(enemy, /this\.difficulty\.moveSpeed \* this\.pursuitSpeedMultiplier/);
  assert.match(enemy, /this\.difficulty\.fireRateMs \* this\.fireRateMultiplier/);
});

test('la oscuridad de Fase 9 es superior a Fase 8 y la linterna conserva su cono', () => {
  const config = read('../src/config/LightingConfig.ts');
  const lighting = read('../src/systems/FlashlightSystem.ts');
  assert.match(config, /darkAmbientRadii: \[38, 66, 108\]/);
  assert.match(config, /darkDarknessAlpha: \[0\.64, 0\.74, 0\.82\]/);
  assert.match(config, /canvasDarknessAlphaOff: 0\.88/);
  assert.match(lighting, /buildVisibilityPolygon/);
  assert.match(lighting, /setEnabled\(enabled: boolean\)/);
});

test('el mapa dedica una sala amplia al extremo final y mantiene conexión procedural', () => {
  const map = read('../src/systems/ProceduralMapGenerator.ts');
  assert.match(map, /private readonly columns = 64/);
  assert.match(map, /private readonly rows = 48/);
  assert.match(map, /const isFinalArena = row === 2 && col === 2/);
  assert.match(map, /const width = isFinalArena \? 20/);
  assert.match(map, /const height = isFinalArena \? 14/);
  assert.match(map, /static hasPath/);
});

test('la horda contiene tres oleadas y la última mantiene 50 enemigos simultáneos', () => {
  const config = read('../src/config/HordeConfig.ts');
  const system = read('../src/systems/HordeWaveSystem.ts');
  assert.match(config, /waveCounts: \[12, 24, 50\]/);
  assert.match(config, /maxEnemyGroupSize: 64/);
  const combat = read('../src/config/CombatConfig.ts');
  assert.match(combat, /maxEnemyProjectiles: 220/);
  assert.match(system, /registerEnemyDefeated\(\)/);
  assert.match(system, /startNextWave\(\)/);
  assert.match(system, /isFinal: this\.waveIndex === HORDE_CONFIG\.waveCounts\.length - 1/);
});

test('la arena espera el hito de campaña y genera enemigos desde cuatro lados', () => {
  const scene = read('../src/scenes/GameScene.ts');
  const spawn = scene.slice(scene.indexOf('private spawnHordeWave('), scene.indexOf('private onHordeWaveCleared('));
  assert.match(scene, /if \(this\.kills < CAMPAIGN_CONFIG\.totalEnemyCount\)/);
  assert.match(scene, /this\.checkpoint\.capture\(/);
  assert.match(spawn, /const side = index % 4/);
  assert.match(spawn, /getEnemyDifficultyForWave\(wave\.number\)/);
  assert.match(scene, /this\.map\.rooms\.slice\(1, 8\)/);
  assert.doesNotMatch(scene, /arenaCovers/);
  assert.match(scene, /private enemyPool: Enemy\[\] = \[\]/);
  assert.match(scene, /this\.enemyPool\.pop\(\)/);
  assert.match(scene, /this\.enemyPool\.push\(enemy\)/);
  const enemy = read('../src/entities/Enemy.ts');
  assert.match(enemy, /resetForWave\(/);
  assert.match(enemy, /deactivateForPool\(/);
});

test('al morir en la horda se muestra CheckpointScene y al reintentar solo reinicia la horda', () => {
  const scene = read('../src/scenes/GameScene.ts');
  const checkpoint = read('../src/scenes/CheckpointScene.ts');
  const main = read('../src/main.ts');
  assert.ok(existsSync(new URL('../src/scenes/CheckpointScene.ts', import.meta.url)));
  assert.match(scene, /if \(this\.hordeStarted\) this\.showCheckpointRetry\(\)/);
  assert.match(scene, /this\.checkpoint\.restoreForRespawn\(\)/);
  assert.match(scene, /this\.progression\.restoreTier\(state\.tier\)/);
  assert.match(scene, /this\.horde\.reset\(\)/);
  assert.match(scene, /this\.waveAdvanceEvent\?\.remove\(false\)/);
  assert.match(checkpoint, /REINTENTAR HORDA/);
  assert.match(checkpoint, /checkpoint-retry/);
  assert.match(main, /CheckpointScene/);
});

test('al completar la oleada final se llama a VictoryScene', () => {
  const scene = read('../src/scenes/GameScene.ts');
  assert.match(scene, /if \(state\.isFinal\)/);
  assert.match(scene, /this\.scene\.start\('VictoryScene'/);
});
