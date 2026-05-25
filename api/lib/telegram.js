import crypto from 'crypto';

/** @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app */
export function validateInitData(initData, botToken) {
  if (!initData || !botToken) return false;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;

  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculated = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculated !== hash) return false;

  const authDate = Number(params.get('auth_date') || 0);
  if (authDate && Date.now() / 1000 - authDate > 60 * 60 * 24 * 7) {
    return false;
  }

  return true;
}

export function getUserFromInitData(initData) {
  const raw = new URLSearchParams(initData).get('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
