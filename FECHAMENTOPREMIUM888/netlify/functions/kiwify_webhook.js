// netlify/functions/kiwify_webhook.js
// Recebe eventos da Kiwify e grava status por e-mail no Netlify Blobs.
// Segurança simples via token na query (?token=...)
// Necessário: variável de ambiente WEBHOOK_TOKEN no Netlify.

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

    const url = new URL(event.rawUrl || `https://dummy${event.path}${event.queryStringParameters ? '?' + new URLSearchParams(event.queryStringParameters).toString() : ''}`);
    const token = url.searchParams.get('token');
    const expected = process.env.WEBHOOK_TOKEN;
    if (!expected || token !== expected) {
      return make(401, { error: 'Unauthorized' });
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return make(400, { error: 'Bad Request: invalid JSON' });
    }

    const email = String(
      (body && body.customer && body.customer.email) ||
      (body && body.buyer && body.buyer.email) ||
      (body && body.email) ||
      ''
    ).trim().toLowerCase();

    if (!email) {
      return make(400, { error: 'Bad Request: missing email' });
    }

    const eventType = String((body && (body.event || body.type)) || '').toLowerCase();
    const sub = (body && (body.subscription || (body.data && body.data.subscription) || body.data)) || {};

    const statusRaw = String(sub.status || body.status || body.subscription_status || '').toLowerCase();
    const periodEndRaw = sub.current_period_end || body.current_period_end || body.period_end || null;

    const planName = (sub.plan && sub.plan.name) ||
                     (body.plan && body.plan.name) ||
                     (body.product && body.product.name) ||
                     body.plan_name || '';

    const now = Date.now();
    const expiresAt = periodEndRaw ? Date.parse(periodEndRaw) : null;

    let active = (statusRaw === 'active' || statusRaw === 'trialing' || statusRaw === 'paid') &&
                 (!expiresAt || expiresAt > now);

    const negativeEvents = new Set([
      'subscription.canceled','subscription.cancelled','subscription.expired',
      'charge.refunded','purchase.refunded','refund.created'
    ]);
    if (negativeEvents.has(eventType)) active = false;

    const { getStore } = await import('@netlify/blobs');
    const store = getStore('kiwify_subscriptions');
    const record = {
      email,
      active,
      status: statusRaw || null,
      plan: planName || null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      lastEvent: eventType || null,
      updatedAt: new Date().toISOString()
    };

    await store.set(email, JSON.stringify(record));

    return make(200, { ok: true });
  } catch (err) {
    return make(500, { error: 'Internal Error', detail: String(err && err.message || err) });
  }
};