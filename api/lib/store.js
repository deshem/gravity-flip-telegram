import { Redis } from '@upstash/redis';

const PLAYERS_KEY = 'gf:players';
const SESSIONS_KEY = 'gf:sessions';
const LAST_SEEN_KEY = 'gf:last_seen';

function redisCredentials() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.KV_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return { url, token };
}

function getRedis() {
  const { url, token } = redisCredentials();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function isStoreReady() {
  const { url, token } = redisCredentials();
  return Boolean(url && token);
}

export async function recordPlayer(userId) {
  const redis = getRedis();
  if (!redis) {
    throw new Error('REDIS_NOT_CONFIGURED');
  }

  const id = String(userId);
  const pipeline = redis.pipeline();
  pipeline.sadd(PLAYERS_KEY, id);
  pipeline.incr(SESSIONS_KEY);
  pipeline.hset(LAST_SEEN_KEY, { [id]: Date.now() });
  const results = await pipeline.exec();
  const added = Number(results?.[0]) || 0;
  return added > 0;
}

export async function getStats() {
  const redis = getRedis();
  if (!redis) {
    throw new Error('REDIS_NOT_CONFIGURED');
  }

  const [uniquePlayers, totalSessions] = await Promise.all([
    redis.scard(PLAYERS_KEY),
    redis.get(SESSIONS_KEY)
  ]);

  return {
    uniquePlayers: Number(uniquePlayers) || 0,
    totalSessions: Number(totalSessions) || 0
  };
}
