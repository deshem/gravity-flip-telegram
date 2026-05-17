import { Storage } from './Storage.js';

export function initTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return null;

  tg.ready();
  tg.expand();
  tg.enableClosingConfirmation();

  applyTheme(tg);
  tg.onEvent('themeChanged', () => applyTheme(tg));

  return tg;
}

function applyTheme(tg) {
  const root = document.documentElement;
  const p = tg.themeParams;
  if (p.bg_color) root.style.setProperty('--tg-theme-bg-color', p.bg_color);
  if (p.text_color) root.style.setProperty('--tg-theme-text-color', p.text_color);
  if (p.button_color) root.style.setProperty('--tg-theme-button-color', p.button_color);
  if (p.button_text_color) root.style.setProperty('--tg-theme-button-text-color', p.button_text_color);
}

export function haptic(type = 'light') {
  const settings = Storage.getSettings();
  if (!settings.haptic) return;
  const tg = window.Telegram?.WebApp;
  if (tg?.HapticFeedback) {
    if (type === 'heavy') tg.HapticFeedback.impactOccurred('heavy');
    else if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
    else tg.HapticFeedback.impactOccurred('light');
  }
}

export function setupMainButton(text, onClick) {
  const tg = window.Telegram?.WebApp;
  if (!tg?.MainButton) return () => {};

  tg.MainButton.setText(text);
  tg.MainButton.show();
  tg.MainButton.onClick(onClick);

  return () => {
    tg.MainButton.offClick(onClick);
    tg.MainButton.hide();
  };
}

export function hideMainButton() {
  window.Telegram?.WebApp?.MainButton?.hide();
}

export function shareScore(score) {
  const tg = window.Telegram?.WebApp;
  const text = `Gravity Flip — мой рекорд: ${score}! Сможешь побить?`;
  const url = tg?.initDataUnsafe?.start_param
    ? `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`
    : `https://t.me/share/url?text=${encodeURIComponent(text)}`;

  if (tg?.openTelegramLink) {
    tg.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}
