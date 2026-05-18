import Phaser from 'phaser';
import { layout } from '../utils/UI.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const L = layout(this);
    const top = L.pad + 4;

    const hudBg = this.add
      .rectangle(L.cx, top + 22, L.w - L.pad * 2, 52, 0x0f172a, 0.85)
      .setStrokeStyle(1, 0x334155, 0.8)
      .setScrollFactor(0)
      .setDepth(10);

    this.scoreText = this.add
      .text(L.pad + 12, top + 10, '0 m', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: `${L.fontHead}px`,
        color: '#f8fafc',
        fontStyle: 'bold'
      })
      .setScrollFactor(0)
      .setDepth(11);

    this.coinIcon = this.add
      .image(L.pad + 14, top + 38, 'coin')
      .setScale(0.65)
      .setScrollFactor(0)
      .setDepth(11);

    this.coinText = this.add
      .text(L.pad + 32, top + 38, '0', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: `${L.fontBody}px`,
        color: '#fbbf24',
        fontStyle: '600'
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(11);

    const pauseBg = this.add
      .rectangle(L.w - L.pad - 28, top + 22, 48, 40, 0x334155)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(11);

    this.add
      .text(L.w - L.pad - 28, top + 22, '⏸', {
        fontSize: `${L.fontBody}px`,
        color: '#e2e8f0'
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(12);

    pauseBg.on('pointerdown', () => {
      this.scene.get('GameScene')?.events.emit('pauseGame');
    });

    this.hudBg = hudBg;
    this.registry.set('score', 0);
    this.registry.set('coins', 0);
  }

  update() {
    const game = this.scene.get('GameScene');
    if (!game?.scene?.isActive()) return;

    const score = game.score ?? 0;
    const coins = game.coins ?? 0;
    this.scoreText.setText(`${score} m`);
    this.coinText.setText(String(coins));
  }
}
