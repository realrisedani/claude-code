/**
 * kpi-logic.test.js — TDD Test-Suite für das KPI Dashboard
 *
 * Struktur: Red → Green → Refactor
 * - Bestehende Funktionen: Tests müssen GRÜN sein
 * - Neue Features (Webhooks, Merge, Validierung): Tests starten ROT → werden grün nach Implementierung
 *
 * Ausführen: npm test
 */

import { describe, it, expect } from 'vitest';
import {
  fmt, fmtEur, esc, toSlug, getISOWeek, latestEntry,
  calcCloseRate, calcShowRate, calcCTR, calcOptinRate, calcROI,
  calcCPL, calcCostPerClose, calcRevPerLead, calcTrendPercent,
  closeRateClass, benchmarkStatus,
  DEFAULT_BENCHMARKS, mergeBenchmarks,
  validateEntry,
  parseCalendlyEvent, parseStripeEvent, parseDigistore24IPN,
  mergePartnerData, slugIsUnique,
  calcDelta,
} from './kpi-logic.js';

// ─── FORMATIERUNG ──────────────────────────────────────────────

describe('fmt — Zahlenformatierung', () => {
  it('formatiert 1000 als "1.000" (de-DE)', () => {
    expect(fmt(1000)).toBe('1.000');
  });
  it('formatiert 0 als "0"', () => {
    expect(fmt(0)).toBe('0');
  });
  it('gibt "–" für null zurück', () => {
    expect(fmt(null)).toBe('–');
  });
  it('gibt "–" für undefined zurück', () => {
    expect(fmt(undefined)).toBe('–');
  });
  it('formatiert 1234567 korrekt', () => {
    expect(fmt(1234567)).toBe('1.234.567');
  });
});

describe('fmtEur — Euro-Formatierung', () => {
  it('formatiert 8400 als "€8.400"', () => {
    expect(fmtEur(8400)).toBe('€8.400');
  });
  it('formatiert 0 als "€0"', () => {
    expect(fmtEur(0)).toBe('€0');
  });
  it('gibt "–" für null zurück', () => {
    expect(fmtEur(null)).toBe('–');
  });
  it('formatiert negative Werte korrekt', () => {
    expect(fmtEur(-500)).toBe('€-500');
  });
});

describe('esc — HTML-Escaping', () => {
  it('escaped <script>-Tags', () => {
    expect(esc('<script>')).toBe('&lt;script&gt;');
  });
  it('escaped & korrekt', () => {
    expect(esc('Max & Müller')).toBe('Max &amp; Müller');
  });
  it('escaped Anführungszeichen', () => {
    expect(esc('"hallo"')).toBe('&quot;hallo&quot;');
  });
  it('gibt leeren String für null zurück', () => {
    expect(esc(null)).toBe('');
  });
  it('lässt normale Strings unverändert', () => {
    expect(esc('Max Müller')).toBe('Max Müller');
  });
});

describe('toSlug — URL-Slug-Generierung', () => {
  it('wandelt Leerzeichen in Bindestriche um', () => {
    expect(toSlug('Max Müller')).toBe('max-mueller');
  });
  it('konvertiert ä → ae, ö → oe, ü → ue, ß → ss', () => {
    expect(toSlug('Jörg Weiß')).toBe('joerg-weiss');
  });
  it('macht alles lowercase', () => {
    expect(toSlug('ANNA SCHMIDT')).toBe('anna-schmidt');
  });
  it('entfernt Sonderzeichen (außer Bindestriche)', () => {
    expect(toSlug('Max (Test)')).toBe('max-test');
  });
  it('mehrere Leerzeichen werden zu einem Bindestrich', () => {
    expect(toSlug('Max   Müller')).toBe('max-mueller');
  });
});

// ─── DATUM ─────────────────────────────────────────────────────

