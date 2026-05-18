import Phaser from 'phaser';
import { createGameHud } from '../utils/UI.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this.hud = createGameHud(this, {
      onPause: () => this.scene.get('GameScene')?.events.emit('pauseGame')
    });

    this.scoreText = this.hud.scoreText;
    this.coinText = this.hud.coinText;
    this.registry.set('score', 0);
    this.registry.set('coins', 0);
  }

  update() {
    const game = this.scene.get('GameScene');
    if (!game?.scene?.isActive()) return;

    this.hud.setScore(game.score ?? 0);
    this.hud.setCoins(game.coins ?? 0);
  }
}
