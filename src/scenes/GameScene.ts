import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import {
  CAMPAIGN_CONFIG, COMBAT_CONFIG, ENEMY_CONFIG, PLAYER_COMBAT_CONFIG, WEAPONS,
  type WeaponConfig,
} from '../config/CombatConfig';
import { MEDKIT_CONFIG, PLAYER_TIERS, getEnemyDifficultyForRoom, getEnemyDifficultyForWave, getEnemyTierPressure, type PlayerTier } from '../config/ProgressionConfig';
import { HORDE_CONFIG } from '../config/HordeConfig';
import { Enemy } from '../entities/Enemy';
import { ProceduralMapGenerator, type ProceduralMap, type GridPoint } from '../systems/ProceduralMapGenerator';
import { segmentIntersectsRectangle, segmentRectangleEntryT, type RectangleBounds } from '../systems/Geometry';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { getOtherCollisionObject } from '../systems/CollisionPair';
import { FlashlightSystem } from '../systems/FlashlightSystem';
import { CheckpointSystem } from '../systems/CheckpointSystem';
import { HordeWaveSystem, type HordeWaveState } from '../systems/HordeWaveSystem';

const PLAYER_SPEED = 230;
const PLAYER_DISPLAY_WIDTH = 70;
const PLAYER_DISPLAY_HEIGHT = 112;
const PLAYER_ART_FORWARD_OFFSET = Math.PI / 2; // El cañón del sprite original apunta hacia arriba.
const WALL_THICKNESS = 16;
const PLAYER_BULLET_TEXTURE = 'player_projectile';
const ENEMY_BULLET_TEXTURE = 'enemy_projectile';

