import Phaser from 'phaser';
import { Storage } from '../utils/Storage.js';
import { Leaderboard } from '../utils/Leaderboard.js';
import { setupMainButton, hideMainButton, shareScore, haptic } from '../utils/TelegramApp.js';

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
    const { width, height } = this.scale;
    const best = Storage.saveScore(this.finalScore);

    Leaderboard.sendScore(this.finalScore);

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0e1a, 0.95);

    this.add.text(width / 2, height * 0.2, 'ИГРА ОКОНЧЕНА', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ef4444'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.35, `Счёт: ${this.finalScore}`, {
      fontSize: '32px',
      color: '#f8fafc'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.42, `Высота: ${this.height} m  |  Монеты: ${this.coins}`, {
      fontSize: '16px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.48, `Рекорд: ${best}`, {
      fontSize: '18px',
      color: '#38bdf8'
    }).setOrigin(0.5);

    this.makeBtn(width / 2, height * 0.58, 'ЗАНОВО', 0x2563eb, () => {
      haptic('medium');
      hideMainButton();
      this.restartGame();
    });

    this.makeBtn(width / 2, height * 0.68, 'ПОДЕЛИТЬСЯ', 0x475569, () => {
      haptic('light');
      shareScore(this.finalScore);
    });

    this.makeBtn(width / 2, height * 0.78, 'МЕНЮ', 0x334155, () => {
      hideMainButton();
      this.scene.start('MenuScene');
    });

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

  makeBtn(x, y, label, color, cb) {
    const bg = this.add.rectangle(x, y, 220, 48, color).setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontSize: '18px',
      color: '#fff'
    }).setOrigin(0.5);
    bg.on('pointerdown', cb);
    return { bg, text };
  }

  shutdown() {
    this.cleanupMain?.();
    hideMainButton();
  }
}
