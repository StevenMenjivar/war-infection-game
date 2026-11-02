import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('la colisión de proyectil enemigo identifica al jugador sin asumir el orden de Phaser', () => {
  const scene = read('../src/scenes/GameScene.ts');
  const pair = read('../src/systems/CollisionPair.ts');
  const handler = scene.slice(scene.indexOf('private onEnemyProjectileHit('), scene.indexOf('private deactivateProjectile('));
  assert.match(pair, /if \(first === expected\) return second/);
  assert.match(pair, /if \(second === expected\) return first/);
  assert.match(handler, /getOtherCollisionObject\(first, second, this\.player\)/);
  assert.match(handler, /this\.enemyProjectiles\.contains\(projectileObject\)/);
  assert.doesNotMatch(handler, /disableBody\(true, true\)/);
  assert.match(handler, /this\.damagePlayer\(damage\)/);
});

test('el daño del jugador descuenta salud, actualiza HUD y conserva el sprite durante el impacto', () => {
  const scene = read('../src/scenes/GameScene.ts');
  const damage = scene.slice(scene.indexOf('private damagePlayer('), scene.indexOf('private killEnemy('));
  assert.match(damage, /this\.playerHealth = Math\.max\(0, this\.playerHealth - damage\)/);
  assert.match(damage, /this\.updateHealthHud\(\)/);
  assert.match(damage, /this\.player\.setTint\(/);
  assert.doesNotMatch(damage, /this\.player\.setVisible\(false\)|this\.player\.disableBody/);
  assert.match(damage, /playerInvulnerableUntil/);
  assert.match(scene, /this\.healthText\.setText\(`HEALTH  \$\{this\.playerHealth\}\/\$\{this\.playerMaxHealth\}`\)/);
});

test('los hitos de evolución están configurados exactamente en 11 y 27 bajas', () => {
  const config = read('../src/config/ProgressionConfig.ts');
  const progression = read('../src/systems/ProgressionSystem.ts');
  const scene = read('../src/scenes/GameScene.ts');
  assert.match(config, /killsRequired: 11/);
  assert.match(config, /killsRequired: 27/);
  assert.match(progression, /\{ kills: 11, tier: 2 \}/);
  assert.match(progression, /\{ kills: 27, tier: 3 \}/);
  assert.match(progression, /spawnedEvolutionTiers/);
  assert.match(scene, /this\.progression\.registerKill\(this\.kills\)/);
  assert.match(scene, /this\.progression\.collectEvolution\(tier\)/);
});

test('evolucionar cambia sprite y arma, aumenta el máximo sin restaurar la salud actual', () => {
  const config = read('../src/config/ProgressionConfig.ts');
  const scene = read('../src/scenes/GameScene.ts');
  assert.match(config, /maxHealth: 210/);
  assert.match(config, /maxHealth: 270/);
  const pickup = scene.slice(scene.indexOf('private onEvolutionPickup('), scene.indexOf('private onMedkitPickup('));
  assert.match(pickup, /this\.player\.setTexture\(config\.textureKey\)/);
  assert.match(pickup, /this\.currentWeapon = WEAPONS\[config\.weaponId\]/);
  assert.match(pickup, /this\.playerMaxHealth = config\.maxHealth/);
  assert.doesNotMatch(pickup, /this\.playerHealth\s*=\s*config\.maxHealth/);
});

test('los botiquines curan un porcentaje del máximo sin excederlo y permanecen si la salud está completa', () => {
  const config = read('../src/config/ProgressionConfig.ts');
  const scene = read('../src/scenes/GameScene.ts');
  assert.match(config, /healFractionOfMaxHealth: 0\.35/);
  const pickup = scene.slice(scene.indexOf('private onMedkitPickup('), scene.indexOf('private spawnEvolutionPickup('));
  assert.match(pickup, /Math\.min\(healing, this\.playerMaxHealth - this\.playerHealth\)/);
  assert.match(pickup, /if \(restored <= 0\) return/);
});

test('la evolución sigue siendo alcanzable con el escalado de campaña ampliado de Fase 10', () => {
  const scene = read('../src/scenes/GameScene.ts');
  const config = read('../src/config/CombatConfig.ts');
  assert.match(config, /initialEnemiesPerRoom: 4/);
  assert.match(config, /initialEnemyCount: 28/);
  assert.match(config, /reinforcementCount: 26/);
  assert.match(scene, /this\.kills === CAMPAIGN_CONFIG\.initialEnemyCount/);
  assert.match(scene, /spawned < CAMPAIGN_CONFIG\.reinforcementCount/);
  assert.match(scene, /REFUERZOS DETECTADOS/);
});

test('la dificultad aumenta por bandas de salas', () => {
  const config = read('../src/config/ProgressionConfig.ts');
  const enemy = read('../src/entities/Enemy.ts');
  assert.match(config, /roomIndex <= 1 \? 0 : roomIndex <= 4 \? 1 : 2/);
  assert.match(config, /healthMultiplier: 1\.15/);
  assert.match(config, /healthMultiplier: 1\.3/);
  assert.match(enemy, /this\.difficulty\.fireRateMs/);
  assert.match(enemy, /this\.difficulty\.aimSpreadRadians/);
});
