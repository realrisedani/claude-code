/**
 * netlify/functions/webhook-receiver.test.js
 * Vitest-Tests für den Webhook Receiver.
 *
 * Ausführen: npm test
 *
 * Strategie: fetch und process.env werden gemockt,
 * sodass kein echtes Supabase / Internet benötigt wird.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── MOCKS ────────────────────────────────────────────────────────────────

// fetch global mocken
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

// ─── HELPER ───────────────────────────────────────────────────────────────

function makeEvent(overrides = {}) {
  return {
    httpMethod:  'POST',
    headers:     { 'content-type': 'application/json' },
    body:        '{}',
    ...overrides,
  };
}

function mockSupabase({
  duplicateCheck = false, // true = Event ist Duplikat
  writeOk        = true,
  updateOk       = true,
  partnersResult = [{ id: 'partner-uuid-1' }],
  entriesResult  = [],
} = {}) {
  fetchMock.mockImplementation(async (url, opts) => {
    // Idempotency Check (GET webhook_events)
    if (url.includes('/webhook_events?idempotency_key')) {
      return {
        ok:   true,
        text: async () => JSON.stringify(duplicateCheck ? [{ id: 'existing' }] : []),
      };
    }
    // Write webhook_events (POST)
    if (url.includes('/webhook_events') && opts?.method === 'POST') {
      return { ok: writeOk, text: async () => JSON.stringify([{ id: 'new-event-id' }]) };
    }
    // Partner lookup
    if (url.includes('/partners?')) {
      return { ok: true, text: async () => JSON.stringify(partnersResult) };
    }
    // Entries lookup
    if (url.includes('/entries?partner_id')) {
      return { ok: true, text: async () => JSON.stringify(entriesResult) };
    }
    // Entries PATCH / POST
    if (url.includes('/entries')) {
      return { ok: updateOk, text: async () => '{}' };
    }
    // Fallback
    return { ok: false, text: async () => 'Unbekannte URL: ' + url };
  });
}

// ─── SETUP ────────────────────────────────────────────────────────────────

let handler;

beforeEach(async () => {
  // Env-Variablen setzen
  process.env.SUPABASE_URL         = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
  // Kein STRIPE_WEBHOOK_SECRET gesetzt → Signatur-Check wird übersprungen (warn)
  // Kein DIGISTORE24_API_KEY gesetzt → Hash-Check wird übersprungen (warn)

  // Modul dynamisch importieren (jedes Mal frisch wegen ESM-Cache)
  const mod = await import('../functions/webhook-receiver.js?t=' + Date.now());
  handler = mod.handler;

  fetchMock.mockReset();
});

afterEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.DIGISTORE24_API_KEY;
  vi.clearAllMocks();
});

// ─── CALENDLY TESTS ───────────────────────────────────────────────────────

describe('Calendly Webhook — Buchung (invitee.created)', () => {
  const bookingBody = JSON.stringify({
    event:   'invitee.created',
    payload: {
      invitee:    { name: 'Max Müller', email: 'max@test.de', uuid: 'inv-uuid-001' },
      event:      { uuid: 'evt-uuid-001', start_time: '2026-06-10T14:00:00Z', end_time: '2026-06-10T14:30:00Z' },
      event_type: { name: 'Erstgespräch 30 Min' },
    },
  });

  it('verarbeitet Calendly Buchung und gibt 200 zurück', async () => {
    mockSupabase();
    const res = await handler(makeEvent({
      headers: { 'content-type': 'application/json', 'x-webhook-source': 'calendly' },
      body:    bookingBody,
    }));
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.ok).toBe(true);
    expect(data.source).toBe('calendly');
    expect(data.event).toBe('invitee.created');
  });

  it('schreibt in webhook_events (POST zu Supabase)', async () => {
    mockSupabase();
    await handler(makeEvent({
      headers: { 'content-type': 'application/json', 'x-webhook-source': 'calendly' },
      body:    bookingBody,
    }));
    const postCalls = fetchMock.mock.calls.filter(
      ([url, opts]) => url.includes('/webhook_events') && opts?.method === 'POST',
    );
    expect(postCalls.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Calendly Webhook — Absage (invitee.canceled)', () => {
  const cancelBody = JSON.stringify({
    event:   'invitee.canceled',
    payload: {
      invitee:    { name: 'Max Müller', email: 'max@test.de', uuid: 'inv-uuid-002' },
      event:      { uuid: 'evt-uuid-002', start_time: '2026-06-11T10:00:00Z', end_time: '2026-06-11T10:30:00Z' },
      event_type: { name: 'Erstgespräch 30 Min' },
    },
  });

  it('verarbeitet Calendly Absage und gibt 200 zurück', async () => {
    mockSupabase({ entriesResult: [{ id: 'entry-1', calls_booked: 5 }] });
    const res = await handler(makeEvent({
      headers: { 'content-type': 'application/json', 'x-webhook-source': 'calendly' },
      body:    cancelBody,
    }));
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.ok).toBe(true);
    expect(data.event).toBe('invitee.canceled');
  });

  it('sendet PATCH mit dekrementiertem calls_booked', async () => {
    mockSupabase({ entriesResult: [{ id: 'entry-1', calls_booked: 3 }] });
    await handler(makeEvent({
      headers: { 'content-type': 'application/json', 'x-webhook-source': 'calendly' },
      body:    cancelBody,
    }));
    const patchCalls = fetchMock.mock.calls.filter(
      ([url, opts]) => url.includes('/entries?id=') && opts?.method === 'PATCH',
    );
    expect(patchCalls.length).toBeGreaterThanOrEqual(1);
    const patchBody = JSON.parse(patchCalls[0][1].body);
    expect(patchBody.calls_booked).toBe(2); // 3 - 1 = 2
  });
});

// ─── STRIPE TESTS ─────────────────────────────────────────────────────────

describe('Stripe Webhook — Zahlung (payment_intent.succeeded)', () => {
  const stripeBody = JSON.stringify({
    id:   'evt_stripe_001',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id:              'pi_test_001',
        amount_received: 149700, // 1497 EUR
        currency:        'eur',
        receipt_email:   'kunde@test.de',
      },
    },
  });

  it('verarbeitet Stripe-Zahlung und gibt 200 zurück', async () => {
    mockSupabase();
    const res = await handler(makeEvent({
      headers: {
        'content-type':     'application/json',
        'stripe-signature': 't=123,v1=abc', // Fake-Sig — kein Secret gesetzt, wird übersprungen
      },
      body: stripeBody,
    }));
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.ok).toBe(true);
    expect(data.source).toBe('stripe');
  });

  it('schreibt Event in webhook_events', async () => {
    mockSupabase();
    await handler(makeEvent({
      headers: { 'content-type': 'application/json', 'stripe-signature': 't=1,v1=x' },
      body:    stripeBody,
    }));
    const postCalls = fetchMock.mock.calls.filter(
      ([url, opts]) => url.includes('/webhook_events') && opts?.method === 'POST',
    );
    expect(postCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('inkrementiert closes und revenue für den Partner', async () => {
    mockSupabase({ entriesResult: [{ id: 'entry-1', closes: 2, revenue: 2994, commission: 0 }] });
    await handler(makeEvent({
      headers: { 'content-type': 'application/json', 'stripe-signature': 't=1,v1=x' },
      body:    stripeBody,
    }));
    const patchCalls = fetchMock.mock.calls.filter(
      ([url, opts]) => url.includes('/entries?id=') && opts?.method === 'PATCH',
    );
    expect(patchCalls.length).toBeGreaterThanOrEqual(1);
    const body = JSON.parse(patchCalls[0][1].body);
    expect(body.closes).toBe(3);
    expect(body.revenue).toBeCloseTo(4491, 0); // 2994 + 1497
  });
});

// ─── IDEMPOTENCY TESTS ────────────────────────────────────────────────────

describe('Idempotency — Duplikate werden ignoriert', () => {
  it('gibt 200 zurück wenn Calendly-Event bereits verarbeitet wurde', async () => {
    mockSupabase({ duplicateCheck: true });
    const body = JSON.stringify({
      event:   'invitee.created',
      payload: {
        invitee:    { uuid: 'dup-inv-001' },
        event:      { uuid: 'dup-evt-001' },
        event_type: { name: 'Test' },
      },
    });
    const res = await handler(makeEvent({
      headers: { 'content-type': 'application/json', 'x-webhook-source': 'calendly' },
      body,
    }));
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.duplicate).toBe(true);
  });

  it('schreibt nichts in Supabase bei Duplikat (kein POST zu webhook_events)', async () => {
    mockSupabase({ duplicateCheck: true });
    const body = JSON.stringify({
      event:   'invitee.created',
      payload: {
        invitee:    { uuid: 'dup-inv-002' },
        event:      { uuid: 'dup-evt-002' },
        event_type: { name: 'Test' },
      },
    });
    await handler(makeEvent({
      headers: { 'content-type': 'application/json', 'x-webhook-source': 'calendly' },
      body,
    }));
    const postCalls = fetchMock.mock.calls.filter(
      ([url, opts]) => url.includes('/webhook_events') && opts?.method === 'POST',
    );
    expect(postCalls.length).toBe(0);
  });
});

// ─── FEHLER-TESTS ─────────────────────────────────────────────────────────

describe('Fehlerbehandlung', () => {
  it('gibt 400 zurück bei ungültigem JSON-Body (Calendly)', async () => {
    mockSupabase();
    const res = await handler(makeEvent({
      headers: { 'content-type': 'application/json', 'x-webhook-source': 'calendly' },
      body:    'kein-json!',
    }));
    expect(res.statusCode).toBe(400);
  });

  it('gibt 400 zurück bei leerem Calendly-Payload (fehlende Pflichtfelder)', async () => {
    mockSupabase();
    const res = await handler(makeEvent({
      headers: { 'content-type': 'application/json', 'x-webhook-source': 'calendly' },
      body:    JSON.stringify({ event: 'invitee.created' }), // payload fehlt
    }));
    expect(res.statusCode).toBe(400);
  });

  it('gibt 400 zurück wenn Digistore24 order_id fehlt', async () => {
    mockSupabase();
    const res = await handler(makeEvent({
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-webhook-source': 'digistore24' },
      body:    'event=order_completed&product_name=Test',
    }));
    expect(res.statusCode).toBe(400);
    const data = JSON.parse(res.body);
    expect(data.error).toMatch(/order_id/i);
  });

  it('gibt 405 zurück bei GET-Request', async () => {
    const res = await handler(makeEvent({ httpMethod: 'GET' }));
    expect(res.statusCode).toBe(405);
  });

  it('gibt 500 zurück wenn SUPABASE_URL nicht gesetzt', async () => {
    delete process.env.SUPABASE_URL;
    const res = await handler(makeEvent({
      headers: { 'content-type': 'application/json', 'x-webhook-source': 'calendly' },
      body:    JSON.stringify({ event: 'invitee.created', payload: {} }),
    }));
    expect(res.statusCode).toBe(500);
    const data = JSON.parse(res.body);
    expect(data.error).toMatch(/SUPABASE_URL/);
  });

  it('gibt 500 zurück wenn SUPABASE_SERVICE_KEY nicht gesetzt', async () => {
    delete process.env.SUPABASE_SERVICE_KEY;
    const res = await handler(makeEvent({
      headers: { 'content-type': 'application/json', 'x-webhook-source': 'calendly' },
      body:    JSON.stringify({ event: 'invitee.created', payload: {} }),
    }));
    expect(res.statusCode).toBe(500);
    const data = JSON.parse(res.body);
    expect(data.error).toMatch(/SUPABASE_SERVICE_KEY/);
  });
});

// ─── DIGISTORE24 TESTS ────────────────────────────────────────────────────

describe('Digistore24 Webhook — Verkauf (order_completed)', () => {
  const ds24Body = 'order_id=DS-789&event=order_completed&product_name=Masterkurs&order_gross=997.00&buyer_email=kunde%40test.de&affiliate=&affiliate_earning=0';

  it('verarbeitet Digistore24-Verkauf und gibt 200 zurück', async () => {
    mockSupabase();
    const res = await handler(makeEvent({
      headers: {
        'content-type':   'application/x-www-form-urlencoded',
        'x-webhook-source': 'digistore24',
      },
      body: ds24Body,
    }));
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.ok).toBe(true);
    expect(data.source).toBe('digistore24');
  });
});
