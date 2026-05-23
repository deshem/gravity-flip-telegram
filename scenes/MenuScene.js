import Phaser from 'phaser';
import { Storage } from '../utils/Storage.js';
import { Leaderboard } from '../utils/Leaderboard.js';
import { haptic, hideMainButton } from '../utils/TelegramApp.js';
import { music, bindMusicUnlock } from '../utils/MusicManager.js';
import {
  layout,
  addText,
  createButton,
  createPanel,
  createToggleRow,
  createVolumeRow
} from '../utils/UI.js';
import { FEATURES } from '../utils/features.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    hideMainButton();
    bindMusicUnlock(this);

    const L = layout(this);
    const best = Storage.loadScore();
    const bestCoins = Storage.loadBestCoins();

    this.add.rectangle(L.cx, L.cy, L.w, L.h, 0x0a0e1a);

    addText(this, L.cx, L.safeTop + L.usableH * 0.12, 'GRAVITY FLIP', L.fontTitle, {
      color: '#38bdf8',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    const statsY = L.safeTop + L.usableH * 0.19;
    const statsGap = L.fontBody + 10;

    addText(this, L.cx, statsY, `Рекорд: ${best}`, L.fontBody, {
      color: '#e2e8f0',
      align: 'center',
      fontStyle: '600'
    }).setOrigin(0.5);

    addText(this, L.cx, statsY + statsGap, `Рекорд монет: ${bestCoins}`, L.fontBody, {
      color: '#fbbf24',
      align: 'center',
      fontStyle: '600'
    }).setOrigin(0.5);

    const btnY0 = L.safeTop + L.usableH * 0.4;
    const btnGap = L.btnH + 14;

    createButton(this, L.cx, btnY0, '▶  ИГРАТЬ', () => {
      haptic('medium');
      music.unlock();
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });

    let settingsY = btnY0 + btnGap;

    if (FEATURES.showLeaderboardButton) {
      createButton(this, L.cx, btnY0 + btnGap, 'ТАБЛИЦА ЛИДЕРОВ', () => {
        this.showLeaderboard();
      }, 0x475569);
      settingsY = btnY0 + btnGap * 2;
    }

    createButton(this, L.cx, settingsY, '⚙  НАСТРОЙКИ', () => {
      haptic('light');
      this.showSettings();
    }, 0x475569);

    addText(
      this,
      L.cx,
      L.h - L.safeBottom - L.pad,
      'Ведите палец — влево / вправо',
      L.fontSmall,
      { color: '#64748b', align: 'center' }
    ).setOrigin(0.5, 1);
  }

  /** Таблица лидеров (скрыта в меню, если FEATURES.showLeaderboardButton = false) */
  async showLeaderboard() {
    haptic('light');
    const data = await Leaderboard.getTopScores();
    const list = data.scores || data;
    const lines = list.slice(0, 5).map((e, i) => `${i + 1}.  ${e.username}  —  ${e.score}`);
    this.showInfo('Лидеры', lines.length ? lines.join('\n') : 'Пока нет записей');
  }

  showInfo(title, body) {
    const L = layout(this);
    const panel = createPanel(this, {
      title,
      panelH: Math.min(300, Math.round(L.usableH * 0.42)),
      onBack: () => panel.destroy()
    });

    panel.content.add(
      addText(this, 0, 36, body, L.fontBody, {
        color: '#cbd5e1',
        align: 'center',
        lineSpacing: 10,
        wordWrap: { width: panel.panelW - 40 }
      }).setOrigin(0.5, 0)
    );
  }

  showSettings() {
    const settings = { ...Storage.getSettings() };
    if (settings.volume == null) settings.volume = 70;

    const L = layout(this);
    const panel = createPanel(this, {
      title: 'Настройки',
      panelH: Math.min(420, Math.round(L.usableH * 0.65)),
      onBack: () => {
        haptic('light');
        panel.destroy();
      }
    });

    const save = () => Storage.saveSettings(settings);
    const rowGap = 58;

    panel.content.add(
      createToggleRow(this, 0, 16, 'Звук', settings.sound, (v) => {
        settings.sound = v;
        save();
        music.sync();
        haptic('light');
      })
    );

    panel.content.add(
      createToggleRow(this, 0, 16 + rowGap, 'Вибрация', settings.haptic, (v) => {
        settings.haptic = v;
        save();
        haptic('light');
      })
    );

    panel.content.add(
      createVolumeRow(this, 0, 16 + rowGap * 2 + 12, settings.volume, (v) => {
        settings.volume = v;
        save();
        music.applyVolume();
        haptic('light');
      })
    );
  }
}
