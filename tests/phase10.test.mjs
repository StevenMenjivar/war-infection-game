import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('pausa y Game Over usan escena overlay independiente con hit areas activas', () => {
  const scene = read('../src/scenes/GameScene.ts');
  const menu = read('../src/scenes/GameMenuScene.ts');
  assert.match(scene, /this\.scene\.launch\('GameMenuScene'/);
  assert.match(scene, /this\.scene\.pause\(\)/);
  assert.match(menu, /setInteractive\(\{ useHandCursor: true \}\)/);
  assert.match(menu, /hitArea\.on\('pointerdown'/);
  assert.match(menu, /event\.stopPropagation\(\)/);
  assert.match(menu, /this\.scene\.resume\('GameScene'\)/);
  assert.match(menu, /requestSceneNavigation/);
});

test('continuar reanuda GameScene y las acciones destructivas usan transición directa', () => {
  const scene = read('../src/scenes/GameScene.ts');
  const menu = read('../src/scenes/GameMenuScene.ts');
  assert.doesNotMatch(scene, /pendingMenuAction|handleGameMenuAction|game-menu-action/);
  assert.match(menu, /requestSceneNavigation\(this, action === 'retry' \? 'GameScene' : 'MainMenuScene'\)/);
  assert.match(menu, /this\.scene\.stop\(\)/);
  assert.match(menu, /this\.scene\.resume\('GameScene'\)/);
  assert.match(scene, /Phaser\.Scenes\.Events\.RESUME, this\.handleSceneResume, this/);
});

test('el prólogo reinicia su diálogo y limpia sus listeners al reentrar después de una victoria', () => {
  const scene = read('../src/scenes/PrologueScene.ts');
  const create = scene.slice(scene.indexOf('create(): void'), scene.indexOf('private startGame(): void'));
  assert.match(create, /this\.lineIndex = 0/);
  assert.match(create, /this\.visibleWords = 0/);
  assert.match(create, /this\.transitionPending = false/);
  assert.match(create, /keyboard\?\.off\('keydown-ENTER', this\.advance, this\)/);
  assert.match(create, /Phaser\.Scenes\.Events\.SHUTDOWN/);
  assert.match(create, /this\.typingTimer\?\.remove\(false\)/);
  assert.match(scene, /private startGame\(\): void/);
  assert.match(scene, /if \(this\.transitionPending\) return/);
});

test('NameInput evita transiciones duplicadas por Enter', () => {
  const scene = read('../src/scenes/NameInputScene.ts');
  assert.match(scene, /private submitting = false/);
  assert.match(scene, /if \(this\.submitting\) return/);
  assert.match(scene, /this\.submitting = true/);
});

test('la campaña duplica objetivos iniciales y refuerzos y retrasa el acceso a la horda hasta 54 bajas', () => {
  const combat = read('../src/config/CombatConfig.ts');
  const scene = read('../src/scenes/GameScene.ts');
  assert.match(combat, /combatRoomCount: 7/);
  assert.match(combat, /initialEnemiesPerRoom: 4/);
  assert.match(combat, /initialEnemyCount: 28/);
  assert.match(combat, /reinforcementCount: 26/);
  assert.match(combat, /totalEnemyCount: 54/);
  assert.match(scene, /this\.kills === CAMPAIGN_CONFIG\.initialEnemyCount/);
  assert.match(scene, /spawned < CAMPAIGN_CONFIG\.reinforcementCount/);
  assert.match(scene, /this\.kills < CAMPAIGN_CONFIG\.totalEnemyCount/);
});

test('la zona de extracción ya no crea barricadas físicas', () => {
  const scene = read('../src/scenes/GameScene.ts');
  const cover = scene.slice(scene.indexOf('private createCover()'), scene.indexOf('private createPlayer()'));
  assert.doesNotMatch(cover, /arenaCovers/);
  assert.doesNotMatch(cover, /this\.obstacles\.add\(this\.add\.rectangle\(cover\./);
  assert.match(cover, /área de extracción queda despejada/);
  assert.match(cover, /roomIndex: 2/);
  assert.match(cover, /roomIndex: 6/);
});

test('GameScene limpia eventos, temporizadores, tweens y referencias al apagarse', () => {
  const scene = read('../src/scenes/GameScene.ts');
  const shutdown = scene.slice(scene.indexOf('Phaser.Scenes.Events.SHUTDOWN'), scene.indexOf("this.events.on(\'checkpoint-retry\'"));
  assert.match(shutdown, /keyboard\.off\('keydown-ESC'/);
  assert.match(shutdown, /keyboard\.off\('keydown-L'/);
  assert.match(shutdown, /this\.time\.removeAllEvents\(\)/);
  assert.match(shutdown, /this\.tweens\.killAll\(\)/);
  assert.doesNotMatch(shutdown, /game-menu-action/);
  assert.match(shutdown, /this\.events\.off\(Phaser\.Scenes\.Events\.RESUME/);
  assert.match(shutdown, /this\.enemyPool = \[\]/);
});

test('la cantidad inicial se genera con cuatro instancias en cada una de las siete salas de combate', () => {
  const scene = read('../src/scenes/GameScene.ts');
  const spawn = scene.slice(scene.indexOf('private spawnEnemies()'), scene.indexOf('private createEnemy('));
  assert.match(spawn, /this\.map\.rooms\.slice\(1, 8\)/);
  assert.match(spawn, /const count = ENEMY_CONFIG\.initialCountPerRoom/);
  const config = read('../src/config/CombatConfig.ts');
  assert.match(config, /initialCountPerRoom: CAMPAIGN_CONFIG\.initialEnemiesPerRoom/);
});
