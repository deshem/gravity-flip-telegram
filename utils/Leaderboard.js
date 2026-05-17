const API_BASE = import.meta.env.VITE_LEADERBOARD_API || '';

export class Leaderboard {
  static async sendScore(score, username) {
    if (!API_BASE) {
      return { ok: false, offline: true };
    }
    try {
      const tg = window.Telegram?.WebApp;
      const res = await fetch(`${API_BASE}/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          username: username || tg?.initDataUnsafe?.user?.username || 'player',
          userId: tg?.initDataUnsafe?.user?.id
        })
      });
      return res.ok ? await res.json() : { ok: false };
    } catch {
      return { ok: false, offline: true };
    }
  }

  static async getTopScores() {
    if (!API_BASE) {
      const local = StorageFallback();
      return local;
    }
    try {
      const res = await fetch(`${API_BASE}/leaderboard`);
      if (!res.ok) return StorageFallback();
      return await res.json();
    } catch {
      return StorageFallback();
    }
  }

  static showTelegramLeaderboard() {
    const tg = window.Telegram?.WebApp;
    if (tg?.openInvoice) {
      /* placeholder for custom leaderboard UI */
    }
    return false;
  }
}

function StorageFallback() {
  const best = parseInt(localStorage.getItem('gravity_flip_best') || '0', 10);
  return { scores: [{ username: 'You', score: best }] };
}
