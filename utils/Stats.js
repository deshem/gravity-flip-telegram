const SESSION_KEY = 'gf_player_tracked';

function statsApiUrl(path) {
  const base = (import.meta.env.VITE_STATS_API || '').replace(/\/$/, '');
  if (base) return `${base}${path}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}

/**
 * Регистрирует уникального игрока Telegram (один раз за сессию вкладки).
 * Вызывайте при старте раунда — только в Mini App с initData.
 */
export function trackPlayer() {
  const tg = window.Telegram?.WebApp;
  const initData = tg?.initData;
  if (!initData) return;

  if (sessionStorage.getItem(SESSION_KEY)) return;
  sessionStorage.setItem(SESSION_KEY, '1');

  const url = statsApiUrl('/api/play');

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
    keepalive: true
  }).catch(() => {});
}
