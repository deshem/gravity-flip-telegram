import Phaser from 'phaser';
import { Storage } from '../utils/Storage.js';
import { Leaderboard } from '../utils/Leaderboard.js';
import { haptic, hideMainButton } from '../utils/TelegramApp.js';
import { music, bindMusicUnlock } from '../utils/MusicManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    hideMainButton();
    bindMusicUnlock(this);
    const { width, height } = this.scale;
    const settings = Storage.getSettings();
    const best = Storage.loadScore();

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0e1a);

    this.add.text(width / 2, height * 0.22, 'GRAVITY FLIP', {
      fontFamily: 'sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.32, `Рекорд: ${best}`, {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.makeButton(width / 2, height * 0.48, 'ИГРАТЬ', 0x2563eb, () => {
      haptic('medium');
      music.unlock();
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });

    this.makeButton(width / 2, height * 0.58, 'ТАБЛИЦА', 0x475569, async () => {
      haptic('light');
      const data = await Leaderboard.getTopScores();
      const lines = (data.scores || data).slice(0, 5).map((e, i) => `${i + 1}. ${e.username}: ${e.score}`);
      this.showOverlay('Лидеры', lines.length ? lines.join('\n') : 'Пока нет данных');
    });

    this.makeButton(width / 2, height * 0.68, 'НАСТРОЙКИ', 0x475569, () => {
      haptic('light');
      this.showSettings(settings);
    });

    this.add.text(width / 2, height * 0.88, 'Нажмите экран — прыжок  |  Ведите палец — влево/вправо', {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      color: '#64748b',
      align: 'center',
      wordWrap: { width: width - 40 }
    }).setOrigin(0.5);
  }

  makeButton(x, y, label, color, cb) {
    const btn = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 220, 48, color).setInteractive({ useHandCursor: true });
    const text = this.add.text(0, 0, label, {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    btn.add([bg, text]);
    bg.on('pointerdown', cb);
    return btn;
  }

  showOverlay(title, body) {
    const { width, height } = this.scale;
    const panel = this.add.container(width / 2, height / 2).setDepth(100);
    const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setInteractive();
    const box = this.add.rectangle(0, 0, width * 0.85, 200, 0x1e293b);
    const t = this.add.text(0, -70, title, { fontSize: '22px', color: '#f8fafc' }).setOrigin(0.5);
    const b = this.add.text(0, 0, body, {
      fontSize: '16px',
      color: '#cbd5e1',
      align: 'center',
      wordWrap: { width: width * 0.75 }
    }).setOrigin(0.5);
    const close = this.add.text(0, 80, 'Закрыть', { fontSize: '18px', color: '#38bdf8' }).setOrigin(0.5).setInteractive();
    panel.add([dim, box, t, b, close]);
    close.on('pointerdown', () => panel.destroy());
    dim.on('pointerdown', () => panel.destroy());
  }

  showSettings(settings) {
    const { width, height } = this.scale;
    const panel = this.add.container(width / 2, height / 2).setDepth(100);
    const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setInteractive();
    const box = this.add.rectangle(0, 0, width * 0.85, 240, 0x1e293b);
    const title = this.add.text(0, -90, 'Настройки', { fontSize: '22px', color: '#f8fafc' }).setOrigin(0.5);

    const mkToggle = (y, label, key) => {
      const on = settings[key];
      const txt = this.add.text(0, y, `${label}: ${on ? 'ВКЛ' : 'ВЫКЛ'}`, {
        fontSize: '18px',
        color: '#38bdf8'
      }).setOrigin(0.5).setInteractive();
      txt.on('pointerdown', () => {
        settings[key] = !settings[key];
        Storage.saveSettings(settings);
        music.sync();
        panel.destroy();
        this.scene.restart();
      });
      return txt;
    };

    const close = this.add.text(0, 90, 'Закрыть', { fontSize: '18px', color: '#94a3b8' }).setOrigin(0.5).setInteractive();
    panel.add([dim, box, title, mkToggle(-20, 'Звук', 'sound'), mkToggle(30, 'Вибрация', 'haptic'), close]);
    close.on('pointerdown', () => panel.destroy());
    dim.on('pointerdown', () => panel.destroy());
  }
}