describe('getISOWeek — ISO-Kalenderwoche', () => {
  it('liefert Woche 1 für den 01.01.2024', () => {
    expect(getISOWeek(new Date(2024, 0, 1))).toBe(1);
  });
  it('liefert Woche 23 für den 03.06.2026', () => {
    expect(getISOWeek(new Date(2026, 5, 3))).toBe(23);
  });
  it('31.12.2024 liegt in KW 1 von 2025 (ISO-Norm: Donnerstag der Woche bestimmt das Jahr)', () => {
    // Der Donnerstag der Woche von 31.12.2024 (Dienstag) ist der 02.01.2025 → KW1/2025
    expect(getISOWeek(new Date(2024, 11, 31))).toBe(1);
  });
});

// ─── DATEN-ZUGRIFF ─────────────────────────────────────────────

describe('latestEntry — letzter Eintrag', () => {
  it('gibt den letzten Eintrag zurück', () => {
    const partner = { entries: [{ period: 'W21' }, { period: 'W22' }, { period: 'W23' }] };
    expect(latestEntry(partner).period).toBe('W23');
  });
  it('gibt null zurück wenn keine Einträge', () => {
    expect(latestEntry({ entries: [] })).toBeNull();
  });
  it('gibt null zurück wenn partner null ist', () => {
    expect(latestEntry(null)).toBeNull();
  });
  it('gibt null zurück wenn entries undefined', () => {
    expect(latestEntry({ name: 'Test' })).toBeNull();
  });
});

// ─── KPI-BERECHNUNGEN ──────────────────────────────────────────

describe('calcCloseRate — Close Rate', () => {
  it('berechnet 34.1% korrekt (14/41)', () => {
    const e = { closes: 14, callsShown: 41 };
    expect(calcCloseRate(e)).toBeCloseTo(34.14, 1);
  });
  it('gibt null zurück wenn callsShown = 0', () => {
    expect(calcCloseRate({ closes: 5, callsShown: 0 })).toBeNull();
  });
  it('gibt null zurück wenn Entry null', () => {
    expect(calcCloseRate(null)).toBeNull();
  });
  it('gibt 0% zurück wenn keine Abschlüsse', () => {
    expect(calcCloseRate({ closes: 0, callsShown: 10 })).toBe(0);
  });
  it('kann nicht über 100% sein (Validierung)', () => {
    const rate = calcCloseRate({ closes: 12, callsShown: 10 });
    // Berechnung liefert 120% — Validierung soll das flaggen (validateEntry)
    expect(rate).toBe(120);
  });
});

describe('calcShowRate — Show-Rate', () => {
  it('berechnet 80% korrekt (40/50)', () => {
    expect(calcShowRate({ callsShown: 40, callsBooked: 50 })).toBeCloseTo(80, 1);
  });
  it('gibt null zurück wenn callsBooked = 0', () => {
    expect(calcShowRate({ callsShown: 0, callsBooked: 0 })).toBeNull();
  });
});

describe('calcCTR — Click-Through-Rate', () => {
  it('berechnet 4.49% korrekt (1190/26500)', () => {
    expect(calcCTR({ clicks: 1190, reach: 26500 })).toBeCloseTo(4.49, 1);
  });
  it('gibt null zurück wenn reach = 0', () => {
    expect(calcCTR({ clicks: 10, reach: 0 })).toBeNull();
  });
});

describe('calcROI — Return on Investment', () => {
  it('berechnet 1876% korrekt ((16800-850)/850*100)', () => {
    expect(calcROI({ revenue: 16800, adSpend: 850 })).toBeCloseTo(1876.47, 0);
  });
  it('gibt null zurück wenn kein Ad-Spend', () => {
    expect(calcROI({ revenue: 5000, adSpend: 0 })).toBeNull();
  });
  it('gibt negativen ROI zurück wenn Verlust', () => {
    expect(calcROI({ revenue: 500, adSpend: 1000 })).toBe(-50);
  });
  it('gibt -100% zurück wenn Revenue = 0', () => {
    expect(calcROI({ revenue: 0, adSpend: 1000 })).toBe(-100);
  });
});

