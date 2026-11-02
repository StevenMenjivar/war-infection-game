import Phaser from 'phaser';
import { PHASER_CONFIG } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { NameInputScene } from './scenes/NameInputScene';
import { PrologueScene } from './scenes/PrologueScene';
import { GameScene } from './scenes/GameScene';
import { VictoryScene } from './scenes/VictoryScene';
import { CheckpointScene } from './scenes/CheckpointScene';

const config: Phaser.Types.Core.GameConfig = {
  ...PHASER_CONFIG,
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene, PreloadScene, MainMenuScene, NameInputScene, PrologueScene, GameScene, CheckpointScene, VictoryScene],
};

const game = new Phaser.Game(config);

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy(true));
}
