const SCORE_KEY = 'gravity_flip_best';
const COINS_BEST_KEY = 'gravity_flip_best_coins';
const SETTINGS_KEY = 'gravity_flip_settings';

const defaultSettings = { sound: true, haptic: true, volume: 70 };

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

  /** Лучший результат монет за одну игру (только максимум) */
  static saveBestCoins(coins) {
    const best = Storage.loadBestCoins();
    if (coins > best) {
      localStorage.setItem(COINS_BEST_KEY, String(coins));
    }
    return Math.max(coins, best);
  }

  static loadBestCoins() {
    return parseInt(localStorage.getItem(COINS_BEST_KEY) || '0', 10);
  }
}
