import { validateInitData, getUserFromInitData } from './lib/telegram.js';
import { isStoreReady, recordPlayer } from './lib/store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  if (!isStoreReady()) {
    return res.status(503).json({ ok: false, error: 'redis_not_configured' });
  }

  const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return res.status(503).json({ ok: false, error: 'bot_token_not_configured' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const initData = body.initData || req.headers['x-telegram-init-data'];

  if (!initData) {
    return res.status(400).json({ ok: false, error: 'no_init_data' });
  }

  if (!validateInitData(initData, botToken)) {
    return res.status(403).json({ ok: false, error: 'invalid_init_data' });
  }

  const user = getUserFromInitData(initData);
  if (!user?.id) {
    return res.status(400).json({ ok: false, error: 'no_user' });
  }

  try {
    const isNew = await recordPlayer(user.id);
    return res.status(200).json({
      ok: true,
      userId: user.id,
      registered: Boolean(isNew)
    });
  } catch (e) {
    console.error('recordPlayer', e);
    return res.status(500).json({ ok: false, error: 'store_failed' });
  }
}
