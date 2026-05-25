import { isStoreReady, getStats } from './lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const secret = process.env.STATS_READ_SECRET;
  if (secret) {
    const provided = req.headers['x-stats-secret'] || req.query?.secret;
    if (provided !== secret) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
  }

  if (!isStoreReady()) {
    return res.status(503).json({ ok: false, error: 'redis_not_configured' });
  }

  try {
    const stats = await getStats();
    return res.status(200).json({ ok: true, ...stats });
  } catch (e) {
    console.error('getStats', e);
    return res.status(500).json({ ok: false, error: 'store_failed' });
  }
}