describe('calcCPL — Cost per Lead', () => {
  it('berechnet €6.16 korrekt (850/138)', () => {
    expect(calcCPL({ adSpend: 850, leads: 138 })).toBeCloseTo(6.16, 1);
  });
  it('gibt null zurück wenn leads = 0', () => {
    expect(calcCPL({ adSpend: 850, leads: 0 })).toBeNull();
  });
  it('gibt null zurück wenn kein Ad-Spend', () => {
    expect(calcCPL({ adSpend: 0, leads: 100 })).toBeNull();
  });
});

describe('calcTrendPercent — Trend-Berechnung', () => {
  it('berechnet +25% korrekt (100 → 125)', () => {
    expect(calcTrendPercent(125, 100)).toBe(25);
  });
  it('berechnet -20% korrekt (100 → 80)', () => {
    expect(calcTrendPercent(80, 100)).toBe(-20);
  });
  it('gibt null zurück wenn previous = 0', () => {
    expect(calcTrendPercent(100, 0)).toBeNull();
  });
  it('gibt null zurück wenn current null', () => {
    expect(calcTrendPercent(null, 100)).toBeNull();
  });
});

// ─── KLASSEN-LOGIK ─────────────────────────────────────────────

describe('closeRateClass — CSS-Klasse', () => {
  it('gibt "green" für >=30%', () => {
    expect(closeRateClass(30)).toBe('green');
    expect(closeRateClass(50)).toBe('green');
  });
  it('gibt "warn" für 15–29%', () => {
    expect(closeRateClass(20)).toBe('warn');
    expect(closeRateClass(15)).toBe('warn');
  });
  it('gibt "red" für <15%', () => {
    expect(closeRateClass(10)).toBe('red');
    expect(closeRateClass(0)).toBe('red');
  });
  it('gibt "muted" für null/NaN', () => {
    expect(closeRateClass(null)).toBe('muted');
    expect(closeRateClass(NaN)).toBe('muted');
  });
});

describe('benchmarkStatus — Alert-Level', () => {
  it('gibt "good" wenn Wert über warn-Schwelle liegt', () => {
    expect(benchmarkStatus(25, 20, 10)).toBe('good');
  });
  it('gibt "warn" wenn Wert zwischen crit und warn liegt', () => {
    expect(benchmarkStatus(15, 20, 10)).toBe('warn');
  });
  it('gibt "crit" wenn Wert unter crit-Schwelle liegt', () => {
    expect(benchmarkStatus(5, 20, 10)).toBe('crit');
  });
  it('gibt "neutral" wenn Wert null ist', () => {
    expect(benchmarkStatus(null, 20, 10)).toBe('neutral');
  });
});

// ─── BENCHMARKS ────────────────────────────────────────────────

describe('mergeBenchmarks — Defaults mit gespeicherten Werten', () => {
  it('gibt Default-Benchmarks zurück wenn nichts gespeichert', () => {
    const merged = mergeBenchmarks(null);
    expect(merged.closeWarn).toBe(DEFAULT_BENCHMARKS.closeWarn);
    expect(merged.showGood).toBe(DEFAULT_BENCHMARKS.showGood);
  });
  it('überschreibt nur geänderte Werte, behält Rest als Default', () => {
    const merged = mergeBenchmarks({ closeWarn: 25 });
    expect(merged.closeWarn).toBe(25);
    expect(merged.showWarn).toBe(DEFAULT_BENCHMARKS.showWarn);
  });
  it('komplett andere Werte funktionieren', () => {
    const custom = { closeWarn: 35, closeCrit: 15, closeGood: 50 };
    const merged = mergeBenchmarks(custom);
    expect(merged.closeWarn).toBe(35);
  });
});

// ─── ENTRY-VALIDIERUNG ─────────────────────────────────────────

