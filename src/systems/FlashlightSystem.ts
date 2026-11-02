import Phaser from 'phaser';
import { LIGHTING_CONFIG } from '../config/LightingConfig';
import { buildVisibilityPolygon } from './VisibilityGeometry';
import type { RectangleBounds } from './Geometry';

interface LightMaskLayer {
  index: number;
  graphics: Phaser.GameObjects.Graphics;
  mask: Phaser.Display.Masks.GeometryMask;
  overlay: Phaser.GameObjects.Rectangle;
}

/** Iluminación ambiental por capas y haz de linterna con oclusión geométrica. */
export class FlashlightSystem {
  private readonly layers: LightMaskLayer[] = [];
  private readonly beam: Phaser.GameObjects.Graphics;
  private readonly fallbackDarkness?: Phaser.GameObjects.Rectangle;
  private readonly supportsInvertedMask: boolean;
  private enabled = false;
  private lastUpdate = -Infinity;
  private lastX = Number.NaN;
  private lastY = Number.NaN;
  private lastAngle = Number.NaN;

  constructor(
    scene: Phaser.Scene,
    worldWidth: number,
    worldHeight: number,
  ) {
    this.supportsInvertedMask = scene.game.renderer.type === Phaser.WEBGL;
    if (this.supportsInvertedMask) {
      LIGHTING_CONFIG.flashlightAmbientRadii.forEach((_radius, index) => {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        const mask = graphics.createGeometryMask();
        mask.setInvertAlpha(true);
        const overlay = scene.add.rectangle(
          worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 0x030704,
          LIGHTING_CONFIG.flashlightDarknessAlpha[index]!,
        ).setDepth(18);
        overlay.setMask(mask);
        this.layers.push({ index, graphics, mask, overlay });
      });
    } else {
      // Fallback para Canvas: conserva la escena legible y dibuja el cono recortado por geometría.
      this.fallbackDarkness = scene.add.rectangle(
        worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 0x030704,
        LIGHTING_CONFIG.canvasDarknessAlphaOff,
      ).setDepth(18);
    }

    this.beam = scene.add.graphics().setDepth(this.supportsInvertedMask ? 9.25 : 19.25);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.fallbackDarkness?.setAlpha(enabled
      ? LIGHTING_CONFIG.canvasDarknessAlphaOn
      : LIGHTING_CONFIG.canvasDarknessAlphaOff);
    // Fuerza el recálculo de los radios y la intensidad al cambiar de modo.
    this.lastUpdate = -Infinity;
  }

  update(
    x: number,
    y: number,
    directionAngle: number,
    now: number,
    blockers: readonly RectangleBounds[],
  ): void {
    const moved = Math.hypot(x - this.lastX, y - this.lastY) >= 4;
    const rotated = Math.abs(directionAngle - this.lastAngle) >= 0.012;
    if (!moved && !rotated && now - this.lastUpdate < LIGHTING_CONFIG.updateIntervalMs) return;

    const halfAngle = Phaser.Math.DegToRad(LIGHTING_CONFIG.flashlightApertureDegrees / 2);
    const cone = this.enabled
      ? buildVisibilityPolygon(
        x, y, directionAngle, LIGHTING_CONFIG.flashlightRange, halfAngle, blockers,
        LIGHTING_CONFIG.visibilityRayCount, LIGHTING_CONFIG.cornerRayEpsilon,
      )
      : [];

    if (this.supportsInvertedMask) {
      const radii = this.enabled
        ? LIGHTING_CONFIG.flashlightAmbientRadii
        : LIGHTING_CONFIG.darkAmbientRadii;
      const darknessAlpha = this.enabled
        ? LIGHTING_CONFIG.flashlightDarknessAlpha
        : LIGHTING_CONFIG.darkDarknessAlpha;
      for (const layer of this.layers) {
        layer.graphics.clear();
        layer.graphics.fillStyle(0xffffff, 1).fillCircle(x, y, radii[layer.index]!);
        if (cone.length >= 3) layer.graphics.fillPoints(cone, true);
        layer.overlay.setAlpha(darknessAlpha[layer.index]!);
      }
    }

    this.beam.clear();
    if (this.enabled && cone.length >= 3) {
      this.beam.fillStyle(0xb9d59a, this.supportsInvertedMask
        ? LIGHTING_CONFIG.beamAlpha : 0.20).fillPoints(cone, true);
      this.beam.lineStyle(1.2, 0xdce9c8, 0.20);
      this.beam.beginPath();
      this.beam.moveTo(x, y);
      this.beam.lineTo(cone[1]!.x, cone[1]!.y);
      this.beam.moveTo(x, y);
      const edge = cone[cone.length - 1]!;
      this.beam.lineTo(edge.x, edge.y);
      this.beam.strokePath();
    } else {
      this.beam.fillStyle(0x9eae8d, LIGHTING_CONFIG.ambientGlowAlpha)
        .fillCircle(x, y, LIGHTING_CONFIG.ambientGlowRadius);
    }

    this.lastX = x;
    this.lastY = y;
    this.lastAngle = directionAngle;
    this.lastUpdate = now;
  }

  destroy(): void {
    for (const layer of this.layers) {
      layer.overlay.clearMask(true);
      layer.graphics.destroy();
    }
    this.beam.destroy();
    this.fallbackDarkness?.destroy();
  }
}
