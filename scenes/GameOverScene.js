import Phaser from 'phaser';
import { Storage } from '../utils/Storage.js';
import { Leaderboard } from '../utils/Leaderboard.js';
import { setupMainButton, hideMainButton, shareScore, haptic } from '../utils/TelegramApp.js';
import { layout, createButton } from '../utils/UI.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.coins = data.coins || 0;
    this.height = data.height || 0;
  }

  create() {
    const L = layout(this);
    const best = Storage.saveScore(this.finalScore);

    Leaderboard.sendScore(this.finalScore);

    this.add.rectangle(L.cx, L.cy, L.w, L.h, 0x0a0e1a);

    const cardH = Math.min(420, L.h * 0.55);
    this.add
      .rectangle(L.cx, L.cy - 20, L.w * 0.88, cardH, 0x1e293b, 0.95)
      .setStrokeStyle(2, 0xef4444, 0.4);

    this.add
      .text(L.cx, L.cy - cardH / 2 + 36, 'ИГРА ОКОНЧЕНА', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: `${L.fontHead}px`,
        fontStyle: 'bold',
        color: '#ef4444'
      })
      .setOrigin(0.5);

    this.add
      .text(L.cx, L.cy - 30, `${this.finalScore}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: `${L.fontTitle}px`,
        color: '#f8fafc',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(L.cx, L.cy + 10, 'очков', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: `${L.fontSmall}px`,
        color: '#94a3b8'
      })
      .setOrigin(0.5);

    this.add
      .text(L.cx, L.cy + 44, `Высота ${this.height} m   ·   Монеты ${this.coins}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: `${L.fontBody}px`,
        color: '#94a3b8'
      })
      .setOrigin(0.5);

    this.add
      .text(L.cx, L.cy + 78, `Рекорд: ${best}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: `${L.fontBody}px`,
        color: '#38bdf8',
        fontStyle: '600'
      })
      .setOrigin(0.5);

    const btnY = L.cy + cardH / 2 - 50;
    const gap = L.btnH + 12;

    createButton(this, L.cx, btnY - gap * 2, 'ЗАНОВО', () => {
      haptic('medium');
      hideMainButton();
      this.restartGame();
    });

    createButton(this, L.cx, btnY - gap, 'ПОДЕЛИТЬСЯ', () => {
      haptic('light');
      shareScore(this.finalScore);
    }, 0x475569);

    createButton(this, L.cx, btnY, 'В МЕНЮ', () => {
      hideMainButton();
      this.scene.start('MenuScene');
    }, 0x334155);

    this.cleanupMain = setupMainButton('Играть снова', () => {
      hideMainButton();
      this.restartGame();
    });
  }

  restartGame() {
    this.scene.stop('GameOverScene');
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }

  shutdown() {
    this.cleanupMain?.();
    hideMainButton();
  }
}
