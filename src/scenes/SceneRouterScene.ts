import Phaser from 'phaser';
import { SCENE_NAVIGATION_EVENT, type GameFlowTarget } from '../systems/SceneNavigation';

/**
 * Router persistente. No se detiene al cambiar entre menú, campaña y overlays,
 * por lo que las operaciones de ScenePlugin siempre se encolan desde una
 * escena estable y nunca desde el overlay que está siendo cerrado.
 */
export class SceneRouterScene extends Phaser.Scene {
  private navigationPending = false;

  constructor() { super('SceneRouterScene'); }

  create(): void {
    this.navigationPending = false;
    this.game.events.off(SCENE_NAVIGATION_EVENT, this.handleNavigation, this);
    this.game.events.on(SCENE_NAVIGATION_EVENT, this.handleNavigation, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(SCENE_NAVIGATION_EVENT, this.handleNavigation, this);
    });
  }

  private handleNavigation(target: GameFlowTarget): void {
    if (this.navigationPending) return;
    this.navigationPending = true;

    // Detiene todas las escenas de flujo, estén ejecutándose o pausadas.
    // El router queda fuera de esta lista y sigue activo mientras procesa la cola.
    const flowScenes = [
      'GameScene',
      'GameMenuScene',
      'CheckpointScene',
      'VictoryScene',
      'MainMenuScene',
      'NameInputScene',
      'PrologueScene',
    ];

    for (const key of flowScenes) {
      if (this.scene.isActive(key) || this.scene.isPaused(key) || this.scene.isSleeping(key)) {
        this.scene.stop(key);
      }
    }

    // run() no apaga SceneRouterScene; inicia el destino después de los stop()
    // anteriores o lo reactiva si ya existe en estado pausado/dormido.
    this.scene.run(target);
    this.time.delayedCall(350, () => { this.navigationPending = false; });
  }
}
