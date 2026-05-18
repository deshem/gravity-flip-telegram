import Phaser from 'phaser';
import { Storage } from '../utils/Storage.js';
import { Leaderboard } from '../utils/Leaderboard.js';
import { haptic, hideMainButton } from '../utils/TelegramApp.js';
import { music, bindMusicUnlock } from '../utils/MusicManager.js';
import {
  layout,
  createButton,
  createPanel,
  createToggleRow,
  createVolumeRow
} from '../utils/UI.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    hideMainButton();
    bindMusicUnlock(this);

    const L = layout(this);
    const best = Storage.loadScore();

    this.add.rectangle(L.cx, L.cy, L.w, L.h, 0x0a0e1a);

    this.add
      .text(L.cx, L.h * 0.14, 'GRAVITY FLIP', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: `${L.fontTitle}px`,
        fontStyle: 'bold',
        color: '#38bdf8'
      })
      .setOrigin(0.5);

    this.add
      .text(L.cx, L.h * 0.22, `Рекорд: ${best}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: `${L.fontBody}px`,
        color: '#94a3b8'
      })
      .setOrigin(0.5);

    const btnY0 = L.h * 0.38;
    const btnGap = L.btnH + 14;

    createButton(this, L.cx, btnY0, '▶  ИГРАТЬ', () => {
      haptic('medium');
      music.unlock();
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });

    createButton(this, L.cx, btnY0 + btnGap, 'ТАБЛИЦА ЛИДЕРОВ', async () => {
      haptic('light');
      const data = await Leaderboard.getTopScores();
      const list = data.scores || data;
      const lines = list.slice(0, 5).map((e, i) => `${i + 1}.  ${e.username}  —  ${e.score}`);
      this.showInfo('Лидеры', lines.length ? lines.join('\n') : 'Пока нет записей');
    }, 0x475569);

    createButton(this, L.cx, btnY0 + btnGap * 2, '⚙  НАСТРОЙКИ', () => {
      haptic('light');
      this.showSettings();
    }, 0x475569);

    this.add
      .text(L.cx, L.h - L.pad - L.fontSmall * 2, 'Нажмите экран — прыжок\nВедите палец — движение', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: `${L.fontSmall}px`,
        color: '#64748b',
        align: 'center',
        lineSpacing: 6
      })
      .setOrigin(0.5, 1);
  }

  showInfo(title, body) {
    const L = layout(this);
    const panel = createPanel(this, {
      title,
      panelH: Math.min(280, L.h * 0.4),
      onBack: () => panel.destroy()
    });

    panel.content.add(
      this.add
        .text(0, 40, body, {
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          fontSize: `${L.fontBody}px`,
          color: '#cbd5e1',
          align: 'center',
          lineSpacing: 8
        })
        .setOrigin(0.5, 0)
    );
  }

  showSettings() {
    const settings = { ...Storage.getSettings() };
    if (settings.volume == null) settings.volume = 70;

    const L = layout(this);
    const panel = createPanel(this, {
      title: 'Настройки',
      panelH: Math.min(400, L.h * 0.62),
      onBack: () => {
        haptic('light');
        panel.destroy();
      }
    });

    const save = () => Storage.saveSettings(settings);
    const rowGap = 56;

    panel.content.add(
      createToggleRow(this, 0, 20, 'Звук', settings.sound, (v) => {
        settings.sound = v;
        save();
        music.sync();
        haptic('light');
      })
    );

    panel.content.add(
      createToggleRow(this, 0, 20 + rowGap, 'Вибрация', settings.haptic, (v) => {
        settings.haptic = v;
        save();
        haptic('light');
      })
    );

    panel.content.add(
      createVolumeRow(this, 0, 20 + rowGap * 2 + 16, settings.volume, (v) => {
        settings.volume = v;
        save();
        music.applyVolume();
        haptic('light');
      })
    );
  }
}