describe('validateEntry — Dateneingabe-Validierung', () => {
  const validEntry = {
    period: '2026-W23', periodType: 'week',
    reach: 26500, clicks: 1190, leads: 138,
    callsBooked: 51, callsShown: 41, closes: 14,
    revenue: 16800, adSpend: 850, commission: 0,
  };

  it('gibt leeres Array für validen Eintrag zurück', () => {
    expect(validateEntry(validEntry)).toHaveLength(0);
  });
  it('meldet Fehler wenn Zeitraum fehlt', () => {
    const e = { ...validEntry, period: '' };
    expect(validateEntry(e)).toContain('Zeitraum fehlt');
  });
  it('meldet Fehler wenn Abschlüsse > Calls erschienen', () => {
    const e = { ...validEntry, closes: 50, callsShown: 41 };
    const errors = validateEntry(e);
    expect(errors.some(err => err.includes('Abschlüsse'))).toBe(true);
  });
  it('meldet Fehler wenn Leads > Klicks', () => {
    const e = { ...validEntry, leads: 2000, clicks: 1190 };
    const errors = validateEntry(e);
    expect(errors.some(err => err.includes('Leads'))).toBe(true);
  });
  it('meldet Fehler wenn Ad-Spend negativ', () => {
    const e = { ...validEntry, adSpend: -100 };
    expect(validateEntry(e)).toContain('Ad-Spend kann nicht negativ sein');
  });
  it('akzeptiert Revenue = 0 (kein Umsatz diese Woche)', () => {
    const e = { ...validEntry, revenue: 0 };
    expect(validateEntry(e)).toHaveLength(0);
  });
  it('gibt Fehler wenn entry null', () => {
    expect(validateEntry(null)).toContain('Kein Eintrag');
  });
});

// ─── WEBHOOK-PARSER ────────────────────────────────────────────
// RED: Diese Tests beschreiben die Ziel-Implementierung für Auto-Tracking

describe('parseCalendlyEvent — Calendly Webhook Parser', () => {
  const bookingPayload = {
    event: 'invitee.created',
    payload: {
      invitee: { name: 'Max Müller', email: 'max@beispiel.de' },
      event:   { start_time: '2026-06-10T14:00:00Z', end_time: '2026-06-10T14:30:00Z' },
      event_type: { name: 'Erstgespräch 30 Min' },
    },
  };

  it('erkennt eine neue Buchung (invitee.created)', () => {
    const result = parseCalendlyEvent(bookingPayload);
    expect(result.isBooking).toBe(true);
    expect(result.isCanceled).toBe(false);
  });
  it('extrahiert Name und E-Mail des Interessenten', () => {
    const result = parseCalendlyEvent(bookingPayload);
    expect(result.inviteeName).toBe('Max Müller');
    expect(result.inviteeEmail).toBe('max@beispiel.de');
  });
  it('extrahiert den Termin-Zeitpunkt', () => {
    const result = parseCalendlyEvent(bookingPayload);
    expect(result.startTime).toBe('2026-06-10T14:00:00Z');
  });
  it('erkennt eine Absage (invitee.canceled)', () => {
    const result = parseCalendlyEvent({ ...bookingPayload, event: 'invitee.canceled' });
    expect(result.isCanceled).toBe(true);
    expect(result.isBooking).toBe(false);
  });
  it('gibt Fehler bei ungültigem Payload zurück', () => {
    expect(parseCalendlyEvent(null).error).toBeDefined();
    expect(parseCalendlyEvent({}).error).toBeDefined();
  });
  it('gibt Fehler bei unbekanntem Event-Typ zurück', () => {
    const result = parseCalendlyEvent({ ...bookingPayload, event: 'routing_form.submitted' });
    expect(result.error).toBeDefined();
  });
});

