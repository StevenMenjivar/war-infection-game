import Phaser from 'phaser';
import { ENEMY_CONFIG } from '../config/CombatConfig';
import { getEnemyTierPressure, type EnemyDifficultyProfile, type PlayerTier } from '../config/ProgressionConfig';

export type EnemyState = 'Idle' | 'Patrolling' | 'Moving' | 'Searching' | 'Aiming' | 'Shooting' | 'Hit' | 'Dying';

export class Enemy extends Phaser.Physics.Arcade.Image {
  public health: number;
  public maxHealth: number;
  public state: EnemyState = 'Idle';
  public hasLineOfSight = false;
  public nextLineOfSightCheck = 0;

  get detectionRange(): number { return this.difficulty.detectionRange; }
  get projectileDamage(): number { return this.difficulty.projectileDamage; }
  get projectileSpeed(): number { return this.difficulty.projectileSpeed; }
  get projectileRange(): number { return this.difficulty.projectileRange; }
  public patrolArea: Phaser.Geom.Rectangle;
  private readonly healthBar: Phaser.GameObjects.Graphics;
  private difficulty: EnemyDifficultyProfile;
  private patrolTarget = new Phaser.Math.Vector2();
  private nextPatrolDecision = 0;
  private idleUntil = 0;
  private nextSearchDecision = 0;
  private searchTarget = new Phaser.Math.Vector2();
  private nextShotAt = 0;
  private aimStartedAt = 0;
  private shootingUntil = 0;
  private hitUntil = 0;
  private dead = false;
  private pursuitSpeedMultiplier = 1;
  private fireRateMultiplier = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    patrolArea: Phaser.Geom.Rectangle,
    seedOffset: number,
    difficulty: EnemyDifficultyProfile,
  ) {
    super(scene, x, y, 'zombie_soldier_1');
    this.patrolArea = patrolArea;
    this.difficulty = difficulty;
    this.maxHealth = Math.round(ENEMY_CONFIG.maxHealth * difficulty.healthMultiplier);
    this.health = this.maxHealth;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(ENEMY_CONFIG.displayWidth, ENEMY_CONFIG.displayHeight).setDepth(10);
    this.setCollideWorldBounds(true).setDrag(0, 0).setMaxVelocity(difficulty.moveSpeed);
    this.body?.setSize(130, 130, true);
    this.healthBar = scene.add.graphics().setDepth(13);
    this.resetForWave(x, y, patrolArea, seedOffset, difficulty);
  }

  /** Reutiliza una entidad ya creada para otra oleada, evitando asignaciones continuas. */
  resetForWave(
    x: number,
    y: number,
    patrolArea: Phaser.Geom.Rectangle,
    seedOffset: number,
    difficulty: EnemyDifficultyProfile,
  ): void {
    this.difficulty = difficulty;
    this.patrolArea.setTo(patrolArea.x, patrolArea.y, patrolArea.width, patrolArea.height);
    this.maxHealth = Math.round(ENEMY_CONFIG.maxHealth * difficulty.healthMultiplier);
    this.health = this.maxHealth;
    this.state = 'Idle';
    this.hasLineOfSight = false;
    this.nextLineOfSightCheck = 0;
    this.nextPatrolDecision = 0;
    this.idleUntil = 0;
    this.nextSearchDecision = 0;
    this.aimStartedAt = 0;
    this.shootingUntil = 0;
    this.hitUntil = 0;
    this.dead = false;
    this.pursuitSpeedMultiplier = 1;
    this.fireRateMultiplier = 1;
    this.nextShotAt = this.scene.time.now + 700 + (seedOffset % 900);
    this.setPosition(x, y).setActive(true).setVisible(true).setAlpha(1).clearTint();
    this.setDisplaySize(ENEMY_CONFIG.displayWidth, ENEMY_CONFIG.displayHeight);
    this.setRotation(0).setVelocity(0, 0);
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.enable = true;
      body.reset(x, y);
      body.setSize(130, 130, true);
      body.setCollideWorldBounds(true);
      body.setMaxVelocity(difficulty.moveSpeed);
    }
    this.healthBar.clear().setVisible(true);
    this.choosePatrolTarget();
  }

  /** Ajusta persecución y cadencia cuando el operador desbloquea un personaje superior. */
  setPlayerTierPressure(tier: PlayerTier): void {
    const pressure = getEnemyTierPressure(tier);
    this.pursuitSpeedMultiplier = pressure.pursuitSpeedMultiplier;
    this.fireRateMultiplier = pressure.fireRateMultiplier;
    (this.body as Phaser.Physics.Arcade.Body | null)?.setMaxVelocity(
      this.difficulty.moveSpeed * this.pursuitSpeedMultiplier,
    );
    const adjustedFireRate = Math.max(520, Math.round(this.difficulty.fireRateMs * this.fireRateMultiplier));
    this.nextShotAt = Math.min(this.nextShotAt, this.scene.time.now + adjustedFireRate);
  }

  shouldRefreshLineOfSight(now: number): boolean {
    if (now < this.nextLineOfSightCheck) return false;
    this.nextLineOfSightCheck = now + ENEMY_CONFIG.lineOfSightRefreshMs;
    return true;
  }

  updateAI(
    playerX: number,
    playerY: number,
    now: number,
    shoot: (enemy: Enemy, angle: number) => void,
  ): void {
    if (!this.active || this.dead) return;
    this.updateHealthBar();

    if (now < this.hitUntil) {
      this.state = 'Hit';
      return;
    }

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    this.setRotation(angle + Math.PI / 2);

    if (distance > this.difficulty.detectionRange) {
      this.updatePatrol(now);
      return;
    }

    if (!this.hasLineOfSight) {
      this.state = 'Searching';
      this.aimStartedAt = 0;
      if (now >= this.nextSearchDecision) {
        this.searchTarget.set(
          playerX + Phaser.Math.Between(-115, 115),
          playerY + Phaser.Math.Between(-115, 115),
        );
        this.nextSearchDecision = now + 1300;
      }
      this.moveTowards(this.searchTarget.x, this.searchTarget.y,
        this.difficulty.moveSpeed * 0.9 * this.pursuitSpeedMultiplier);
      return;
    }

    if (distance > this.difficulty.preferredDistance + 55) {
      this.state = 'Moving';
      this.aimStartedAt = 0;
      this.moveTowards(playerX, playerY, this.difficulty.moveSpeed * this.pursuitSpeedMultiplier);
    } else if (distance < this.difficulty.minimumDistance) {
      this.state = 'Moving';
      this.aimStartedAt = 0;
      this.moveAwayFrom(playerX, playerY);
    } else {
      this.setVelocity(0, 0);
      if (distance <= this.difficulty.weaponRange) {
        if (now < this.shootingUntil) {
          this.state = 'Shooting';
        } else {
          this.state = 'Aiming';
          if (this.aimStartedAt === 0) this.aimStartedAt = now;
          if (now >= this.nextShotAt && now - this.aimStartedAt >= this.difficulty.aimTimeMs) {
            this.state = 'Shooting';
            this.shootingUntil = now + 120;
            const adjustedFireRate = Math.max(520, Math.round(this.difficulty.fireRateMs * this.fireRateMultiplier));
            this.nextShotAt = now + adjustedFireRate;
            this.aimStartedAt = 0;
            shoot(this, angle + Phaser.Math.FloatBetween(-this.difficulty.aimSpreadRadians, this.difficulty.aimSpreadRadians));
          }
        }
      } else {
        this.state = 'Moving';
      }
    }
  }

  /** Desactiva la entidad para devolverla al pool sin destruir su sprite ni barra. */
  deactivateForPool(): void {
    this.setVelocity(0, 0).setActive(false).setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (body) body.enable = false;
    this.healthBar.setVisible(false);
    this.dead = true;
    this.state = 'Dying';
  }

  takeDamage(amount: number, now: number): boolean {
    if (this.dead || !this.active) return false;
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
    this.hitUntil = now + ENEMY_CONFIG.hitRecoveryMs;
    this.state = 'Hit';
    this.setVelocity(0, 0);
    this.setTintFill(0xd94b4b);
    this.scene.time.delayedCall(95, () => {
      if (this.active && !this.dead) this.clearTint();
    });
    if (this.health <= 0) {
      this.dead = true;
      this.state = 'Dying';
      this.setVelocity(0, 0);
      this.body && (this.body.enable = false);
      this.healthBar.setVisible(false);
      return true;
    }
    return false;
  }

  destroy(fromScene?: boolean): void {
    this.healthBar.destroy();
    super.destroy(fromScene);
  }

  private updatePatrol(now: number): void {
    this.aimStartedAt = 0;
    if (now < this.idleUntil) {
      this.state = 'Idle';
      this.setVelocity(0, 0);
      return;
    }
    if (now >= this.nextPatrolDecision || Phaser.Math.Distance.Between(
      this.x, this.y, this.patrolTarget.x, this.patrolTarget.y,
    ) < 22) {
      if (this.nextPatrolDecision !== 0 && now >= this.nextPatrolDecision) {
        this.idleUntil = now + Phaser.Math.Between(550, 1400);
        this.state = 'Idle';
        this.setVelocity(0, 0);
      }
      this.choosePatrolTarget();
      this.nextPatrolDecision = now + Phaser.Math.Between(1700, 3300);
      return;
    }
    this.state = 'Patrolling';
    this.moveTowards(this.patrolTarget.x, this.patrolTarget.y, this.difficulty.patrolSpeed);
  }

  private choosePatrolTarget(): void {
    const margin = 74;
    const minX = this.patrolArea.left + margin;
    const maxX = this.patrolArea.right - margin;
    const minY = this.patrolArea.top + margin;
    const maxY = this.patrolArea.bottom - margin;
    this.patrolTarget.set(
      Phaser.Math.Between(Math.ceil(minX), Math.floor(Math.max(minX, maxX))),
      Phaser.Math.Between(Math.ceil(minY), Math.floor(Math.max(minY, maxY))),
    );
  }

  private moveTowards(x: number, y: number, speed: number): void {
    const direction = new Phaser.Math.Vector2(x - this.x, y - this.y);
    if (direction.lengthSq() < 1) { this.setVelocity(0, 0); return; }
    direction.normalize().scale(speed);
    this.setVelocity(direction.x, direction.y);
  }

  private moveAwayFrom(x: number, y: number): void {
    const direction = new Phaser.Math.Vector2(this.x - x, this.y - y);
    if (direction.lengthSq() < 1) direction.set(1, 0);
    direction.normalize().scale(this.difficulty.moveSpeed * 0.78 * this.pursuitSpeedMultiplier);
    this.setVelocity(direction.x, direction.y);
  }

  private updateHealthBar(): void {
    const width = 38;
    const ratio = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
    const color = ratio > 0.5 ? 0x64c76b : ratio > 0.25 ? 0xe2c64f : 0xd84b4b;
    const x = this.x - width / 2;
    const y = this.y - 61;
    this.healthBar.clear();
    this.healthBar.fillStyle(0x111611, 0.92).fillRect(x - 1, y - 1, width + 2, 6);
    if (ratio > 0) this.healthBar.fillStyle(color, 1).fillRect(x, y, width * ratio, 4);
  }
}
