/**
 * kpi-logic.js — Pure Business Logic für das KPI Dashboard
 * Keine DOM-Abhängigkeiten, keine Side Effects, 100% testbar.
 *
 * Wird vom Dashboard (kpi-dashboard.html) per <script> eingebunden
 * und von Vitest direkt importiert.
 */

// ─── FORMATIERUNG ──────────────────────────────────────────────

export function fmt(n) {
  if (n === null || n === undefined || (n !== 0 && !n)) return '–';
  return new Intl.NumberFormat('de-DE').format(n);
}

export function fmtEur(n) {
  if (n === null || n === undefined || (n !== 0 && !n)) return '–';
  if (n === 0) return '€0';
  return '€' + new Intl.NumberFormat('de-DE').format(n);
}

export function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function toSlug(name) {
  return name.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ─── DATUM ─────────────────────────────────────────────────────

export function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ─── DATEN-ZUGRIFF ─────────────────────────────────────────────

export function latestEntry(partner) {
  if (!partner?.entries?.length) return null;
  return partner.entries[partner.entries.length - 1];
}

// ─── KPI-BERECHNUNGEN (alle return null wenn Daten fehlen) ─────

/** Interne Hilfsfunktion: a/b*100 — gibt null zurück wenn b fehlt oder ≤ 0 */
function safePercent(numerator, denominator) {
  if (!denominator || denominator <= 0) return null;
  return (numerator / denominator) * 100;
}

/** Interne Hilfsfunktion: a/b — gibt null zurück wenn a oder b fehlt oder ≤ 0 */
function safeDiv(numerator, denominator) {
  if (!numerator || numerator <= 0 || !denominator || denominator <= 0) return null;
  return numerator / denominator;
}

export function calcCloseRate(entry) {
  if (!entry) return null;
  return safePercent(entry.closes, entry.callsShown);
}

export function calcShowRate(entry) {
  if (!entry) return null;
  return safePercent(entry.callsShown, entry.callsBooked);
}

export function calcCTR(entry) {
  if (!entry) return null;
  return safePercent(entry.clicks, entry.reach);
}

export function calcOptinRate(entry) {
  if (!entry) return null;
  return safePercent(entry.leads, entry.clicks);
}

export function calcROI(entry) {
  if (!entry || !entry.adSpend || entry.adSpend <= 0) return null;
  return ((entry.revenue - entry.adSpend) / entry.adSpend) * 100;
}

export function calcCPL(entry) {
  if (!entry) return null;
  return safeDiv(entry.adSpend, entry.leads);
}

export function calcCostPerClose(entry) {
  if (!entry) return null;
  return safeDiv(entry.adSpend, entry.closes);
}

export function calcRevPerLead(entry) {
  if (!entry || !entry.leads || entry.leads <= 0) return null;
  return entry.revenue / entry.leads;
}

// ─── TREND ─────────────────────────────────────────────────────

export function calcTrendPercent(current, previous) {
  if (previous === null || previous === undefined || previous === 0) return null;
  if (current === null || current === undefined) return null;
  return ((current - previous) / previous) * 100;
}

// ─── KLASSEN-LOGIK ─────────────────────────────────────────────

export function closeRateClass(rate) {
  if (rate === null || rate === undefined || isNaN(rate)) return 'muted';
  return rate >= 30 ? 'green' : rate >= 15 ? 'warn' : 'red';
}

export function benchmarkStatus(value, warn, crit) {
  // crit < warn < value = good
  if (value === null || value === undefined) return 'neutral';
  if (value < crit) return 'crit';
  if (value < warn) return 'warn';
  return 'good';
}

// ─── BENCHMARK-DEFAULTS ────────────────────────────────────────

export const DEFAULT_BENCHMARKS = {
  closeWarn: 20, closeCrit: 10, closeGood: 30,
  showWarn:  40, showCrit:  25, showGood:  60,
  optinWarn:  5, optinCrit:  2, optinGood: 10,
  roiWarn:    0, roiCrit:  -50, roiGood:  200,
};

export function mergeBenchmarks(stored) {
  return Object.assign({}, DEFAULT_BENCHMARKS, stored || {});
}

// ─── ENTRY-VALIDIERUNG ─────────────────────────────────────────

export function validateEntry(entry) {
  const errors = [];
  if (!entry) { errors.push('Kein Eintrag'); return errors; }
  if (!entry.period)     errors.push('Zeitraum fehlt');
  if (!entry.periodType) errors.push('Periodentyp fehlt');
  if (entry.closes > entry.callsShown && entry.callsShown > 0)
    errors.push('Abschlüsse können nicht größer sein als Calls erschienen');
  if (entry.callsShown > entry.callsBooked && entry.callsBooked > 0)
    errors.push('Erschienene Calls können nicht größer sein als gebuchte Calls');
  if (entry.leads > entry.clicks && entry.clicks > 0)
    errors.push('Leads können nicht größer sein als Klicks');
  if (entry.clicks > entry.reach && entry.reach > 0)
    errors.push('Klicks können nicht größer sein als Reach');
  if (entry.adSpend < 0) errors.push('Ad-Spend kann nicht negativ sein');
  if (entry.revenue < 0) errors.push('Umsatz kann nicht negativ sein');
  return errors;
}

// ─── WEBHOOK-PARSER (für Auto-Tracking — Phase 2) ──────────────

/**
 * parseCalendlyEvent — extrahiert relevante Felder aus einem Calendly Webhook
 * Unterstützte Event-Typen:
 *   - invitee.created  → callsBooked + 1
 *   - invitee.canceled → callsBooked - 1
 *   - invitee_no_show  → callsShown - 1 (Host markiert No-Show)
 */
export function parseCalendlyEvent(payload) {
  if (!payload?.event || !payload?.payload) {
    return { error: 'Ungültiges Calendly-Payload' };
  }

  const { event, payload: data } = payload;
  const validEvents = ['invitee.created', 'invitee.canceled', 'invitee.reschedule'];

  if (!validEvents.includes(event) && !event.includes('no_show')) {
    return { error: `Unbekannter Event-Typ: ${event}` };
  }

  return {
    eventType:   event,
    inviteeName: data.invitee?.name || null,
    inviteeEmail: data.invitee?.email || null,
    startTime:   data.event?.start_time || null,
    endTime:     data.event?.end_time || null,
    eventName:   data.event_type?.name || null,
    isBooking:   event === 'invitee.created',
    isCanceled:  event === 'invitee.canceled',
    isNoShow:    event?.includes('no_show') || false,
  };
}

/**
 * parseStripeEvent — extrahiert Umsatzdaten aus einem Stripe Webhook
 * Unterstützte Event-Typen:
 *   - payment_intent.succeeded → Abschluss + Umsatz
 *   - charge.refunded          → Storno
 */
export function parseStripeEvent(payload) {
  if (!payload?.type || !payload?.data?.object) {
    return { error: 'Ungültiges Stripe-Payload' };
  }

  const { type, data } = payload;
  const obj = data.object;

  if (type === 'payment_intent.succeeded') {
    return {
      eventType:    'payment_succeeded',
      amount:       (obj.amount_received || obj.amount || 0) / 100, // Cents → Euro
      currency:     obj.currency?.toUpperCase() || 'EUR',
      customerEmail: obj.receipt_email || null,
      paymentId:    obj.id,
      isClose:      true,
      isRefund:     false,
    };
  }

  if (type === 'charge.refunded') {
    return {
      eventType:    'refund',
      amount:       -(obj.amount_refunded || 0) / 100,
      currency:     obj.currency?.toUpperCase() || 'EUR',
      customerEmail: obj.receipt_email || null,
      paymentId:    obj.payment_intent || obj.id,
      isClose:      false,
      isRefund:     true,
    };
  }

  return { error: `Nicht unterstützter Stripe-Event: ${type}` };
}

/**
 * parseDigistore24IPN — extrahiert Verkaufsdaten aus Digistore24 IPN
 */
export function parseDigistore24IPN(params) {
  if (!params || !params.order_id) {
    return { error: 'Ungültiges Digistore24-Payload — order_id fehlt' };
  }

  const isAffiliate = !!params.affiliate;
  const grossRevenue = parseFloat(params.order_gross || 0);
  const commission   = parseFloat(params.affiliate_earning || 0);

  return {
    orderId:      params.order_id,
    productName:  params.product_name || null,
    buyerEmail:   params.buyer_email || null,
    revenue:      grossRevenue,
    commission:   isAffiliate ? commission : 0,
    isAffiliate,
    isRefund:     params.event === 'order_refunded',
    isClose:      params.event === 'order_completed' || params.event === 'payment_successful',
    eventType:    params.event || 'unknown',
  };
}

/**
 * mergePartnerData — führt lokale und remote Daten zusammen
 * Remote (Supabase) gewinnt bei Konflikten für denselben Zeitraum
 */
export function mergePartnerData(localPartners, remotePartners) {
  if (!remotePartners?.length) return localPartners || [];
  if (!localPartners?.length)  return remotePartners;

  const merged = [...remotePartners];

  for (const local of localPartners) {
    const remoteMatch = merged.find(r => r.id === local.id);
    if (!remoteMatch) {
      // Neuer lokaler Partner der noch nicht in Supabase ist
      merged.push(local);
    }
    // Wenn in Supabase vorhanden: Remote-Version gewinnt (kein Merge nötig)
  }

  return merged;
}

/**
 * slugIsUnique — prüft ob ein Slug innerhalb der Partner-Liste eindeutig ist
 */
export function slugIsUnique(name, partners, excludeId = null) {
  const slug = toSlug(name);
  return !partners.some(p => p.id !== excludeId && toSlug(p.name) === slug);
}

// ─── PERIODEN-VERGLEICH ────────────────────────────────────────

/**
 * calcDelta — berechnet die Differenz zwischen zwei Periodenwerten
 *
 * @param {number|null} current  - Wert der neueren Periode (Periode A)
 * @param {number|null} baseline - Wert der älteren Periode als Vergleichsbasis (Periode B)
 * @param {'percent'|'pp'} [unit='percent'] - 'percent' für prozentuale Änderung, 'pp' für Prozentpunkt-Differenz
 * @returns {{ value: number|null, formatted: string, direction: 'up'|'down'|'neutral' }}
 */
export function calcDelta(current, baseline, unit = 'percent') {
  if (current === null || current === undefined || baseline === null || baseline === undefined) {
    return { value: null, formatted: '–', direction: 'neutral' };
  }

  if (unit === 'pp') {
    // Prozentpunkt-Differenz (z.B. Close Rate 34.1% → 32.0% = +2.1pp)
    const diff = current - baseline;
    const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';
    return {
      value: diff,
      formatted: (diff > 0 ? '+' : '') + diff.toFixed(1) + 'pp',
      direction,
    };
  }

  // Prozentuale Veränderung (Standard)
  if (baseline === 0) {
    if (current === 0) return { value: 0, formatted: '0%', direction: 'neutral' };
    return { value: null, formatted: '–', direction: 'neutral' };
  }

  const pct = ((current - baseline) / Math.abs(baseline)) * 100;
  const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral';
  return {
    value: pct,
    formatted: (pct > 0 ? '+' : '') + pct.toFixed(1) + '%',
    direction,
  };
}