describe('parseStripeEvent — Stripe Webhook Parser', () => {
  const successPayload = {
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_123',
        amount_received: 149700, // 1497 EUR in Cents
        currency: 'eur',
        receipt_email: 'kunde@beispiel.de',
      },
    },
  };

  it('erkennt einen erfolgreichen Kauf', () => {
    const result = parseStripeEvent(successPayload);
    expect(result.isClose).toBe(true);
    expect(result.isRefund).toBe(false);
  });
  it('konvertiert Cent in Euro korrekt (149700 → 1497)', () => {
    const result = parseStripeEvent(successPayload);
    expect(result.amount).toBe(1497);
  });
  it('extrahiert Kunden-E-Mail', () => {
    const result = parseStripeEvent(successPayload);
    expect(result.customerEmail).toBe('kunde@beispiel.de');
  });
  it('erkennt eine Rückerstattung (charge.refunded)', () => {
    const refundPayload = {
      type: 'charge.refunded',
      data: { object: { amount_refunded: 149700, currency: 'eur', id: 'ch_123' } },
    };
    const result = parseStripeEvent(refundPayload);
    expect(result.isRefund).toBe(true);
    expect(result.amount).toBe(-1497);
  });
  it('gibt Fehler für unbekannte Event-Typen zurück', () => {
    const result = parseStripeEvent({ type: 'customer.created', data: { object: {} } });
    expect(result.error).toBeDefined();
  });
  it('gibt Fehler bei null-Payload zurück', () => {
    expect(parseStripeEvent(null).error).toBeDefined();
  });
});

describe('parseDigistore24IPN — Digistore24 IPN Parser', () => {
  const saleParams = {
    order_id:        'DS-123456',
    event:           'order_completed',
    product_name:    'RealRise Masterkurs',
    buyer_email:     'kunde@beispiel.de',
    order_gross:     '997.00',
    affiliate:       '',
    affiliate_earning: '0',
  };

  it('erkennt einen Verkauf', () => {
    const result = parseDigistore24IPN(saleParams);
    expect(result.isClose).toBe(true);
    expect(result.isRefund).toBe(false);
  });
  it('extrahiert den Umsatz korrekt', () => {
    const result = parseDigistore24IPN(saleParams);
    expect(result.revenue).toBe(997);
  });
  it('erkennt einen Affiliate-Verkauf und extrahiert Provision', () => {
    const affiliateParams = { ...saleParams, affiliate: 'max-mueller', affiliate_earning: '199.40' };
    const result = parseDigistore24IPN(affiliateParams);
    expect(result.isAffiliate).toBe(true);
    expect(result.commission).toBe(199.40);
  });
  it('erkennt einen Storno (order_refunded)', () => {
    const refundParams = { ...saleParams, event: 'order_refunded' };
    const result = parseDigistore24IPN(refundParams);
    expect(result.isRefund).toBe(true);
    expect(result.isClose).toBe(false);
  });
  it('gibt Fehler wenn order_id fehlt', () => {
    expect(parseDigistore24IPN({}).error).toBeDefined();
    expect(parseDigistore24IPN(null).error).toBeDefined();
  });
});

// ─── DATEN-MERGE ───────────────────────────────────────────────

describe('mergePartnerData — Lokale + Remote Daten', () => {
  const remotePartners = [
    { id: 'p-1', name: 'Max Müller', entries: [{ period: 'W23', revenue: 16800 }] },
  ];
  const localPartners = [
    { id: 'p-1', name: 'Max Müller', entries: [{ period: 'W23', revenue: 15000 }] }, // alte Daten
    { id: 'p-2', name: 'Anna Schmidt', entries: [] }, // nur lokal
  ];

  it('gibt Remote-Daten zurück wenn lokal leer', () => {
    const result = mergePartnerData([], remotePartners);
    expect(result).toEqual(remotePartners);
  });
  it('gibt lokale Daten zurück wenn remote leer', () => {
    const result = mergePartnerData(localPartners, []);
    expect(result).toEqual(localPartners);
  });
  it('Remote gewinnt bei Konflikten (gleiche Partner-ID)', () => {
    const result = mergePartnerData(localPartners, remotePartners);
    const p1 = result.find(p => p.id === 'p-1');
    expect(p1.entries[0].revenue).toBe(16800); // Remote-Wert
  });
  it('fügt nur-lokale Partner dem Merge-Ergebnis hinzu', () => {
    const result = mergePartnerData(localPartners, remotePartners);
    const p2 = result.find(p => p.id === 'p-2');
    expect(p2).toBeDefined();
    expect(p2.name).toBe('Anna Schmidt');
  });
});

