const SCORE_KEY = 'gravity_flip_best';
const COINS_KEY = 'gravity_flip_coins';
const SETTINGS_KEY = 'gravity_flip_settings';

const defaultSettings = { sound: true, haptic: true };

export class Storage {
  static getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...defaultSettings, ...JSON.parse(raw) } : { ...defaultSettings };
    } catch {
      return { ...defaultSettings };
    }
  }

  static saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  static saveScore(score) {
    const best = Storage.loadScore();
    if (score > best) {
      localStorage.setItem(SCORE_KEY, String(score));
    }

    const tg = window.Telegram?.WebApp;
    if (tg) {
      try {
        tg.sendData(JSON.stringify({ type: 'score', score, best: Math.max(score, best) }));
      } catch {
        /* bot may not be configured */
      }
    }
    return Math.max(score, best);
  }

  static loadScore() {
    return parseInt(localStorage.getItem(SCORE_KEY) || '0', 10);
  }

  static saveCoins(total) {
    localStorage.setItem(COINS_KEY, String(total));
  }

  static loadCoins() {
    return parseInt(localStorage.getItem(COINS_KEY) || '0', 10);
  }
}
