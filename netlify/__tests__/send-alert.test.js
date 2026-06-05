/**
 * Tests für netlify/functions/send-alert.js
 * Ausführen: npm test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Modul-Import nach jedem Test zurücksetzen um In-Memory-State zu isolieren
let handlerModule;

const mockFetch = vi.fn();

beforeEach(async () => {
  vi.stubGlobal('fetch', mockFetch);
  vi.resetModules();
  handlerModule = await import('../functions/send-alert.js');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
});

// Helper: Standard-gültige POST-Anfrage
function buildEvent(overrides = {}) {
  return {
    httpMethod: 'POST',
    body: JSON.stringify({
      partnerName: 'TestPartner GmbH',
      period: 'KW 22 / 2025',
      alerts: [
        { level: 'crit', title: 'Close Rate kritisch: 12%', desc: 'Ziel >25%. Sofortmaßnahme.' },
        { level: 'warn', title: 'ROI unter Breakeven: -5%', desc: 'Kampagnen prüfen.' },
      ],
      recipientEmail: 'daniel@realrise.de',
      ...overrides,
    }),
    ...overrides._event,
  };
}

describe('send-alert Netlify Function', () => {

  it('sendet korrekte Resend-API-Payload bei gültiger Anfrage', async () => {
    process.env.RESEND_API_KEY = 'test-key-123';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'email-id-abc' }),
    });

    const result = await handlerModule.handler(buildEvent());

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toMatchObject({ success: true, id: 'email-id-abc' });

    // Fetch wurde mit korrekten Parametern aufgerufen
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(options.method).toBe('POST');
    expect(options.headers['Authorization']).toBe('Bearer test-key-123');
    expect(options.headers['Content-Type']).toBe('application/json');

    const sentPayload = JSON.parse(options.body);
    expect(sentPayload.to).toContain('daniel@realrise.de');
    expect(sentPayload.subject).toContain('TestPartner GmbH');
    expect(sentPayload.subject).toContain('1 kritische');
    expect(sentPayload.html).toBeTruthy();
  });

  it('gibt 500 zurück wenn RESEND_API_KEY fehlt', async () => {
    // RESEND_API_KEY absichtlich nicht gesetzt
    const result = await handlerModule.handler(buildEvent());

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toMatch(/RESEND_API_KEY/);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('gibt 400 zurück bei leerem alerts-Array', async () => {
    process.env.RESEND_API_KEY = 'test-key-123';

    const result = await handlerModule.handler(buildEvent({ alerts: [] }));

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toMatch(/alerts/);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('gibt 400 zurück bei ungültiger E-Mail-Adresse', async () => {
    process.env.RESEND_API_KEY = 'test-key-123';

    const cases = ['not-an-email', '', 'missing@', '@domain.com'];
    for (const recipientEmail of cases) {
      const result = await handlerModule.handler(buildEvent({ recipientEmail }));
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toMatch(/E-Mail/i);
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('behandelt Resend-API-Fehler korrekt (gibt 502 zurück)', async () => {
    process.env.RESEND_API_KEY = 'test-key-invalid';
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid API key', statusCode: 401 }),
    });

    const result = await handlerModule.handler(buildEvent());

    expect(result.statusCode).toBe(502);
    const body = JSON.parse(result.body);
    expect(body.error).toMatch(/fehlgeschlagen/);
    expect(body.details).toBeDefined();
  });

  it('behandelt Netzwerkfehler beim fetch korrekt (gibt 502 zurück)', async () => {
    process.env.RESEND_API_KEY = 'test-key-123';
    mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

    const result = await handlerModule.handler(buildEvent());

    expect(result.statusCode).toBe(502);
    expect(JSON.parse(result.body).error).toMatch(/Netzwerkfehler/);
  });

  it('HTML-Template enthält Partner-Name und Alert-Titel', async () => {
    process.env.RESEND_API_KEY = 'test-key-123';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'email-xyz' }),
    });

    await handlerModule.handler(buildEvent());

    const [, options] = mockFetch.mock.calls[0];
    const sentPayload = JSON.parse(options.body);
    const html = sentPayload.html;

    expect(html).toContain('TestPartner GmbH');
    expect(html).toContain('Close Rate kritisch: 12%');
    expect(html).toContain('KW 22 / 2025');
    expect(html).toContain('KRITISCH');
    expect(html).toContain('WARNUNG');
    expect(html).toContain('#EF4444'); // Rot für kritisch
    expect(html).toContain('#F59E0B'); // Gelb für Warnung
  });

  it('gibt 405 zurück bei nicht-POST-Anfragen', async () => {
    process.env.RESEND_API_KEY = 'test-key-123';

    const result = await handlerModule.handler({ httpMethod: 'GET', body: null });

    expect(result.statusCode).toBe(405);
  });

});