// ─── PERIODEN-VERGLEICH ────────────────────────────────────────

describe('calcDelta — Perioden-Vergleich', () => {
  it('berechnet positive prozentuale Änderung korrekt (110 → 138 = +25.5%)', () => {
    const result = calcDelta(138, 110);
    expect(result.value).toBeCloseTo(25.45, 1);
    expect(result.direction).toBe('up');
    expect(result.formatted).toContain('+');
  });

  it('berechnet negative prozentuale Änderung korrekt (150 → 120 = -20%)', () => {
    const result = calcDelta(120, 150);
    expect(result.value).toBeCloseTo(-20, 1);
    expect(result.direction).toBe('down');
  });

  it('berechnet Prozentpunkt-Differenz im pp-Modus (34.1 - 32.0 = +2.1pp)', () => {
    const result = calcDelta(34.1, 32.0, 'pp');
    expect(result.value).toBeCloseTo(2.1, 1);
    expect(result.formatted).toContain('pp');
    expect(result.direction).toBe('up');
  });

  it('gibt neutral zurück wenn beide Werte identisch sind', () => {
    const result = calcDelta(100, 100);
    expect(result.value).toBe(0);
    expect(result.direction).toBe('neutral');
  });

  it('gibt neutral zurück wenn ein Wert null ist', () => {
    const result = calcDelta(null, 100);
    expect(result.value).toBeNull();
    expect(result.direction).toBe('neutral');
    expect(result.formatted).toBe('–');
  });

  it('gibt neutral zurück wenn beide Werte null sind', () => {
    const result = calcDelta(null, null);
    expect(result.direction).toBe('neutral');
    expect(result.formatted).toBe('–');
  });

  it('gibt neutral zurück wenn Basiswert 0 und aktueller Wert positiv (Division durch 0)', () => {
    const result = calcDelta(50, 0);
    expect(result.value).toBeNull();
    expect(result.direction).toBe('neutral');
  });

  it('gibt 0% zurück wenn beide Werte 0 sind', () => {
    const result = calcDelta(0, 0);
    expect(result.value).toBe(0);
    expect(result.direction).toBe('neutral');
  });

  it('berechnet negative pp-Differenz korrekt (CPL verbessert sich: 6.16 vs 7.27 → -1.11pp)', () => {
    const result = calcDelta(6.16, 7.27, 'pp');
    expect(result.value).toBeCloseTo(-1.11, 1);
    expect(result.direction).toBe('down');
  });
});

// ─── SLUG-EINZIGARTIGKEIT ──────────────────────────────────────

describe('slugIsUnique — Slug-Kollisionsprüfung', () => {
  const partners = [
    { id: 'p-1', name: 'Max Müller' },
    { id: 'p-2', name: 'Anna Schmidt' },
  ];

  it('gibt true zurück wenn Name einzigartig ist', () => {
    expect(slugIsUnique('Tom Weber', partners)).toBe(true);
  });
  it('gibt false zurück wenn Slug bereits existiert', () => {
    expect(slugIsUnique('Max Müller', partners)).toBe(false);
  });
  it('gibt false bei Kollision durch Umlaute (max-mueller = max-müller)', () => {
    // "Max Muller" → max-muller ≠ "max-mueller" — sollte true sein
    expect(slugIsUnique('Max Muller', partners)).toBe(true);
  });
  it('erlaubt denselben Namen wenn excludeId übergeben (Edit-Modus)', () => {
    expect(slugIsUnique('Max Müller', partners, 'p-1')).toBe(true);
  });
  it('blockt Kollision wenn excludeId nicht passt', () => {
    expect(slugIsUnique('Max Müller', partners, 'p-2')).toBe(false);
  });
});