/** Escena coordinadora: combate, progresión y colisiones de recogibles. */
export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private cursors!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private pauseObjects: Phaser.GameObjects.GameObject[] = [];
  private isGamePaused = false;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private enemyPool: Enemy[] = [];
  private playerProjectiles!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private evolutionPickups!: Phaser.Physics.Arcade.StaticGroup;
  private medkitPickups!: Phaser.Physics.Arcade.StaticGroup;
  private progression!: ProgressionSystem;
  private map!: ProceduralMap;
  private worldWidth = 0;
  private worldHeight = 0;
  private pointerWorld = new Phaser.Math.Vector2();
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private aimLaser!: Phaser.GameObjects.Graphics;
  private lighting!: FlashlightSystem;
  private lightingBlockers: RectangleBounds[] = [];
  private flashlightOn = false;
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private weaponIcon!: Phaser.GameObjects.Image;
  private killText!: Phaser.GameObjects.Text;
  private tierText!: Phaser.GameObjects.Text;
  private flashlightText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private checkpoint = new CheckpointSystem(HORDE_CONFIG.checkpointHealthFraction);
  private horde = new HordeWaveSystem();
  private hordeStarted = false;
  private hordeVictoryPending = false;
  private arenaEntryToastShown = false;
  private waveAdvanceEvent?: Phaser.Time.TimerEvent;
  private playerHealth = PLAYER_COMBAT_CONFIG.maxHealth;
  private playerMaxHealth = PLAYER_TIERS[1].maxHealth;
  private playerInvulnerableUntil = 0;
  private kills = 0;
  private currentWeapon: WeaponConfig = WEAPONS.m416;
  private nextPlayerShotAt = 0;
  private playerDead = false;
  private reinforcementsSpawned = false;

  constructor() { super('GameScene'); }

  create(): void {
    // Phaser reutiliza la instancia de la escena al reiniciar desde Game Over.
    this.playerHealth = PLAYER_TIERS[1].maxHealth;
    this.playerMaxHealth = PLAYER_TIERS[1].maxHealth;
    this.playerInvulnerableUntil = 0;
    this.progression = new ProgressionSystem();
    this.enemyPool = [];
    this.reinforcementsSpawned = false;
    this.horde.reset();
    this.checkpoint.clear();
    this.hordeStarted = false;
    this.hordeVictoryPending = false;
    this.arenaEntryToastShown = false;
    this.waveAdvanceEvent?.remove(false);
    this.waveAdvanceEvent = undefined;
    this.kills = 0;
    this.currentWeapon = WEAPONS.m416;
    this.nextPlayerShotAt = 0;
    this.playerDead = false;
    this.flashlightOn = false;
    this.physics.world.isPaused = false;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.isGamePaused = false;
    this.pauseObjects = [];

    this.cameras.main.setBackgroundColor('#080d0a');
    this.map = new ProceduralMapGenerator().generate(COMBAT_CONFIG.initialSeed);
    if (!ProceduralMapGenerator.hasPath(this.map)) throw new Error('El mapa generado no tiene ruta entre inicio y salida.');
    this.worldWidth = this.map.columns * this.map.cellSize;
    this.worldHeight = this.map.rows * this.map.cellSize;
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    this.walls = this.physics.add.staticGroup();
    this.obstacles = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group({ maxSize: HORDE_CONFIG.maxEnemyGroupSize });
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
    this.evolutionPickups = this.physics.add.staticGroup();
    this.medkitPickups = this.physics.add.staticGroup();

    this.createProjectileTextures();
    this.createPickupTextures();
    this.renderFloor();
    this.createWalls();
    this.createCover();
    this.createAmbientEffects();
    this.createMedkitPickups();
    this.createPlayer();
    this.createLighting();
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
    keyboard.on('keydown-L', this.toggleFlashlight, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown-ESC', this.togglePause, this);
      keyboard.off('keydown-L', this.toggleFlashlight, this);
      this.events.off('checkpoint-retry', this.restartHordeAtCheckpoint, this);
      this.waveAdvanceEvent?.remove(false);
      this.waveAdvanceEvent = undefined;
      this.time.removeAllEvents();
      this.tweens.killAll();
      this.clearPauseOverlay();
      this.enemyPool = [];
      this.physics.world.isPaused = false;
    });
    this.events.on('checkpoint-retry', this.restartHordeAtCheckpoint, this);
  }

  update(_time: number, _delta: number): void {
    if (this.isGamePaused || this.physics.world.isPaused || this.playerDead) return;
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
    this.lighting.update(this.player.x, this.player.y, targetAngle, now, this.lightingBlockers);

    this.updateEnemies(now);
    this.applyEnemySeparation();
    if (pointer.leftButtonDown()) this.tryPlayerShoot(now, targetAngle);
    this.updateProjectileRanges();
    this.checkArenaEntry();
  }

  private toggleFlashlight(): void {
    if (this.playerDead || this.physics.world.isPaused) return;
    this.flashlightOn = !this.flashlightOn;
    this.lighting.setEnabled(this.flashlightOn);
    this.flashlightText.setText(this.flashlightOn
      ? 'LINTERNA: ENCENDIDA · PRESIONA L PARA APAGAR'
      : 'LINTERNA: APAGADA · PRESIONA L PARA ENCENDER');
    this.flashlightText.setColor(this.flashlightOn ? '#d7e9ad' : '#a9b39f');
    this.showToast(this.flashlightOn ? 'LINTERNA ACTIVADA' : 'LINTERNA DESACTIVADA');
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

  private createPickupTextures(): void {
    if (!this.textures.exists('medkit_pickup')) {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0x15291b, 1).fillRoundedRect(1, 1, 34, 34, 6);
      graphics.lineStyle(2, 0xb5d98b, 1).strokeRoundedRect(1, 1, 34, 34, 6);
      graphics.fillStyle(0xe7f0df, 1).fillRect(14, 7, 8, 22).fillRect(7, 14, 22, 8);
      graphics.generateTexture('medkit_pickup', 36, 36);
      graphics.destroy();
    }
  }

  private createMedkitPickups(): void {
    const roomIndexes = [0, 2, 4, 6, 8].slice(0, MEDKIT_CONFIG.initialCount);
    roomIndexes.forEach((roomIndex) => {
      const room = this.map.rooms[roomIndex];
      if (!room) return;
      const offsets = [
        { x: 2.25, y: 2.25 }, { x: room.width - 2.25, y: 2.25 },
        { x: 2.25, y: room.height - 2.25 }, { x: room.width - 2.25, y: room.height - 2.25 },
      ];
      const blockers = [...this.walls.getChildren(), ...this.obstacles.getChildren()];
      const offset = offsets.find((candidate) => {
        const candidateX = (room.x + candidate.x) * this.map.cellSize;
        const candidateY = (room.y + candidate.y) * this.map.cellSize;
        return !blockers.some((object) => object.getBounds().contains(candidateX, candidateY));
      }) ?? { x: room.width / 2, y: room.height / 2 };
      const x = (room.x + offset.x) * this.map.cellSize;
      const y = (room.y + offset.y) * this.map.cellSize;
      const pickup = this.medkitPickups.create(x, y, 'medkit_pickup') as Phaser.Physics.Arcade.Image;
      pickup.setDisplaySize(MEDKIT_CONFIG.pickupDisplaySize, MEDKIT_CONFIG.pickupDisplaySize).setDepth(8);
      pickup.refreshBody();
      const aura = this.add.circle(x, y, 24, 0x8fc77a, 0.13).setDepth(7);
      pickup.setData('aura', aura);
      this.tweens.add({ targets: aura, alpha: 0.3, scale: 1.2, duration: 900, yoyo: true, repeat: -1 });
    });
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
    this.add.text((exit.x + 0.5) * size, (exit.y + 0.5) * size, 'ARENA DE\nRESCATE', {
      fontFamily: 'monospace', fontSize: '12px', color: '#d4e8c6', align: 'center',
    }).setOrigin(0.5).setDepth(3);
  }

  private createWalls(): void {
    const size = this.map.cellSize;
    const directions = [
      { x: 0, y: -1, edge: 'top' }, { x: 0, y: 1, edge: 'bottom' },
      { x: -1, y: 0, edge: 'left' }, { x: 1, y: 0, edge: 'right' },
    ] as const;
    const shadowGraphics = this.add.graphics().setDepth(3.5);
    shadowGraphics.fillStyle(0x000000, 0.26);
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
        shadowGraphics.fillRect(wallX - width / 2 + 7, wallY - height / 2 + 9, width, height);
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
      this.add.rectangle(x + 8, y + 9, width, height, 0x000000, 0.28).setDepth(5.5);
      this.obstacles.add(this.add.rectangle(x, y, width, height, 0x4b5148, 1)
        .setStrokeStyle(2, 0x899080).setDepth(6));
    });

    // El área de extracción queda despejada: no se colocan barricadas ni obstáculos físicos aquí.
    const arena = this.map.rooms[HORDE_CONFIG.arenaRoomIndex]!;
    const centerX = (arena.x + arena.width / 2) * size;
    const centerY = (arena.y + arena.height / 2) * size;
    this.add.circle(centerX, centerY, 24, 0x9e342d, 0.2).setStrokeStyle(2, 0xd57f5f, 0.55).setDepth(3);
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

  private createLighting(): void {
    const blockers = [...this.walls.getChildren(), ...this.obstacles.getChildren()];
    this.lightingBlockers = blockers.map((object) => {
      const bounds = object.getBounds();
      return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom };
    });
    this.lighting = new FlashlightSystem(this, this.worldWidth, this.worldHeight);
    this.lighting.setEnabled(false);
  }

  /** Niebla ligera y motas de polvo para dar profundidad sin ocultar el combate. */
  private createAmbientEffects(): void {
    const fogRooms = [1, 3, 5, 7];
    fogRooms.forEach((roomIndex, index) => {
      const room = this.map.rooms[roomIndex];
      if (!room) return;
      const x = (room.center.x + 0.5) * this.map.cellSize;
      const y = (room.center.y + 0.5) * this.map.cellSize;
      const fog = this.add.ellipse(x, y, room.width * 31, room.height * 23, 0x9eaa94, 0.035)
        .setDepth(2.5).setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({
        targets: fog, x: x + (index % 2 === 0 ? 24 : -24), alpha: 0.055,
        duration: 7200 + index * 650, yoyo: true, repeat: -1,
      });
    });

    for (let index = 0; index < 18; index++) {
      const room = this.map.rooms[(index * 3 + 1) % this.map.rooms.length]!;
      const x = Phaser.Math.Between(
        Math.floor((room.x + 1.5) * this.map.cellSize),
        Math.floor((room.x + room.width - 1.5) * this.map.cellSize),
      );
      const y = Phaser.Math.Between(
        Math.floor((room.y + 1.5) * this.map.cellSize),
        Math.floor((room.y + room.height - 1.5) * this.map.cellSize),
      );
      const mote = this.add.circle(x, y, Phaser.Math.FloatBetween(0.8, 1.6), 0xd6ddc9, 0.20).setDepth(9.1);
      this.tweens.add({
        targets: mote, x: x + Phaser.Math.Between(-28, 28), y: y - Phaser.Math.Between(20, 58),
        alpha: 0.025, duration: Phaser.Math.Between(2800, 5200), delay: index * 110,
        repeat: -1, onRepeat: () => {
          mote.setPosition(x + Phaser.Math.Between(-42, 42), y + Phaser.Math.Between(-36, 36)).setAlpha(0.20);
        },
      });
    }
  }

  private createHud(): void {
    const name = String(this.registry.get('playerName') ?? 'Soldado');
    this.add.text(24, 20, `OPERADOR: ${name.toUpperCase()}\nWASD · MOUSE APUNTA · CLIC SOSTENIDO DISPARA`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#d7e4d7', lineSpacing: 6,
      backgroundColor: '#0a100ddd', padding: { x: 12, y: 9 },
    }).setScrollFactor(0).setDepth(20);
    this.flashlightText = this.add.text(24, 101, 'LINTERNA: APAGADA · PRESIONA L', {
      fontFamily: 'monospace', fontSize: '11px', color: '#a9b39f',
      backgroundColor: '#0a100ddd', padding: { x: 10, y: 6 },
    }).setScrollFactor(0).setDepth(20);
    this.add.text(GAME_WIDTH - 24, 20, `FASE 9  //  HORDA FINAL\nSEED: ${this.map.seed}`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#b5d58a', align: 'right',
      backgroundColor: '#0a100ddd', padding: { x: 12, y: 9 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);

    this.waveText = this.add.text(GAME_WIDTH - 24, 76, 'ARENA FINAL: INACTIVA', {
      fontFamily: 'monospace', fontSize: '11px', color: '#d7c58d', align: 'right',
      backgroundColor: '#0a100ddd', padding: { x: 10, y: 6 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);
    this.weaponText = this.add.text(24, GAME_HEIGHT - 78, `${this.currentWeapon.displayName}  //  MUNICIÓN ∞`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#f1d78a',
      backgroundColor: '#0a100ddd', padding: { x: 10, y: 6 },
    }).setScrollFactor(0).setDepth(20);
    this.weaponIcon = this.add.image(300, GAME_HEIGHT - 61, 'm416')
      .setDisplaySize(25, 40).setScrollFactor(0).setDepth(20);
    this.tierText = this.add.text(24, 62, `${this.progression.getCurrentTier().displayName}  ·  NIVEL 1`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#f1d78a',
      backgroundColor: '#0a100ddd', padding: { x: 10, y: 6 },
    }).setScrollFactor(0).setDepth(20);
    this.healthText = this.add.text(24, GAME_HEIGHT - 39, `HEALTH  ${this.playerHealth}/${this.playerMaxHealth}`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#e5eee4',
    }).setScrollFactor(0).setDepth(20);
    this.healthBar = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.killText = this.add.text(GAME_WIDTH - 24, GAME_HEIGHT - 34, 'HOSTILES ELIMINADOS: 0', {
      fontFamily: 'monospace', fontSize: '12px', color: '#e5eee4', align: 'right',
      backgroundColor: '#0a100ddd', padding: { x: 10, y: 7 },
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(20);
    this.updateHealthHud();
  }

  private spawnEnemies(): void {
    this.map.rooms.slice(1, 8).forEach((room, combatRoomIndex) => {
      const area = new Phaser.Geom.Rectangle(
        room.x * this.map.cellSize, room.y * this.map.cellSize,
        room.width * this.map.cellSize, room.height * this.map.cellSize,
      );
      const centerX = (room.center.x + 0.5) * this.map.cellSize;
      const centerY = (room.center.y + 0.5) * this.map.cellSize;
      const difficulty = getEnemyDifficultyForRoom(combatRoomIndex);
      const count = ENEMY_CONFIG.initialCountPerRoom;
      for (let enemyIndex = 0; enemyIndex < count; enemyIndex++) {
        const offsetX = (enemyIndex - (count - 1) / 2) * 96;
        this.createEnemy(centerX + offsetX, centerY, area, combatRoomIndex, enemyIndex, difficulty);
      }
    });
  }

  private createEnemy(
    x: number,
    y: number,
    patrolArea: Phaser.Geom.Rectangle,
    roomIndex: number,
    seedOffset: number,
    difficulty = getEnemyDifficultyForRoom(roomIndex),
    isHordeEnemy = false,
  ): void {
    const pooled = this.enemyPool.pop();
    const enemy = pooled ?? new Enemy(this, x, y, patrolArea, roomIndex * 137 + seedOffset, difficulty);
    if (pooled) enemy.resetForWave(x, y, patrolArea, roomIndex * 137 + seedOffset, difficulty);
    else this.enemies.add(enemy);
    enemy.setData('isHordeEnemy', isHordeEnemy);
    enemy.setPlayerTierPressure(this.progression.getCurrentTierId());
  }

  private releaseEnemyToPool(enemy: Enemy): void {
    if (!enemy.active) return;
    this.tweens.killTweensOf(enemy);
    enemy.deactivateForPool();
    this.enemyPool.push(enemy);
  }

  /** Tras los 28 objetivos iniciales aparecen 26 refuerzos; la campaña suma 54 bajas. */
  private spawnReinforcements(): void {
    if (this.reinforcementsSpawned) return;
    this.reinforcementsSpawned = true;
    const rooms = this.map.rooms.slice(1, 8);
    let spawned = 0;
    rooms.forEach((room, roomIndex) => {
      const area = new Phaser.Geom.Rectangle(
        room.x * this.map.cellSize, room.y * this.map.cellSize,
        room.width * this.map.cellSize, room.height * this.map.cellSize,
      );
      const centerX = (room.center.x + 0.5) * this.map.cellSize;
      const centerY = (room.center.y + 0.5) * this.map.cellSize;
      const candidates = [
        { x: centerX - 105, y: centerY - 92 },
        { x: centerX + 105, y: centerY - 92 },
        { x: centerX - 105, y: centerY + 92 },
        { x: centerX + 105, y: centerY + 92 },
      ];
      for (const point of candidates) {
        if (spawned >= CAMPAIGN_CONFIG.reinforcementCount) break;
        const isBlocked = [...this.walls.getChildren(), ...this.obstacles.getChildren()]
          .some((object) => object.getBounds().contains(point.x, point.y));
        if (isBlocked) continue;
        this.createEnemy(point.x, point.y, area, roomIndex, 100 + spawned);
        spawned++;
      }
    });
    // El fallback mantiene los 26 refuerzos incluso si las coberturas ocupan algunos puntos.
    let roomIndex = 0;
    while (spawned < CAMPAIGN_CONFIG.reinforcementCount) {
      const room = rooms[roomIndex % rooms.length]!;
      const area = new Phaser.Geom.Rectangle(
        room.x * this.map.cellSize, room.y * this.map.cellSize,
        room.width * this.map.cellSize, room.height * this.map.cellSize,
      );
      const centerX = (room.center.x + 0.5) * this.map.cellSize;
      const centerY = (room.center.y + 0.5) * this.map.cellSize;
      this.createEnemy(centerX, centerY + 125 + Math.floor(roomIndex / rooms.length) * 42,
        area, roomIndex % rooms.length, 100 + spawned);
      spawned++;
      roomIndex++;
    }
    this.showToast(`REFUERZOS DETECTADOS · ${spawned} HOSTILES`);
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
    this.physics.add.overlap(this.player, this.evolutionPickups, this.onEvolutionPickup, undefined, this);
    this.physics.add.overlap(this.player, this.medkitPickups, this.onMedkitPickup, undefined, this);
  }

  private updateEnemies(now: number): void {
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as Enemy;
      if (!enemy.active || enemy.state === 'Dying') return;
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      if (distance <= enemy.detectionRange && enemy.shouldRefreshLineOfSight(now)) {
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
    return true;
  }

  private fireEnemyWeapon(enemy: Enemy, angle: number): void {
    const muzzleX = enemy.x + Math.cos(angle) * ENEMY_CONFIG.muzzleOffset;
    const muzzleY = enemy.y + Math.sin(angle) * ENEMY_CONFIG.muzzleOffset;
    this.showMuzzleFlash(muzzleX, muzzleY, 0xff6c54, 80);
    this.spawnProjectile(
      this.enemyProjectiles, muzzleX, muzzleY, angle,
      enemy.projectileSpeed, enemy.projectileDamage,
      enemy.projectileRange, 0xff7058,
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
    const flash = this.add.circle(x, y, 7, color, 0.95).setDepth(19.2);
    this.tweens.add({
      targets: flash, scale: 0.15, alpha: 0, duration: life,
      onComplete: () => flash.destroy(),
    });
  }

  private onEvolutionPickup(first: Phaser.GameObjects.GameObject, second: Phaser.GameObjects.GameObject): void {
    const pickup = getOtherCollisionObject(first, second, this.player);
    if (!pickup || !this.evolutionPickups.contains(pickup)) return;
    const tier = Number(pickup.getData('tier')) as PlayerTier;
    const config = this.progression.collectEvolution(tier);
    (pickup.getData('aura') as Phaser.GameObjects.GameObject | undefined)?.destroy();
    pickup.destroy();
    if (!config) {
      this.showToast('EQUIPO DE NIVEL INFERIOR · SIN CAMBIOS');
      return;
    }
    this.player.setTexture(config.textureKey).setDisplaySize(PLAYER_DISPLAY_WIDTH, PLAYER_DISPLAY_HEIGHT);
    this.player.body?.setSize(30, 30);
    this.currentWeapon = WEAPONS[config.weaponId];
    this.playerMaxHealth = config.maxHealth;
    // La salud actual permanece exactamente igual: solo crece la capacidad máxima.
    this.applyEnemyTierPressure(tier);
    this.refreshCheckpointProgress();
    this.updateHealthHud();
    const pressure = getEnemyTierPressure(tier);
    this.showToast(`${config.displayName} · HOSTILES +${pressure.pursuitIncreasePercent}% PERSECUCIÓN · +${pressure.fireFrequencyIncreasePercent}% FRECUENCIA DE FUEGO`);
  }

  private onMedkitPickup(first: Phaser.GameObjects.GameObject, second: Phaser.GameObjects.GameObject): void {
    const pickup = getOtherCollisionObject(first, second, this.player);
    if (!pickup || !this.medkitPickups.contains(pickup)) return;
    const healing = this.progression.getMedkitHealing(this.playerMaxHealth);
    const restored = Math.min(healing, this.playerMaxHealth - this.playerHealth);
    if (restored <= 0) return; // No consume un botiquín cuando la salud ya está completa.
    this.playerHealth += restored;
    this.refreshCheckpointProgress();
    (pickup.getData('aura') as Phaser.GameObjects.GameObject | undefined)?.destroy();
    pickup.destroy();
    this.updateHealthHud();
    this.showToast(`BOTIQUÍN · +${restored} HP`);
  }

  private spawnEvolutionPickup(tier: PlayerTier, x: number, y: number): void {
    const texture = PLAYER_TIERS[tier].textureKey;
    const aura = this.add.circle(x, y, 35, 0xd2bd62, 0.18).setDepth(7);
    this.tweens.add({ targets: aura, alpha: 0.38, scale: 1.22, duration: 850, yoyo: true, repeat: -1 });
    const pickup = this.evolutionPickups.create(x, y, texture) as Phaser.Physics.Arcade.Image;
    pickup.setDisplaySize(42, 66).setDepth(9).setData('tier', tier).setData('aura', aura);
    pickup.refreshBody();
    this.showToast(`EVOLUCIÓN ${tier - 1} DISPONIBLE · RECOGE EL EQUIPO`);
  }

  private showToast(message: string): void {
    const toast = this.add.text(GAME_WIDTH / 2, 94, message, {
      fontFamily: 'monospace', fontSize: '12px', color: '#f0df9c',
      backgroundColor: '#0a100de8', padding: { x: 14, y: 9 }, align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(35);
    this.tweens.add({ targets: toast, y: 78, alpha: 0, delay: 1250, duration: 420,
      onComplete: () => toast.destroy(),
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
    first: Phaser.GameObjects.GameObject,
    second: Phaser.GameObjects.GameObject,
  ): void {
    // Arcade Physics no garantiza que el jugador llegue como segundo argumento.
    // Identificar por referencia evita desactivar accidentalmente el propio sprite.
    const projectileObject = getOtherCollisionObject(first, second, this.player);
    if (!projectileObject || !this.enemyProjectiles.contains(projectileObject) || this.playerDead) return;
    const bullet = projectileObject as Phaser.Physics.Arcade.Image;
    if (!bullet.active) return;
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
    if (this.playerDead || this.hordeVictoryPending || !Number.isFinite(damage) || damage <= 0) return;
    const now = this.time.now;
    if (now < this.playerInvulnerableUntil) return;
    this.playerInvulnerableUntil = now + 450;
    this.playerHealth = Math.max(0, this.playerHealth - damage);
    this.player.setTint(0xff9a86);
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
    if (enemy.getData('isHordeEnemy') === true) {
      const waveCleared = this.horde.registerEnemyDefeated();
      this.updateWaveHud();
      if (waveCleared) this.onHordeWaveCleared();
    } else if (this.hordeStarted) {
      this.refreshCheckpointProgress();
    }
    this.createBloodAt(enemy.x, enemy.y, 48);
    this.progression.registerKill(this.kills).forEach((tier) => this.spawnEvolutionPickup(tier, enemy.x, enemy.y));
    if (this.kills === CAMPAIGN_CONFIG.initialEnemyCount) this.spawnReinforcements();
    this.tweens.add({
      targets: enemy, alpha: 0, scaleX: 0.2, scaleY: 0.2,
      duration: COMBAT_CONFIG.deathFadeMs,
      onComplete: () => this.releaseEnemyToPool(enemy),
    });
  }

  private beginPlayerDeath(): void {
    if (this.playerDead) return;
    this.playerDead = true;
    this.aimLaser.clear();
    this.playerShadow.setVisible(false);
    this.player.setVelocity(0, 0);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.createBloodAt(this.player.x, this.player.y, 78);
    this.tweens.add({
      targets: this.player, alpha: 0, scaleX: 0.2, scaleY: 0.2,
      duration: 760,
      onComplete: () => {
        if (this.hordeStarted) this.showCheckpointRetry();
        else this.showGameOver();
      },
    });
  }

  /** Activa la arena solo después de eliminar los 54 hostiles de campaña. */
  private checkArenaEntry(): void {
    if (this.hordeStarted) return;
    const arena = this.map.rooms[HORDE_CONFIG.arenaRoomIndex];
    if (!arena) return;
    const centerX = (arena.x + arena.width / 2) * this.map.cellSize;
    const centerY = (arena.y + arena.height / 2) * this.map.cellSize;
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, centerX, centerY);
    if (distance > HORDE_CONFIG.arenaEntryRadius) return;
    if (this.kills < CAMPAIGN_CONFIG.totalEnemyCount) {
      if (!this.arenaEntryToastShown) {
        this.arenaEntryToastShown = true;
        this.showToast(`ARENA BLOQUEADA · ELIMINA LOS ${CAMPAIGN_CONFIG.totalEnemyCount - this.kills} HOSTILES RESTANTES`);
      }
      return;
    }
    this.startFinalHorde(centerX, centerY);
  }

  private startFinalHorde(checkpointX: number, checkpointY: number): void {
    if (this.hordeStarted) return;
    this.hordeStarted = true;
    this.checkpoint.capture({
      x: checkpointX,
      y: checkpointY,
      tier: this.progression.getCurrentTierId(),
      health: this.playerHealth,
      maxHealth: this.playerMaxHealth,
      kills: this.kills,
    });
    this.showToast('PUNTO DE CONTROL ACTIVADO · HORDA FINAL');
    this.waveText.setText('HORDA FINAL · PREPARANDO...');
    const firstWave = this.horde.start();
    if (firstWave) this.spawnHordeWave(firstWave);
  }

  private spawnHordeWave(wave: HordeWaveState): void {
    const arena = this.map.rooms[HORDE_CONFIG.arenaRoomIndex]!;
    const size = this.map.cellSize;
    const left = arena.x * size + HORDE_CONFIG.spawnInset;
    const right = (arena.x + arena.width) * size - HORDE_CONFIG.spawnInset;
    const top = arena.y * size + HORDE_CONFIG.spawnInset;
    const bottom = (arena.y + arena.height) * size - HORDE_CONFIG.spawnInset;
    const patrolArea = new Phaser.Geom.Rectangle(
      arena.x * size + HORDE_CONFIG.arenaWallInset,
      arena.y * size + HORDE_CONFIG.arenaWallInset,
      arena.width * size - HORDE_CONFIG.arenaWallInset * 2,
      arena.height * size - HORDE_CONFIG.arenaWallInset * 2,
    );
    const slotsPerSide = Math.ceil(wave.enemyCount / 4);
    const difficulty = getEnemyDifficultyForWave(wave.number);

    for (let index = 0; index < wave.enemyCount; index++) {
      const side = index % 4;
      const slot = Math.floor(index / 4);
      const ratio = (slot + 0.5) / slotsPerSide;
      const jitterX = Phaser.Math.Between(-HORDE_CONFIG.spawnJitter, HORDE_CONFIG.spawnJitter);
      const jitterY = Phaser.Math.Between(-HORDE_CONFIG.spawnJitter, HORDE_CONFIG.spawnJitter);
      let x = left + (right - left) * ratio;
      let y = top + (bottom - top) * ratio;
      if (side === 0) y = top;
      else if (side === 1) x = right;
      else if (side === 2) y = bottom;
      else x = left;
      x += jitterX;
      y += jitterY;
      this.createEnemy(x, y, patrolArea, 2, wave.number * 1000 + index, difficulty, true);
    }

    this.waveText.setText(`OLEADA ${wave.number}/${wave.totalWaves} · ${wave.remaining} HOSTILES`);
    this.showToast(wave.isFinal
      ? 'OLEADA FINAL · 50 HOSTILES ENTRANDO DESDE TODOS LOS FLANCOS'
      : `OLEADA ${wave.number} · ${wave.enemyCount} HOSTILES`);
  }

  private onHordeWaveCleared(): void {
    if (this.waveAdvanceEvent) return;
    const state = this.horde.getState();
    if (!state) return;
    if (state.isFinal) {
      this.hordeVictoryPending = true;
      this.enemyProjectiles.getChildren().forEach((object) => this.deactivateProjectile(object as Phaser.Physics.Arcade.Image));
      this.waveText.setText('ARENA DESPEJADA · RESCATE EN CAMINO');
      this.waveAdvanceEvent = this.time.delayedCall(HORDE_CONFIG.waveTransitionDelayMs, () => {
        this.waveAdvanceEvent = undefined;
        this.physics.world.isPaused = true;
        this.scene.start('VictoryScene', {
          kills: this.kills,
          tier: this.progression.getCurrentTierId(),
          waves: state.totalWaves,
        });
      });
      return;
    }
    this.waveText.setText(`OLEADA ${state.number} COMPLETADA · PREPÁRATE`);
    this.waveAdvanceEvent = this.time.delayedCall(HORDE_CONFIG.waveTransitionDelayMs, () => {
      this.waveAdvanceEvent = undefined;
      const nextWave = this.horde.startNextWave();
      if (nextWave) this.spawnHordeWave(nextWave);
    });
  }

  private updateWaveHud(): void {
    const state = this.horde.getState();
    if (!state || !this.waveText) return;
    this.waveText.setText(`OLEADA ${state.number}/${state.totalWaves} · RESTANTES: ${state.remaining}`);
  }

  /** Mantiene el checkpoint espacial y actualiza el progreso desbloqueado durante la horda. */
  private refreshCheckpointProgress(): void {
    const snapshot = this.checkpoint.getSnapshot();
    if (!snapshot || !this.hordeStarted) return;
    this.checkpoint.capture({
      x: snapshot.x,
      y: snapshot.y,
      tier: this.progression.getCurrentTierId(),
      health: this.playerHealth,
      maxHealth: this.playerMaxHealth,
      kills: this.kills,
    });
  }

  private showCheckpointRetry(): void {
    const snapshot = this.checkpoint.getSnapshot();
    if (!snapshot) {
      this.showGameOver();
      return;
    }
    this.waveAdvanceEvent?.remove(false);
    this.waveAdvanceEvent = undefined;
    this.scene.launch('CheckpointScene', {
      tier: snapshot.tier,
      maxHealth: snapshot.maxHealth,
      kills: snapshot.kills,
      healthFraction: HORDE_CONFIG.checkpointHealthFraction,
      waveCount: HORDE_CONFIG.waveCounts.length,
    });
    this.scene.pause();
  }

  /** Reinicia solo la arena; conserva personaje, bajas de campaña y posición capturada. */
  private restartHordeAtCheckpoint(): void {
    const state = this.checkpoint.restoreForRespawn();
    if (!state) {
      this.scene.start('MainMenuScene');
      return;
    }
    this.waveAdvanceEvent?.remove(false);
    this.waveAdvanceEvent = undefined;
    this.enemies.getChildren().slice().forEach((object) => this.releaseEnemyToPool(object as Enemy));
    [this.playerProjectiles, this.enemyProjectiles].forEach((group) => {
      group.getChildren().forEach((object) => this.deactivateProjectile(object as Phaser.Physics.Arcade.Image));
    });

    this.progression.restoreTier(state.tier);
    const tierConfig = PLAYER_TIERS[state.tier];
    this.player.setTexture(tierConfig.textureKey).setAlpha(1).setVisible(true).clearTint();
    this.player.setDisplaySize(PLAYER_DISPLAY_WIDTH, PLAYER_DISPLAY_HEIGHT);
    this.player.setPosition(state.x, state.y);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(state.x, state.y);
    body.setSize(30, 30);
    this.player.setVelocity(0, 0);
    this.playerShadow.setPosition(state.x, state.y + 30).setVisible(true).setAlpha(0.48);
    this.aimLaser.clear();
    this.flashlightOn = false;
    this.lighting.setEnabled(false);
    this.flashlightText.setText('LINTERNA: APAGADA · PRESIONA L');
    this.flashlightText.setColor('#a9b39f');

    this.playerMaxHealth = state.maxHealth;
    this.playerHealth = state.health;
    this.kills = state.kills;
    this.killText.setText(`HOSTILES ELIMINADOS: ${this.kills}`);
    this.currentWeapon = WEAPONS[tierConfig.weaponId];
    this.playerDead = false;
    this.playerInvulnerableUntil = this.time.now + 1200;
    this.horde.reset();
    this.hordeVictoryPending = false;
    const firstWave = this.horde.start();
    this.updateHealthHud();
    this.showToast(`CHECKPOINT · ${this.playerHealth}/${this.playerMaxHealth} HP · HORDA REINICIADA`);
    if (firstWave) this.spawnHordeWave(firstWave);
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
    const ratio = Phaser.Math.Clamp(this.playerHealth / this.playerMaxHealth, 0, 1);
    const color = ratio > 0.5 ? 0x64c76b : ratio > 0.3 ? 0xe2c64f : 0xd84b4b;
    this.healthBar.clear();
    this.healthBar.fillStyle(0x101710, 0.95).fillRect(24, GAME_HEIGHT - 53, 190, 9);
    this.healthBar.fillStyle(color, 1).fillRect(25, GAME_HEIGHT - 52, 188 * ratio, 7);
    this.healthText.setText(`HEALTH  ${this.playerHealth}/${this.playerMaxHealth}`);
    this.weaponText.setText(`${this.currentWeapon.displayName}  ·  DAÑO ${this.currentWeapon.damageMultiplier}x  ·  MUNICIÓN ∞`);
    this.weaponIcon.setTexture(this.currentWeapon.id);
    this.tierText?.setText(`${this.progression.getCurrentTier().displayName}  ·  NIVEL ${this.progression.getCurrentTierId()}`);
  }

  private showGameOver(): void {
    this.physics.world.isPaused = true;
    this.time.paused = false;
    this.isGamePaused = false;
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x030605, 0.88)
      .setScrollFactor(0).setDepth(100);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 530, 330, 0x101a16, 0.98)
      .setStrokeStyle(1, 0x6a554d, 0.9).setScrollFactor(0).setDepth(101);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 94, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '46px', color: '#d95050', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30,
      `OPERADOR: ${String(this.registry.get('playerName') ?? 'SOLDADO').toUpperCase()}\nHOSTILES ELIMINADOS: ${this.kills}`,
      { fontFamily: 'monospace', fontSize: '13px', color: '#d8e0d8', align: 'center', lineSpacing: 7 },
    ).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    this.addOverlayButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 48, 'REINTENTAR', () => {
      this.physics.world.isPaused = false;
      this.time.paused = false;
      this.tweens.resumeAll();
      this.scene.restart();
    });
    this.addOverlayButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 116, 'REGRESAR AL MENÚ', () => {
      this.physics.world.isPaused = false;
      this.time.paused = false;
      this.tweens.resumeAll();
      this.scene.start('MainMenuScene');
    });
  }

  /** Botón interactivo fuera de contenedores: sus coordenadas y su hit-area quedan fijadas a cámara. */
  private addOverlayButton(x: number, y: number, label: string, action: () => void): Phaser.GameObjects.GameObject[] {
    const background = this.add.rectangle(x, y, 290, 48, 0x26392d, 1)
      .setStrokeStyle(1, 0xb5d58a, 0.85)
      .setScrollFactor(0)
      .setDepth(110)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '15px', color: '#e8eee8', fontStyle: 'bold', letterSpacing: 1.5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    background.on('pointerover', () => { background.setFillStyle(0x3b563f); text.setColor('#d8f0b7'); });
    background.on('pointerout', () => { background.setFillStyle(0x26392d); text.setColor('#e8eee8'); });
    background.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: { stopPropagation(): void }) => {
      event.stopPropagation();
      action();
    });
    return [background, text];
  }

  private openPauseMenu(): void {
    if (this.isGamePaused || this.playerDead) return;
    this.isGamePaused = true;
    this.physics.world.isPaused = true;
    this.time.paused = true;
    this.tweens.pauseAll();
    this.pauseObjects = [];

    const addPauseObject = <T extends Phaser.GameObjects.GameObject>(object: T): T => {
      this.pauseObjects.push(object);
      return object;
    };
    addPauseObject(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x030605, 0.84)
      .setScrollFactor(0).setDepth(100));
    addPauseObject(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 530, 390, 0x101a16, 0.98)
      .setStrokeStyle(1, 0x60765f, 0.9).setScrollFactor(0).setDepth(101));
    addPauseObject(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 135, 'JUEGO EN PAUSA', {
      fontFamily: 'monospace', fontSize: '30px', color: '#dbe7d9', fontStyle: 'bold', letterSpacing: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    this.addOverlayButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 42, 'CONTINUAR', () => this.resumeGame())
      .forEach(addPauseObject);
    this.addOverlayButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 28, 'REINICIAR PARTIDA', () => {
      this.clearPauseOverlay();
      this.time.paused = false;
      this.tweens.resumeAll();
      this.physics.world.isPaused = false;
      this.scene.restart();
    }).forEach(addPauseObject);
    this.addOverlayButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 98, 'MENÚ PRINCIPAL', () => {
      this.clearPauseOverlay();
      this.time.paused = false;
      this.tweens.resumeAll();
      this.physics.world.isPaused = false;
      this.scene.start('MainMenuScene');
    }).forEach(addPauseObject);
    addPauseObject(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 160, 'ESC · CONTINUAR', {
      fontFamily: 'monospace', fontSize: '10px', color: '#8b9c8e', letterSpacing: 1.5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
  }

  private clearPauseOverlay(): void {
    this.pauseObjects.forEach((object) => object.destroy());
    this.pauseObjects = [];
  }

  private resumeGame(): void {
    if (!this.isGamePaused) return;
    this.isGamePaused = false;
    this.time.paused = false;
    this.physics.world.isPaused = false;
    this.tweens.resumeAll();
    this.clearPauseOverlay();
  }

  private applyEnemyTierPressure(tier: PlayerTier): void {
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as Enemy;
      if (enemy.active && enemy.state !== 'Dying') enemy.setPlayerTierPressure(tier);
    });
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
    if (this.isGamePaused) this.resumeGame();
    else this.openPauseMenu();
  }
}
