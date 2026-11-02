import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('la configuración centraliza las tres armas y sus perfiles de disparo', () => {
  const config = read('../src/config/CombatConfig.ts');
  for (const token of [
    "m416: {", "benelli_m4: {", "minigun: {", 'fireRateMs:',
    'spreadRadians:', 'range:', 'projectileSpeed:', 'pellets:',
  ]) assert.ok(config.includes(token), `Falta configuración de combate: ${token}`);
  assert.match(config, /damageMultiplier: 1/);
  assert.match(config, /damageMultiplier: 2/);
  assert.match(config, /damageMultiplier: 3/);
  assert.match(config, /pellets: 4/);
});

test('los proyectiles tienen pooling, alcance y colisiones contra paredes/obstáculos', () => {
  const scene = read('../src/scenes/GameScene.ts');
  assert.match(scene, /maxSize: COMBAT_CONFIG\.maxPlayerProjectiles/);
  assert.match(scene, /remainingRange/);
  assert.match(scene, /updateAimLaser\(/);
  assert.match(scene, /segmentRectangleEntryT/);
  assert.match(scene, /collider\(this\.playerProjectiles, this\.walls/);
  assert.match(scene, /collider\(this\.playerProjectiles, this\.obstacles/);
  assert.match(scene, /collider\(this\.enemyProjectiles, this\.walls/);
  assert.match(scene, /collider\(this\.enemyProjectiles, this\.obstacles/);
});

test('los disparos del jugador impactan enemigos y los del enemigo dañan al jugador', () => {
  const scene = read('../src/scenes/GameScene.ts');
  assert.match(scene, /overlap\(this\.playerProjectiles, this\.enemies/);
  assert.match(scene, /overlap\(this\.enemyProjectiles, this\.player/);
  assert.match(scene, /enemy\.takeDamage\(damage/);
  assert.match(scene, /this\.damagePlayer\(damage\)/);
});

test('los enemigos implementan estados, salud, IA y separación', () => {
  const enemy = read('../src/entities/Enemy.ts');
  for (const state of ['Idle', 'Patrolling', 'Moving', 'Searching', 'Aiming', 'Shooting', 'Hit', 'Dying']) {
    assert.ok(enemy.includes(`'${state}'`), `Falta estado enemigo: ${state}`);
  }
  assert.match(enemy, /takeDamage\(/);
  assert.match(enemy, /updateHealthBar\(/);
  const scene = read('../src/scenes/GameScene.ts');
  assert.match(scene, /collider\(this\.enemies, this\.enemies/);
  assert.match(scene, /applyEnemySeparation\(/);
  assert.match(scene, /hasLineOfSight\(/);
});

test('la línea de visión utiliza intersección geométrica con rectángulos sólidos', () => {
  const geometry = read('../src/systems/Geometry.ts');
  assert.match(geometry, /segmentIntersectsRectangle/);
  assert.match(geometry, /segmentRectangleEntryT/);
  assert.match(geometry, /Liang-Barsky/);
  assert.ok(existsSync(new URL('../src/systems/Geometry.ts', import.meta.url)));
});

test('los impactos y la muerte muestran partículas, sangre y Game Over', () => {
  const scene = read('../src/scenes/GameScene.ts');
  assert.match(scene, /createHitParticles\(/);
  assert.match(scene, /createBloodAt\(/);
  assert.match(scene, /showGameOver\(/);
  assert.match(scene, /REINTENTAR/);
});

test('reintentar reinicia salud, contador, arma, disparo y pausa', () => {
  const scene = read('../src/scenes/GameScene.ts');
  for (const token of ['this.playerHealth = PLAYER_COMBAT_CONFIG.maxHealth', 'this.kills = 0', 'this.currentWeapon = WEAPONS.m416', 'this.nextPlayerShotAt = 0', 'this.playerDead = false', 'this.physics.world.isPaused = false']) {
    assert.ok(scene.includes(token), `Falta reinicio de estado: ${token}`);
  }
});
