/**
 * netlify/functions/webhook-receiver.js
 * Empfängt Webhooks von Calendly, Stripe und Digistore24.
 * Validiert, prüft auf Duplikate (Idempotency) und schreibt in Supabase.
 *
 * Env-Variablen (Netlify Dashboard → Site settings → Environment variables):
 *   SUPABASE_URL          — z.B. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — Service Role Key (hat RLS bypass)
 *   STRIPE_WEBHOOK_SECRET — Signing Secret aus Stripe Dashboard
 *   DIGISTORE24_API_KEY   — Wird für SHA1-Hash-Validierung verwendet
 */

import crypto from 'crypto';

// ─── ENV-VALIDIERUNG ───────────────────────────────────────────────────────

function requireEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Umgebungsvariable ${name} ist nicht gesetzt`);
  return val;
}

// ─── SUPABASE REST HELPER ──────────────────────────────────────────────────

async function supabaseRequest(path, method = 'GET', body = null) {
  const SUPABASE_URL = requireEnv('SUPABASE_URL');
  const SUPABASE_SERVICE_KEY = requireEnv('SUPABASE_SERVICE_KEY');

  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const options = {
    method,
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer':        method === 'POST' ? 'return=representation' : 'return=minimal',
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${method} ${path} → ${res.status}: ${text}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── IDEMPOTENCY CHECK ────────────────────────────────────────────────────

/**
 * Gibt true zurück wenn der idempotency_key bereits verarbeitet wurde.
 */
async function isDuplicate(idempotencyKey) {
  const rows = await supabaseRequest(
    `/webhook_events?idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&select=id&limit=1`,
  );
  return Array.isArray(rows) && rows.length > 0;
}

// ─── EVENT SCHREIBEN ──────────────────────────────────────────────────────

async function writeWebhookEvent({ source, eventType, payload, idempotencyKey }) {
  await supabaseRequest('/webhook_events', 'POST', {
    source,
    event_type:      eventType,
    payload:         payload,
    processed_at:    new Date().toISOString(),
    idempotency_key: idempotencyKey,
  });
}

// ─── ENTRIES UPDATEN ──────────────────────────────────────────────────────

/**
 * Ermittelt die aktuelle ISO-Woche im Format "2026-W23".
 */
function currentWeekPeriod() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Inkrementiert oder dekrementiert calls_booked für den ersten Partner (Calendly
 * liefert keinen Partner-Bezug — TODO: Event-Type-Name → Partner-Mapping).
 *
 * TODO: Calendly Event-Type-Name → Partner-ID Mapping implementieren,
 *       sobald die Zuordnung in der Datenbank gepflegt wird.
 */
async function updateCallsBooked(delta, partnerId = null) {
  const period = currentWeekPeriod();

  if (!partnerId) {
    // Fallback: ersten Partner nehmen (nur sinnvoll für Single-Partner-Setup)
    // TODO: Anhand des Calendly Event-Type-Namens den richtigen Partner ermitteln
    const partners = await supabaseRequest('/partners?select=id&limit=1');
    if (!partners?.length) {
      console.warn('webhook-receiver: Kein Partner in Supabase gefunden, skip calls_booked Update');
      return;
    }
    partnerId = partners[0].id;
  }

  // Bestehenden Eintrag für diese Woche suchen
  const entries = await supabaseRequest(
    `/entries?partner_id=eq.${partnerId}&period=eq.${encodeURIComponent(period)}&period_type=eq.week&select=id,calls_booked&limit=1`,
  );

  if (entries?.length) {
    // Update
    const current = entries[0].calls_booked || 0;
    const newVal  = Math.max(0, current + delta); // Minimum 0
    await supabaseRequest(
      `/entries?id=eq.${entries[0].id}`,
      'PATCH',
      { calls_booked: newVal },
    );
  } else {
    // Neuer Eintrag für diese Woche
    if (delta > 0) {
      await supabaseRequest('/entries', 'POST', {
        partner_id:   partnerId,
        period:       period,
        period_type:  'week',
        calls_booked: Math.max(0, delta),
      });
    }
    // Bei delta < 0 ohne bestehenden Eintrag: nichts tun
  }
}

/**
 * Fügt einen Abschluss + Umsatz hinzu.
 * partnerId ist optional — TODO: Stripe-Metadata → Partner-Mapping.
 */
async function addClose({ revenue, commission = 0, partnerId = null }) {
  const period = currentWeekPeriod();

  if (!partnerId) {
    // TODO: Stripe/Digistore24 Metadata für Partner-Zuordnung nutzen
    const partners = await supabaseRequest('/partners?select=id&limit=1');
    if (!partners?.length) {
      console.warn('webhook-receiver: Kein Partner gefunden, skip addClose');
      return;
    }
    partnerId = partners[0].id;
  }

  const entries = await supabaseRequest(
    `/entries?partner_id=eq.${partnerId}&period=eq.${encodeURIComponent(period)}&period_type=eq.week&select=id,closes,revenue,commission&limit=1`,
  );

  if (entries?.length) {
    const e = entries[0];
    await supabaseRequest(
      `/entries?id=eq.${e.id}`,
      'PATCH',
      {
        closes:     (e.closes     || 0) + 1,
        revenue:    (e.revenue    || 0) + revenue,
        commission: (e.commission || 0) + commission,
      },
    );
  } else {
    await supabaseRequest('/entries', 'POST', {
      partner_id:  partnerId,
      period:      period,
      period_type: 'week',
      closes:      1,
      revenue:     revenue,
      commission:  commission,
    });
  }
}

// ─── STRIPE SIGNATUR-VALIDIERUNG ──────────────────────────────────────────

/**
 * Validiert die Stripe-Webhook-Signatur via HMAC-SHA256.
 * Gibt true zurück wenn gültig.
 *
 * Docs: https://stripe.com/docs/webhooks/signatures
 */
function validateStripeSignature(rawBody, signatureHeader) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // TODO: STRIPE_WEBHOOK_SECRET in Netlify setzen und Zeile unten entfernen
    console.warn('webhook-receiver: STRIPE_WEBHOOK_SECRET nicht gesetzt — Signatur wird nicht geprüft');
    return true; // In Produktion: return false
  }

  try {
    const parts     = signatureHeader.split(',');
    const tsPart    = parts.find(p => p.startsWith('t='));
    const v1Part    = parts.find(p => p.startsWith('v1='));
    if (!tsPart || !v1Part) return false;

    const timestamp = tsPart.slice(2);
    const expected  = v1Part.slice(3);

    const signedPayload = `${timestamp}.${rawBody}`;
    const hmac = crypto.createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    // Timing-safe Vergleich
    const a = Buffer.from(hmac, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ─── DIGISTORE24 HASH-VALIDIERUNG ────────────────────────────────────────

/**
 * Validiert den Digistore24 IPN-Hash via SHA1.
 * Das Signing-Schema: SHA1(api_key + order_id + event + product_id)
 *
 * TODO: Digistore24-Dokumentation für den genauen Hash-String prüfen.
 *       Das Schema kann je nach Produkt-Konfiguration abweichen.
 */
function validateDigistore24Signature(params) {
  const apiKey = process.env.DIGISTORE24_API_KEY;
  if (!apiKey) {
    // TODO: DIGISTORE24_API_KEY in Netlify setzen
    console.warn('webhook-receiver: DIGISTORE24_API_KEY nicht gesetzt — Hash wird nicht geprüft');
    return true; // In Produktion: return false
  }

  if (!params.sha_sign) return false;

  try {
    // Digistore24 Standard-Hash: SHA1(api_key + passphrase + order_id)
    const signString = apiKey + (params.order_id || '');
    const expected   = crypto.createHash('sha1').update(signString, 'utf8').digest('hex');

    // Timing-safe Vergleich
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(params.sha_sign.toLowerCase(), 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ─── PAYLOAD-PARSING ──────────────────────────────────────────────────────

function detectSource(event) {
  const src = event.headers?.['x-webhook-source'] || event.headers?.['X-Webhook-Source'] || '';
  if (src.toLowerCase().includes('calendly')) return 'calendly';
  if (src.toLowerCase().includes('stripe'))   return 'stripe';
  if (src.toLowerCase().includes('digistore')) return 'digistore24';

  // Auto-Detection anhand des Stripe-Headers
  if (event.headers?.['stripe-signature'] || event.headers?.['Stripe-Signature']) return 'stripe';

  // Auto-Detection anhand des Content-Type / Payload-Struktur
  const ct = event.headers?.['content-type'] || '';
  if (ct.includes('application/x-www-form-urlencoded')) {
    // Digistore24 sendet als Form-Encoded
    return 'digistore24';
  }

  // Versuche JSON zu parsen und Quelle zu erkennen
  try {
    const body = JSON.parse(event.body || '{}');
    if (body.event && body.payload && typeof body.event === 'string' && body.event.startsWith('invitee')) {
      return 'calendly';
    }
    if (body.type && body.data?.object && typeof body.type === 'string') {
      return 'stripe';
    }
    if (body.order_id) return 'digistore24';
  } catch {
    // Body ist kein JSON — vermutlich Form-encoded (Digistore24)
    return 'digistore24';
  }

  return null;
}

function parseFormEncoded(body) {
  const params = {};
  if (!body) return params;
  for (const part of body.split('&')) {
    const [key, val] = part.split('=').map(decodeURIComponent);
    params[key] = val;
  }
  return params;
}

// ─── HANDLER ──────────────────────────────────────────────────────────────

export const handler = async (event) => {
  // Nur POST erlauben
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Env-Check beim Start — früh fehlschlagen wenn Supabase nicht konfiguriert
  try {
    requireEnv('SUPABASE_URL');
    requireEnv('SUPABASE_SERVICE_KEY');
  } catch (err) {
    console.error('webhook-receiver: Fehlende Env-Variable:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }

  const source = detectSource(event);
  if (!source) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Webhook-Quelle konnte nicht erkannt werden' }) };
  }

  try {
    // ── CALENDLY ─────────────────────────────────────────────────
    if (source === 'calendly') {
      // TODO: Calendly Signing Secret prüfen wenn auf Standard/Pro-Plan
      // Anleitung: https://developer.calendly.com/api-docs/ZG9jOjM2MzE3MDM3-webhook-signatures
      // IP-Whitelist via CF-Connecting-IP Header: https://help.calendly.com/hc/en-us/articles/360046919593
      // Die Calendly IPs: 52.6.106.68, 52.20.241.221, 3.82.200.110

      let payload;
      try {
        payload = JSON.parse(event.body || '{}');
      } catch {
        return { statusCode: 400, body: JSON.stringify({ error: 'Ungültiger JSON-Body' }) };
      }

      if (!payload.event || !payload.payload) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Ungültiges Calendly-Payload' }) };
      }

      // Idempotency Key = UUID des Calendly Events
      const eventUUID = payload.payload?.event?.uuid || payload.payload?.invitee?.uuid;
      if (!eventUUID) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Calendly Event-UUID fehlt' }) };
      }

      const idempotencyKey = `calendly_${eventUUID}`;

      if (await isDuplicate(idempotencyKey)) {
        console.log(`webhook-receiver: Duplikat ignoriert: ${idempotencyKey}`);
        return { statusCode: 200, body: JSON.stringify({ ok: true, duplicate: true }) };
      }

      await writeWebhookEvent({
        source:         'calendly',
        eventType:      payload.event,
        payload:        payload,
        idempotencyKey: idempotencyKey,
      });

      if (payload.event === 'invitee.created') {
        await updateCallsBooked(+1);
      } else if (payload.event === 'invitee.canceled') {
        await updateCallsBooked(-1);
      }
      // TODO: invitee_no_show → callsShown - 1

      return { statusCode: 200, body: JSON.stringify({ ok: true, source: 'calendly', event: payload.event }) };
    }

    // ── STRIPE ───────────────────────────────────────────────────
    if (source === 'stripe') {
      const sigHeader = event.headers?.['stripe-signature'] || event.headers?.['Stripe-Signature'] || '';

      if (!validateStripeSignature(event.body, sigHeader)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Ungültige Stripe-Signatur' }) };
      }

      let payload;
      try {
        payload = JSON.parse(event.body || '{}');
      } catch {
        return { statusCode: 400, body: JSON.stringify({ error: 'Ungültiger JSON-Body' }) };
      }

      if (!payload.type || !payload.data?.object) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Ungültiges Stripe-Payload' }) };
      }

      const idempotencyKey = `stripe_${payload.id}`;

      if (await isDuplicate(idempotencyKey)) {
        console.log(`webhook-receiver: Duplikat ignoriert: ${idempotencyKey}`);
        return { statusCode: 200, body: JSON.stringify({ ok: true, duplicate: true }) };
      }

      await writeWebhookEvent({
        source:         'stripe',
        eventType:      payload.type,
        payload:        payload,
        idempotencyKey: idempotencyKey,
      });

      if (payload.type === 'payment_intent.succeeded') {
        const obj    = payload.data.object;
        const amount = (obj.amount_received || obj.amount || 0) / 100;
        await addClose({ revenue: amount });
      }
      // TODO: charge.refunded → closes - 1, revenue - Betrag

      return { statusCode: 200, body: JSON.stringify({ ok: true, source: 'stripe', event: payload.type }) };
    }

    // ── DIGISTORE24 ──────────────────────────────────────────────
    if (source === 'digistore24') {
      let params;
      const ct = event.headers?.['content-type'] || '';

      if (ct.includes('application/x-www-form-urlencoded')) {
        params = parseFormEncoded(event.body);
      } else {
        try {
          params = JSON.parse(event.body || '{}');
        } catch {
          params = parseFormEncoded(event.body);
        }
      }

      if (!params.order_id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Digistore24: order_id fehlt' }) };
      }

      if (!validateDigistore24Signature(params)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Ungültige Digistore24-Signatur' }) };
      }

      const idempotencyKey = `digistore24_${params.order_id}_${params.event || 'unknown'}`;

      if (await isDuplicate(idempotencyKey)) {
        console.log(`webhook-receiver: Duplikat ignoriert: ${idempotencyKey}`);
        return { statusCode: 200, body: JSON.stringify({ ok: true, duplicate: true }) };
      }

      await writeWebhookEvent({
        source:         'digistore24',
        eventType:      params.event || 'unknown',
        payload:        params,
        idempotencyKey: idempotencyKey,
      });

      const eventType      = params.event || '';
      const isAffiliate    = !!params.affiliate;
      const grossRevenue   = parseFloat(params.order_gross || 0);
      const commission     = isAffiliate ? parseFloat(params.affiliate_earning || 0) : 0;

      if (eventType === 'order_completed' || eventType === 'payment_successful') {
        await addClose({ revenue: grossRevenue, commission });
      }
      // TODO: order_refunded → closes - 1, revenue - Betrag

      return { statusCode: 200, body: JSON.stringify({ ok: true, source: 'digistore24', event: eventType }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Unbekannte Webhook-Quelle' }) };

  } catch (err) {
    console.error('webhook-receiver Fehler:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Interner Server-Fehler', detail: err.message }) };
  }
};
