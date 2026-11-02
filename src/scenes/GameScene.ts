import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import {
  COMBAT_CONFIG, ENEMY_CONFIG, PLAYER_COMBAT_CONFIG, WEAPONS,
  type WeaponConfig,
} from '../config/CombatConfig';
import { Enemy } from '../entities/Enemy';
import { ProceduralMapGenerator, type ProceduralMap, type GridPoint } from '../systems/ProceduralMapGenerator';
import { segmentIntersectsRectangle, segmentRectangleEntryT } from '../systems/Geometry';

const PLAYER_SPEED = 230;
const PLAYER_DISPLAY_WIDTH = 70;
const PLAYER_DISPLAY_HEIGHT = 112;
const PLAYER_ART_FORWARD_OFFSET = Math.PI / 2; // El cañón del sprite original apunta hacia arriba.
const WALL_THICKNESS = 16;
const PLAYER_BULLET_TEXTURE = 'player_projectile';
const ENEMY_BULLET_TEXTURE = 'enemy_projectile';

/** Combate inicial: las mejoras persistentes y los botiquines corresponden a la Fase 6. */
export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private cursors!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private pauseLabel?: Phaser.GameObjects.Text;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private playerProjectiles!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private map!: ProceduralMap;
  private worldWidth = 0;
  private worldHeight = 0;
  private pointerWorld = new Phaser.Math.Vector2();
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private aimLaser!: Phaser.GameObjects.Graphics;
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private weaponIcon!: Phaser.GameObjects.Image;
  private killText!: Phaser.GameObjects.Text;
  private playerHealth = PLAYER_COMBAT_CONFIG.maxHealth;
  private kills = 0;
  private currentWeapon: WeaponConfig = WEAPONS.m416;
  private nextPlayerShotAt = 0;
  private playerDead = false;

  constructor() { super('GameScene'); }

  create(): void {
    // Phaser reutiliza la instancia de la escena al reiniciar desde Game Over.
    this.playerHealth = PLAYER_COMBAT_CONFIG.maxHealth;
    this.kills = 0;
    this.currentWeapon = WEAPONS.m416;
    this.nextPlayerShotAt = 0;
    this.playerDead = false;
    this.physics.world.isPaused = false;

    this.cameras.main.setBackgroundColor('#080d0a');
    this.map = new ProceduralMapGenerator().generate(COMBAT_CONFIG.initialSeed);
    if (!ProceduralMapGenerator.hasPath(this.map)) throw new Error('El mapa generado no tiene ruta entre inicio y salida.');
    this.worldWidth = this.map.columns * this.map.cellSize;
    this.worldHeight = this.map.rows * this.map.cellSize;
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    this.walls = this.physics.add.staticGroup();
    this.obstacles = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.playerProjectiles = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      defaultKey: PLAYER_BULLET_TEXTURE,
      maxSize: COMBAT_CONFIG.maxPlayerProjectiles,
      runChildUpdate: false,
    });
    this.enemyProjectiles = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      defaultKey: ENEMY_BULLET_TEXTURE,
      maxSize: COMBAT_CONFIG.maxEnemyProjectiles,
      runChildUpdate: false,
    });

    this.createProjectileTextures();
    this.renderFloor();
    this.createWalls();
    this.createCover();
    this.createPlayer();
    this.createHud();
    this.spawnEnemies();
    this.configureCollisions();

    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.05);

    const keyboard = this.input.keyboard!;
    this.cursors = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    keyboard.on('keydown-ESC', this.togglePause, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard.off('keydown-ESC', this.togglePause, this));
  }

  update(_time: number, _delta: number): void {
    if (this.physics.world.isPaused || this.playerDead) return;
    const now = this.time.now;
    const dx = Number(this.cursors.D.isDown) - Number(this.cursors.A.isDown);
    const dy = Number(this.cursors.S.isDown) - Number(this.cursors.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy);
    if (direction.lengthSq() > 0) direction.normalize().scale(PLAYER_SPEED);

    // Velocidad directa: conserva la respuesta inmediata validada en Fase 4.
    this.player.setVelocity(direction.x, direction.y);

    const pointer = this.input.activePointer;
    this.cameras.main.getWorldPoint(pointer.x, pointer.y, this.pointerWorld);
    const targetAngle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y, this.pointerWorld.x, this.pointerWorld.y,
    );
    this.player.setRotation(targetAngle + PLAYER_ART_FORWARD_OFFSET);
    this.playerShadow.setPosition(this.player.x, this.player.y + 30);
    this.updateAimLaser(targetAngle);

    this.updateEnemies(now);
    this.applyEnemySeparation();
    if (pointer.leftButtonDown()) this.tryPlayerShoot(now, targetAngle);
    this.updateProjectileRanges();
  }

  private createProjectileTextures(): void {
    if (this.textures.exists(PLAYER_BULLET_TEXTURE) && this.textures.exists(ENEMY_BULLET_TEXTURE)) return;
    if (!this.textures.exists(PLAYER_BULLET_TEXTURE)) {
      const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      playerGraphics.fillStyle(0xffffff, 1).fillRoundedRect(0, 1, 14, 5, 2);
      playerGraphics.generateTexture(PLAYER_BULLET_TEXTURE, 14, 7);
      playerGraphics.destroy();
    }
    if (!this.textures.exists(ENEMY_BULLET_TEXTURE)) {
      const enemyGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      enemyGraphics.fillStyle(0xffffff, 1).fillRoundedRect(0, 1, 12, 5, 2);
      enemyGraphics.generateTexture(ENEMY_BULLET_TEXTURE, 12, 7);
      enemyGraphics.destroy();
    }
  }

  private renderFloor(): void {
    const size = this.map.cellSize;
    for (const cell of this.map.floor) {
      const [x, y] = cell.split(',').map(Number);
      this.add.image((x + 0.5) * size, (y + 0.5) * size, 'floor_tile')
        .setDisplaySize(size, size).setTint(0x879087).setDepth(0);
    }
    const shade = this.add.graphics().setDepth(1);
    shade.fillStyle(0x07100b, 0.28);
    for (const room of this.map.rooms) {
      shade.fillRect(room.x * size, room.y * size, room.width * size, room.height * size);
    }
    const exit = this.map.exit;
    this.add.rectangle((exit.x + 0.5) * size, (exit.y + 0.5) * size, 100, 100, 0x304b35, 0.65)
      .setStrokeStyle(3, 0xa3c77c).setDepth(2);
    this.add.text((exit.x + 0.5) * size, (exit.y + 0.5) * size, 'ZONA DE\nEXTRACCIÓN', {
      fontFamily: 'monospace', fontSize: '12px', color: '#d4e8c6', align: 'center',
    }).setOrigin(0.5).setDepth(3);
  }

  private createWalls(): void {
    const size = this.map.cellSize;
    const directions = [
      { x: 0, y: -1, edge: 'top' }, { x: 0, y: 1, edge: 'bottom' },
      { x: -1, y: 0, edge: 'left' }, { x: 1, y: 0, edge: 'right' },
    ] as const;
    const graphics = this.add.graphics().setDepth(4);
    graphics.fillStyle(0x39443d, 1);
    graphics.lineStyle(2, 0x657064, 0.9);
    for (const cell of this.map.floor) {
      const [x, y] = cell.split(',').map(Number);
      for (const direction of directions) {
        if (this.map.floor.has(`${x + direction.x},${y + direction.y}`)) continue;
        let wallX = (x + 0.5) * size;
        let wallY = (y + 0.5) * size;
        let width = size + 2;
        let height = WALL_THICKNESS;
        if (direction.edge === 'top') wallY -= size / 2;
        if (direction.edge === 'bottom') wallY += size / 2;
        if (direction.edge === 'left') { wallX -= size / 2; width = WALL_THICKNESS; height = size + 2; }
        if (direction.edge === 'right') { wallX += size / 2; width = WALL_THICKNESS; height = size + 2; }
        graphics.fillRect(wallX - width / 2, wallY - height / 2, width, height);
        graphics.strokeRect(wallX - width / 2, wallY - height / 2, width, height);
        this.walls.add(this.add.rectangle(wallX, wallY, width, height, 0x39443d, 1).setDepth(5));
      }
    }
  }

  private createCover(): void {
    const size = this.map.cellSize;
    const placements: GridPoint[] = [];
    this.map.rooms.slice(1, 8).forEach((room, index) => {
      if (index % 2 === 0) placements.push({ x: room.x + room.width - 3, y: room.y + 3 });
      else placements.push({ x: room.x + 3, y: room.y + room.height - 3 });
    });
    placements.forEach((point, index) => {
      const x = (point.x + 0.5) * size;
      const y = (point.y + 0.5) * size;
      const horizontal = index % 2 === 0;
      const width = horizontal ? 72 : 30;
      const height = horizontal ? 30 : 72;
      this.obstacles.add(this.add.rectangle(x, y, width, height, 0x4b5148, 1)
        .setStrokeStyle(2, 0x899080).setDepth(6));
    });
  }

  private createPlayer(): void {
    const size = this.map.cellSize;
    const startX = (this.map.start.x + 0.5) * size;
    const startY = (this.map.start.y + 0.5) * size;
    this.player = this.physics.add.image(startX, startY, 'soldier_1')
      .setDisplaySize(PLAYER_DISPLAY_WIDTH, PLAYER_DISPLAY_HEIGHT).setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(0, 0).setDamping(false).setMaxVelocity(PLAYER_SPEED);
    this.player.body?.setSize(30, 30);

    this.playerShadow = this.add.ellipse(startX, startY + 30, 42, 13, 0x000000, 0.48).setDepth(8);
    this.aimLaser = this.add.graphics().setDepth(11);
    this.tweens.add({ targets: this.playerShadow, scaleX: 1.12, scaleY: 0.88, alpha: 0.34, duration: 1350, yoyo: true, repeat: -1 });
  }

  private createHud(): void {
    const name = String(this.registry.get('playerName') ?? 'Soldado');
    this.add.text(24, 20, `OPERADOR: ${name.toUpperCase()}\nWASD · MOUSE APUNTA · CLIC SOSTENIDO DISPARA`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#d7e4d7', lineSpacing: 6,
      backgroundColor: '#0a100ddd', padding: { x: 12, y: 9 },
    }).setScrollFactor(0).setDepth(20);
    this.add.text(GAME_WIDTH - 24, 20, `FASE 5  //  COMBATE\nSEED: ${this.map.seed}`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#b5d58a', align: 'right',
      backgroundColor: '#0a100ddd', padding: { x: 12, y: 9 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);

    this.weaponText = this.add.text(24, GAME_HEIGHT - 78, `${this.currentWeapon.displayName}  //  MUNICIÓN ∞`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#f1d78a',
      backgroundColor: '#0a100ddd', padding: { x: 10, y: 6 },
    }).setScrollFactor(0).setDepth(20);
    this.weaponIcon = this.add.image(300, GAME_HEIGHT - 61, 'm416')
      .setDisplaySize(25, 40).setScrollFactor(0).setDepth(20);
    this.healthText = this.add.text(24, GAME_HEIGHT - 39, `HEALTH  ${this.playerHealth}/${PLAYER_COMBAT_CONFIG.maxHealth}`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#e5eee4',
    }).setScrollFactor(0).setDepth(20);
    this.healthBar = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.killText = this.add.text(GAME_WIDTH - 24, GAME_HEIGHT - 34, 'HOSTILES ELIMINADOS: 0', {
      fontFamily: 'monospace', fontSize: '12px', color: '#e5eee4', align: 'right',
      backgroundColor: '#0a100ddd', padding: { x: 10, y: 7 },
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(20);
    this.pauseLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PAUSA\n\nESC PARA CONTINUAR', {
      fontFamily: 'monospace', fontSize: '25px', color: '#e8eee8', align: 'center',
      backgroundColor: '#080d0bee', padding: { x: 35, y: 25 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setVisible(false);
    this.updateHealthHud();
  }

  private spawnEnemies(): void {
    const size = this.map.cellSize;
    let index = 0;
    this.map.rooms.slice(1, 8).forEach((room) => {
      const centerX = (room.center.x + 0.5) * size;
      const centerY = (room.center.y + 0.5) * size;
      const area = new Phaser.Geom.Rectangle(
        room.x * size, room.y * size, room.width * size, room.height * size,
      );
      const offsets = Array.from({ length: ENEMY_CONFIG.initialCountPerRoom }, (_, enemyIndex) => [
        (enemyIndex - (ENEMY_CONFIG.initialCountPerRoom - 1) / 2) * 96, 0,
      ]);
      offsets.forEach(([offsetX, offsetY]) => {
        const enemy = new Enemy(this, centerX + offsetX!, centerY + offsetY!, area, index * 137);
        this.enemies.add(enemy);
        index++;
      });
    });
  }

  private configureCollisions(): void {
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.enemies, this.obstacles);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(this.player, this.enemies);

    this.physics.add.collider(this.playerProjectiles, this.walls, this.onProjectileBlocked, undefined, this);
    this.physics.add.collider(this.playerProjectiles, this.obstacles, this.onProjectileBlocked, undefined, this);
    this.physics.add.overlap(this.playerProjectiles, this.enemies, this.onPlayerProjectileHit, undefined, this);
    this.physics.add.collider(this.enemyProjectiles, this.walls, this.onProjectileBlocked, undefined, this);
    this.physics.add.collider(this.enemyProjectiles, this.obstacles, this.onProjectileBlocked, undefined, this);
    this.physics.add.overlap(this.enemyProjectiles, this.player, this.onEnemyProjectileHit, undefined, this);
  }

  private updateEnemies(now: number): void {
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as Enemy;
      if (!enemy.active || enemy.state === 'Dying') return;
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      if (distance <= ENEMY_CONFIG.detectionRange && enemy.shouldRefreshLineOfSight(now)) {
        enemy.hasLineOfSight = this.hasLineOfSight(enemy.x, enemy.y, this.player.x, this.player.y);
      }
      enemy.updateAI(this.player.x, this.player.y, now, (source, angle) => this.fireEnemyWeapon(source, angle));
    });
  }

  private applyEnemySeparation(): void {
    const living = this.enemies.getChildren().filter((item) => item.active && (item as Enemy).state !== 'Dying') as Enemy[];
    for (let i = 0; i < living.length; i++) {
      for (let j = i + 1; j < living.length; j++) {
        const a = living[i]!;
        const b = living[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        if (distance === 0 || distance >= ENEMY_CONFIG.separationDistance) continue;
        const strength = (ENEMY_CONFIG.separationDistance - distance) / ENEMY_CONFIG.separationDistance;
        const pushX = (dx / distance) * strength * ENEMY_CONFIG.separationStrength;
        const pushY = (dy / distance) * strength * ENEMY_CONFIG.separationStrength;
        const velocityA = (a.body as Phaser.Physics.Arcade.Body).velocity;
        const velocityB = (b.body as Phaser.Physics.Arcade.Body).velocity;
        a.setVelocity((velocityA?.x ?? 0) - pushX, (velocityA?.y ?? 0) - pushY);
        b.setVelocity((velocityB?.x ?? 0) + pushX, (velocityB?.y ?? 0) + pushY);
      }
    }
  }

  /** La mira es sólo una referencia visual; el daño lo resuelven los cuerpos de los proyectiles. */
  private updateAimLaser(aimAngle: number): void {
    const originX = this.player.x + Math.cos(aimAngle) * PLAYER_COMBAT_CONFIG.muzzleOffset;
    const originY = this.player.y + Math.sin(aimAngle) * PLAYER_COMBAT_CONFIG.muzzleOffset;
    const pointerDistance = Phaser.Math.Distance.Between(originX, originY, this.pointerWorld.x, this.pointerWorld.y);
    const length = Math.min(pointerDistance, this.currentWeapon.range);
    const targetX = originX + Math.cos(aimAngle) * length;
    const targetY = originY + Math.sin(aimAngle) * length;
    let nearestT = 1;
    const blockers = [...this.walls.getChildren(), ...this.obstacles.getChildren()];
    for (const object of blockers) {
      const t = segmentRectangleEntryT(originX, originY, targetX, targetY, object.getBounds());
      if (t !== null && t < nearestT) nearestT = t;
    }
    const endX = originX + (targetX - originX) * nearestT;
    const endY = originY + (targetY - originY) * nearestT;
    this.aimLaser.clear();
    this.aimLaser.lineStyle(1.5, 0xff3d3d, 0.55).beginPath();
    this.aimLaser.moveTo(originX, originY);
    this.aimLaser.lineTo(endX, endY);
    this.aimLaser.strokePath();
    this.aimLaser.fillStyle(0xff5555, 0.8).fillCircle(endX, endY, 2.5);
  }

  private tryPlayerShoot(now: number, aimAngle: number): void {
    if (now < this.nextPlayerShotAt) return;
    this.nextPlayerShotAt = now + this.currentWeapon.fireRateMs;
    const muzzleX = this.player.x + Math.cos(aimAngle) * PLAYER_COMBAT_CONFIG.muzzleOffset;
    const muzzleY = this.player.y + Math.sin(aimAngle) * PLAYER_COMBAT_CONFIG.muzzleOffset;
    this.showMuzzleFlash(muzzleX, muzzleY, this.currentWeapon.muzzleFlashColor, this.currentWeapon.id === 'minigun' ? 75 : 105);

    for (let pellet = 0; pellet < this.currentWeapon.pellets; pellet++) {
      const spread = Phaser.Math.FloatBetween(-this.currentWeapon.spreadRadians, this.currentWeapon.spreadRadians);
      this.spawnProjectile(
        this.playerProjectiles, muzzleX, muzzleY, aimAngle + spread,
        this.currentWeapon.projectileSpeed, this.currentWeapon.damage,
        this.currentWeapon.range, this.currentWeapon.projectileColor,
      );
    }
  }

  private fireEnemyWeapon(enemy: Enemy, angle: number): void {
    const muzzleX = enemy.x + Math.cos(angle) * ENEMY_CONFIG.muzzleOffset;
    const muzzleY = enemy.y + Math.sin(angle) * ENEMY_CONFIG.muzzleOffset;
    this.showMuzzleFlash(muzzleX, muzzleY, 0xff6c54, 80);
    this.spawnProjectile(
      this.enemyProjectiles, muzzleX, muzzleY, angle,
      ENEMY_CONFIG.projectileSpeed, ENEMY_CONFIG.projectileDamage,
      ENEMY_CONFIG.projectileRange, 0xff7058,
    );
  }

  private spawnProjectile(
    group: Phaser.Physics.Arcade.Group,
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    range: number,
    tint: number,
  ): void {
    const bullet = group.get(x, y) as Phaser.Physics.Arcade.Image | null;
    if (!bullet) return;
    bullet.enableBody(true, x, y, true, true);
    bullet.setActive(true).setVisible(true).setTint(tint).setDepth(12).setRotation(angle);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.reset(x, y);
    body.setCircle(COMBAT_CONFIG.projectileRadius);
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    bullet.setData('damage', damage);
    bullet.setData('remainingRange', range);
    bullet.setData('previousX', x);
    bullet.setData('previousY', y);
  }

  private showMuzzleFlash(x: number, y: number, color: number, life: number): void {
    const flash = this.add.circle(x, y, 7, color, 0.95).setDepth(15);
    this.tweens.add({
      targets: flash, scale: 0.15, alpha: 0, duration: life,
      onComplete: () => flash.destroy(),
    });
  }

  private onProjectileBlocked(projectileObject: Phaser.GameObjects.GameObject): void {
    this.deactivateProjectile(projectileObject as Phaser.Physics.Arcade.Image);
  }

  private onPlayerProjectileHit(
    projectileObject: Phaser.GameObjects.GameObject,
    enemyObject: Phaser.GameObjects.GameObject,
  ): void {
    const bullet = projectileObject as Phaser.Physics.Arcade.Image;
    const enemy = enemyObject as Enemy;
    if (!bullet.active || !enemy.active || enemy.state === 'Dying') return;
    const damage = Number(bullet.getData('damage') ?? 0);
    const impactX = bullet.x;
    const impactY = bullet.y;
    this.deactivateProjectile(bullet);
    this.createHitParticles(impactX, impactY);
    if (enemy.takeDamage(damage, this.time.now)) this.killEnemy(enemy);
  }

  private onEnemyProjectileHit(
    projectileObject: Phaser.GameObjects.GameObject,
    _playerObject: Phaser.GameObjects.GameObject,
  ): void {
    const bullet = projectileObject as Phaser.Physics.Arcade.Image;
    if (!bullet.active || this.playerDead) return;
    const damage = Number(bullet.getData('damage') ?? 0);
    const impactX = bullet.x;
    const impactY = bullet.y;
    this.deactivateProjectile(bullet);
    this.createHitParticles(impactX, impactY);
    this.damagePlayer(damage);
  }

  private deactivateProjectile(bullet: Phaser.Physics.Arcade.Image): void {
    if (!bullet.active) return;
    bullet.disableBody(true, true);
  }

  private updateProjectileRanges(): void {
    [this.playerProjectiles, this.enemyProjectiles].forEach((group) => {
      group.getChildren().forEach((object) => {
        const bullet = object as Phaser.Physics.Arcade.Image;
        if (!bullet.active) return;
        const previousX = Number(bullet.getData('previousX'));
        const previousY = Number(bullet.getData('previousY'));
        const travelled = Phaser.Math.Distance.Between(previousX, previousY, bullet.x, bullet.y);
        const remaining = Number(bullet.getData('remainingRange')) - travelled;
        bullet.setData('previousX', bullet.x);
        bullet.setData('previousY', bullet.y);
        bullet.setData('remainingRange', remaining);
        if (remaining <= 0 || bullet.x < 0 || bullet.y < 0 || bullet.x > this.worldWidth || bullet.y > this.worldHeight) {
          this.deactivateProjectile(bullet);
        }
      });
    });
  }

  private damagePlayer(damage: number): void {
    if (this.playerDead) return;
    this.playerHealth = Math.max(0, this.playerHealth - damage);
    this.player.setTintFill(0xe34d4d);
    this.time.delayedCall(110, () => {
      if (this.player.active && !this.playerDead) this.player.clearTint();
    });
    this.cameras.main.shake(75, 0.0018);
    this.createHitParticles(this.player.x, this.player.y);
    this.updateHealthHud();
    if (this.playerHealth <= 0) this.beginPlayerDeath();
  }

  private killEnemy(enemy: Enemy): void {
    if (!enemy.active || enemy.state !== 'Dying') return;
    this.kills++;
    this.killText.setText(`HOSTILES ELIMINADOS: ${this.kills}`);
    this.createBloodAt(enemy.x, enemy.y, 48);
    this.tweens.add({
      targets: enemy, alpha: 0, scaleX: 0.2, scaleY: 0.2,
      duration: COMBAT_CONFIG.deathFadeMs,
      onComplete: () => enemy.destroy(),
    });
  }

  private beginPlayerDeath(): void {
    if (this.playerDead) return;
    this.playerDead = true;
    this.player.setVelocity(0, 0);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.createBloodAt(this.player.x, this.player.y, 78);
    this.tweens.add({
      targets: this.player, alpha: 0, scaleX: 0.2, scaleY: 0.2,
      duration: 760,
      onComplete: () => this.showGameOver(),
    });
  }

  private createBloodAt(x: number, y: number, size: number): void {
    const blood = this.add.image(x, y, 'blood').setDisplaySize(size, size).setDepth(7).setAlpha(0);
    this.tweens.add({ targets: blood, alpha: 0.76, duration: 260, onComplete: () => {
      this.time.delayedCall(COMBAT_CONFIG.bloodFadeDelayMs, () => {
        if (!blood.active) return;
        this.tweens.add({ targets: blood, alpha: 0, duration: COMBAT_CONFIG.bloodFadeMs, onComplete: () => blood.destroy() });
      });
    } });
  }

  private createHitParticles(x: number, y: number): void {
    for (let index = 0; index < COMBAT_CONFIG.hitParticles; index++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(14, 42);
      const particle = this.add.circle(x, y, Phaser.Math.FloatBetween(2, 3.5), 0xd84040, 0.95).setDepth(16);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.25,
        duration: COMBAT_CONFIG.hitParticleLifeMs,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private updateHealthHud(): void {
    if (!this.healthBar || !this.healthText) return;
    const ratio = Phaser.Math.Clamp(this.playerHealth / PLAYER_COMBAT_CONFIG.maxHealth, 0, 1);
    const color = ratio > 0.5 ? 0x64c76b : ratio > 0.3 ? 0xe2c64f : 0xd84b4b;
    this.healthBar.clear();
    this.healthBar.fillStyle(0x101710, 0.95).fillRect(24, GAME_HEIGHT - 53, 190, 9);
    this.healthBar.fillStyle(color, 1).fillRect(25, GAME_HEIGHT - 52, 188 * ratio, 7);
    this.healthText.setText(`HEALTH  ${this.playerHealth}/${PLAYER_COMBAT_CONFIG.maxHealth}`);
    this.weaponText.setText(`${this.currentWeapon.displayName}  ·  DAÑO ${this.currentWeapon.damageMultiplier}x  ·  MUNICIÓN ∞`);
    this.weaponIcon.setTexture(this.currentWeapon.id);
  }

  private showGameOver(): void {
    this.physics.world.isPaused = true;
    const backdrop = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x030605, 0.82)
      .setScrollFactor(0);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 62, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '46px', color: '#d95050', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0);
    const detail = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 3, `HOSTILES ELIMINADOS: ${this.kills}`, {
      fontFamily: 'monospace', fontSize: '15px', color: '#d8e0d8',
    }).setOrigin(0.5).setScrollFactor(0);
    const retry = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 75, '[ REINTENTAR ]', {
      fontFamily: 'monospace', fontSize: '20px', color: '#b7d98b', backgroundColor: '#152018', padding: { x: 20, y: 12 },
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    retry.on('pointerover', () => retry.setColor('#ffffff'));
    retry.on('pointerout', () => retry.setColor('#b7d98b'));
    retry.on('pointerdown', () => this.scene.restart());
    this.add.container(0, 0, [backdrop, title, detail, retry]).setDepth(40);
  }

  private hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    const blockers = [...this.walls.getChildren(), ...this.obstacles.getChildren()];
    for (const object of blockers) {
      const bounds = object.getBounds();
      if (segmentIntersectsRectangle(x1, y1, x2, y2, bounds)) return false;
    }
    return true;
  }

  private togglePause(): void {
    if (this.playerDead) return;
    const paused = !this.physics.world.isPaused;
    this.physics.world.isPaused = paused;
    this.pauseLabel?.setVisible(paused);
  }
}
