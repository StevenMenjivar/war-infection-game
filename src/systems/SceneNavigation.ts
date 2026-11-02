import Phaser from 'phaser';

export type GameFlowTarget = 'GameScene' | 'MainMenuScene';
export const SCENE_NAVIGATION_EVENT = 'war-infection:navigate';

/**
 * Solicita una navegación al SceneRouterScene persistente.
 * Las escenas modales nunca intentan detenerse a sí mismas ni gestionar
 * directamente otras escenas; el router central permanece vivo durante
 * toda la sesión y procesa una única cola de operaciones.
 */
export function requestSceneNavigation(source: Phaser.Scene, target: GameFlowTarget): void {
  source.game.events.emit(SCENE_NAVIGATION_EVENT, target);
}
