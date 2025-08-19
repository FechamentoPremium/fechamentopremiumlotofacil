// netlify/functions/verify.js
// Retorna { active: boolean, data? } consultando o Netlify Blobs.
// Lê o mesmo "store" que o webhook grava.

exports.handler = async (event) => {
  const make = (statusCode, body, headers = {}) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

  try {
    if (event.httpMethod !== 'POST') {
      return make(405, { error: 'Method Not Allowed' });
    }

    let payload = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return make(400, { active: false, reason: 'bad-json' });
    }

    const e = String(payload.email || '').trim().toLowerCase();
    if (!e || !e.includes('@')) {
      return make(400, { active: false, reason: 'missing-or-invalid-email' });
    }

    const { getStore } = await import('@netlify/blobs');
    const store = getStore('kiwify_subscriptions');
    const data = await store.get(e, { type: 'json' });

    if (!data) {
      return make(200, { active: false, reason: 'not-found' });
    }

    const now = Date.now();
    const stillValid = !!data.active && (!data.expiresAt || Date.parse(data.expiresAt) > now);

    return make(200, { active: stillValid, data });
  } catch (err) {
    return make(500, { active: false, reason: 'server-error', detail: String(err && err.message || err) });
  }
};