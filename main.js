import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import { initTelegram } from './utils/TelegramApp.js';

initTelegram();

function getSize() {
  const tg = window.Telegram?.WebApp;
  return {
    width: tg?.viewportStableWidth || window.innerWidth,
    height: tg?.viewportStableHeight || window.innerHeight
  };
}

const { width, height } = getSize();

const config = {
  type: Phaser.AUTO,
  width,
  height,
  parent: 'game-container',
  backgroundColor: '#0a0e1a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 520 },
      debug: false
    }
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, UIScene, GameOverScene]
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
  const s = getSize();
  game.scale.resize(s.width, s.height);
});

export default game;
