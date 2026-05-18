import Phaser from 'phaser';
import { Storage } from '../utils/Storage.js';
import { Leaderboard } from '../utils/Leaderboard.js';
import { setupMainButton, hideMainButton, shareScore, haptic } from '../utils/TelegramApp.js';
import { layout, addText, createButton } from '../utils/UI.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.coins = data.coins || 0;
    this.height = data.height || 0;
    this._initData = data;
  }

  create() {
    const L = layout(this);
    const best = Storage.saveScore(this.finalScore);

    Leaderboard.sendScore(this.finalScore);

    this.add.rectangle(L.cx, L.cy, L.w, L.h, 0x0a0e1a);

    const cardW = Math.min(320, Math.round(L.w * 0.88));
    const btnW = cardW - 48;
    const btnH = Math.min(46, L.btnH);
    const btnGap = 12;
    const pad = 24;

    const titleSize = Math.min(22, L.fontHead);
    const scoreSize = Math.min(52, L.fontTitle);
    const bodySize = Math.min(16, L.fontBody);
    const smallSize = Math.min(14, L.fontSmall);

    const blockH =
      titleSize + 20 +
      scoreSize + 10 +
      smallSize + 16 +
      bodySize + 10 +
      bodySize + 20 +
      btnH * 3 + btnGap * 2;

    const cardH = blockH + pad * 2;
    const cardTop = L.cy - cardH / 2;

    this.add
      .rectangle(L.cx, L.cy, cardW, cardH, 0x1e293b, 0.98)
      .setStrokeStyle(2, 0xef4444, 0.45);

    let y = cardTop + pad;

    addText(this, L.cx, y + titleSize / 2, 'ИГРА ОКОНЧЕНА', titleSize, {
      color: '#ef4444',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    y += titleSize + 20;

    addText(this, L.cx, y + scoreSize / 2, String(this.finalScore), scoreSize, {
      color: '#f8fafc',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    y += scoreSize + 10;

    addText(this, L.cx, y + smallSize / 2, 'очков', smallSize, {
      color: '#94a3b8',
      align: 'center'
    }).setOrigin(0.5);
    y += smallSize + 18;

    addText(
      this,
      L.cx,
      y + bodySize / 2,
      `Высота ${this.height} m  ·  Монеты ${this.coins}`,
      bodySize,
      { color: '#94a3b8', align: 'center' }
    ).setOrigin(0.5);
    y += bodySize + 12;

    addText(this, L.cx, y + bodySize / 2, `Рекорд: ${best}`, bodySize, {
      color: '#38bdf8',
      fontStyle: '600',
      align: 'center'
    }).setOrigin(0.5);
    y += bodySize + 22;

    const btnOpts = { width: btnW, height: btnH, fontSize: bodySize };

    createButton(
      this,
      L.cx,
      y + btnH / 2,
      'ЗАНОВО',
      () => {
        haptic('medium');
        hideMainButton();
        this.restartGame();
      },
      0x2563eb,
      btnOpts
    );
    y += btnH + btnGap;

    createButton(
      this,
      L.cx,
      y + btnH / 2,
      'ПОДЕЛИТЬСЯ',
      () => {
        haptic('light');
        shareScore(this.finalScore);
      },
      0x475569,
      btnOpts
    );
    y += btnH + btnGap;

    createButton(
      this,
      L.cx,
      y + btnH / 2,
      'В МЕНЮ',
      () => {
        hideMainButton();
        this.scene.start('MenuScene');
      },
      0x334155,
      btnOpts
    );

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
