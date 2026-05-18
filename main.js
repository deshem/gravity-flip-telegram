import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import { initTelegram } from './utils/TelegramApp.js';
import { getViewport, getDpr, resizeGame, applySafeArea } from './utils/Viewport.js';

const tg = initTelegram();
const { width, height } = getViewport();

const config = {
  type: Phaser.AUTO,
  width,
  height,
  parent: 'game-container',
  backgroundColor: '#0a0e1a',
  resolution: Math.min(getDpr(), 2),
  render: {
    antialias: true,
    roundPixels: true,
    pixelArt: false,
    powerPreference: 'high-performance'
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
    width,
    height,
    autoRound: true
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
applySafeArea(game);

let resizeTimer;
const onResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeGame(game);
    const menu = game.scene.getScene('MenuScene');
    const over = game.scene.getScene('GameOverScene');
    const ui = game.scene.getScene('UIScene');

    if (menu?.scene.isActive()) menu.scene.restart();
    if (over?.scene.isActive() && over._initData) over.scene.restart(over._initData);
    if (ui?.scene.isActive()) ui.scene.restart();
  }, 150);
};

window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
tg?.onEvent?.('viewportChanged', onResize);

export default game;
