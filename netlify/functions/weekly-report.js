/**
 * Netlify Scheduled Function: weekly-report
 * Cron: "0 8 * * 1" — jeden Montag um 08:00 UTC
 *
 * Liest alle Partner + aktuellste Einträge aus Supabase,
 * berechnet KPIs und sendet einen HTML-Wochenbericht per Resend.
 *
 * Erforderliche Umgebungsvariablen:
 *   SUPABASE_URL              — z.B. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY      — Service Role Key (RLS bypass)
 *   RESEND_API_KEY            — API-Key von resend.com
 *   RESEND_FROM_EMAIL         — verifizierte Absender-Domain
 *   REPORT_RECIPIENT_EMAIL    — Empfänger des Wochenberichts (z.B. daniel@realrise.de)
 */

// ─── SUPABASE HELPER ──────────────────────────────────────────────────────────

async function supabaseRequest(path, method = 'GET', body = null) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL oder SUPABASE_SERVICE_KEY fehlt');
  }

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

// ─── DATEN LADEN ──────────────────────────────────────────────────────────────

async function loadAllPartnersWithEntries() {
  // Partner laden
  const partners = await supabaseRequest('/partners?select=id,name,benchmarks&order=name.asc');
  if (!partners?.length) return [];

  // Für jeden Partner die letzten 2 Einträge laden (aktuell + Vorperiode für Trend)
  const enriched = await Promise.all(partners.map(async (partner) => {
    const entries = await supabaseRequest(
      `/entries?partner_id=eq.${partner.id}&order=period.desc&limit=2&select=period,period_type,calls_booked,calls_shown,closes,revenue,ad_spend,leads,clicks,reach,commission`
    );
    return { ...partner, entries: entries || [] };
  }));

  return enriched;
}

// ─── KPI-BERECHNUNGEN (inline — kein ES-Module-Import über Verzeichnisgrenzen) ─

function safePercent(numerator, denominator) {
  if (!denominator || denominator <= 0) return null;
  return (numerator / denominator) * 100;
}

function safeDiv(numerator, denominator) {
  if (!numerator || numerator <= 0 || !denominator || denominator <= 0) return null;
  return numerator / denominator;
}

function calcCloseRate(entry) {
  if (!entry) return null;
  return safePercent(entry.closes, entry.calls_shown);
}

function calcShowRate(entry) {
  if (!entry) return null;
  return safePercent(entry.calls_shown, entry.calls_booked);
}

function calcROI(entry) {
  if (!entry || !entry.ad_spend || entry.ad_spend <= 0) return null;
  return ((entry.revenue - entry.ad_spend) / entry.ad_spend) * 100;
}

function calcCPL(entry) {
  if (!entry) return null;
  return safeDiv(entry.ad_spend, entry.leads);
}

function calcCostPerClose(entry) {
  if (!entry) return null;
  return safeDiv(entry.ad_spend, entry.closes);
}

function calcTrendPercent(current, previous) {
  if (previous === null || previous === undefined || previous === 0) return null;
  if (current === null || current === undefined) return null;
  return ((current - previous) / previous) * 100;
}

// ─── FORMATIERUNG ─────────────────────────────────────────────────────────────

function fmtNum(n, decimals = 1) {
  if (n === null || n === undefined) return '–';
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: decimals }).format(n);
}

function fmtEur(n) {
  if (n === null || n === undefined) return '–';
  if (n === 0) return '€0';
  return '€' + new Intl.NumberFormat('de-DE').format(Math.round(n));
}

function fmtPct(n) {
  if (n === null || n === undefined) return '–';
  return fmtNum(n) + '%';
}

function fmtTrend(current, previous) {
  const trend = calcTrendPercent(current, previous);
  if (trend === null) return '';
  const arrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
  const color = trend > 0 ? '#10B981' : trend < 0 ? '#EF4444' : '#94A3B8';
  return `<span style="color:${color};font-size:.8rem;margin-left:.3rem">${arrow} ${Math.abs(trend).toFixed(1)}%</span>`;
}

// ─── FARBCODIERUNG ────────────────────────────────────────────────────────────

function closeRateColor(rate) {
  if (rate === null || rate === undefined) return '#94A3B8';
  return rate >= 30 ? '#10B981' : rate >= 15 ? '#F59E0B' : '#EF4444';
}

function roiColor(roi) {
  if (roi === null || roi === undefined) return '#94A3B8';
  return roi >= 200 ? '#10B981' : roi >= 0 ? '#F59E0B' : '#EF4444';
}

function showRateColor(rate) {
  if (rate === null || rate === undefined) return '#94A3B8';
  return rate >= 60 ? '#10B981' : rate >= 40 ? '#F59E0B' : '#EF4444';
}

// ─── KW / DATUM ───────────────────────────────────────────────────────────────

function getKW() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

function formatPeriod(period) {
  if (!period) return '–';
  // Format: "2026-W23" → "KW 23 / 2026"
  const match = period.match(/^(\d{4})-W(\d{2})$/);
  if (match) return `KW ${parseInt(match[2], 10)} / ${match[1]}`;
  // Format: "2026-06" → "Jun 2026"
  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const months = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    return `${months[parseInt(monthMatch[2], 10) - 1]} ${monthMatch[1]}`;
  }
  return period;
}

// ─── SUMMARY ÜBER ALLE PARTNER ────────────────────────────────────────────────

function buildSummary(partners) {
  let totalLeads = 0, totalCloses = 0, totalRevenue = 0, totalAdSpend = 0;

  for (const partner of partners) {
    const entry = partner.entries?.[0];
    if (!entry) continue;
    totalLeads    += entry.leads    || 0;
    totalCloses   += entry.closes   || 0;
    totalRevenue  += entry.revenue  || 0;
    totalAdSpend  += entry.ad_spend || 0;
  }

  const overallROI = totalAdSpend > 0
    ? ((totalRevenue - totalAdSpend) / totalAdSpend) * 100
    : null;

  const overallCloseRate = totalCloses > 0 && partners.some(p => p.entries?.[0]?.calls_shown > 0)
    ? safePercent(totalCloses, partners.reduce((s, p) => s + (p.entries?.[0]?.calls_shown || 0), 0))
    : null;

  return { totalLeads, totalCloses, totalRevenue, totalAdSpend, overallROI, overallCloseRate };
}

// ─── HTML EMAIL TEMPLATE ─────────────────────────────────────────────────────

function buildEmailHtml(partners, kw) {
  const subject = `KPI Wochenbericht — KW ${kw.week} / ${kw.year}`;
  const summary = buildSummary(partners);

  // ── Summary-Row ──
  const summaryHtml = `
    <div style="background:#1A1A2E;border-radius:.75rem;padding:1.25rem 1.5rem;margin-bottom:1.5rem;border:1px solid #2D2D4E">
      <h2 style="color:#7C3AED;font-size:.85rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 1rem">Gesamt-Übersicht</h2>
      <div style="display:flex;flex-wrap:wrap;gap:.75rem">
        ${summaryCard('Leads', fmtNum(summary.totalLeads, 0), '#06B6D4')}
        ${summaryCard('Abschlüsse', fmtNum(summary.totalCloses, 0), '#10B981')}
        ${summaryCard('Umsatz', fmtEur(summary.totalRevenue), '#10B981')}
        ${summaryCard('Ad-Spend', fmtEur(summary.totalAdSpend), '#F59E0B')}
        ${summaryCard('ROI', fmtPct(summary.overallROI), roiColor(summary.overallROI))}
      </div>
    </div>
  `;

  // ── Partner-Karten ──
  const partnerCardsHtml = partners.map(partner => {
    const entry = partner.entries?.[0] || null;
    const prev  = partner.entries?.[1] || null;

    const closeRate = calcCloseRate(entry);
    const showRate  = calcShowRate(entry);
    const roi       = calcROI(entry);
    const cpl       = calcCPL(entry);
    const cpc       = calcCostPerClose(entry);

    const prevCloseRate = calcCloseRate(prev);
    const prevROI       = calcROI(prev);

    return `
      <div style="background:#1A1A2E;border-radius:.75rem;padding:1.25rem 1.5rem;margin-bottom:1rem;border:1px solid #2D2D4E">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
          <div>
            <h3 style="color:#F1F5F9;font-size:1rem;font-weight:700;margin:0 0 .2rem">${escHtml(partner.name)}</h3>
            <div style="color:#94A3B8;font-size:.78rem">Periode: ${formatPeriod(entry?.period)}</div>
          </div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            ${statusBadge('Close Rate', closeRate, closeRateColor(closeRate))}
            ${entry?.revenue > 0 ? statusBadge('Umsatz', fmtEur(entry.revenue), '#10B981') : ''}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.6rem">
          ${kpiCell('Close Rate',    fmtPct(closeRate),  closeRateColor(closeRate), fmtTrend(closeRate, prevCloseRate))}
          ${kpiCell('Show Rate',     fmtPct(showRate),   showRateColor(showRate),   '')}
          ${kpiCell('Calls gebucht', fmtNum(entry?.calls_booked, 0), '#F1F5F9', '')}
          ${kpiCell('Calls ersch.',  fmtNum(entry?.calls_shown,  0), '#F1F5F9', '')}
          ${kpiCell('Abschlüsse',   fmtNum(entry?.closes,       0), '#10B981', '')}
          ${kpiCell('Umsatz',        fmtEur(entry?.revenue),        '#10B981', '')}
          ${kpiCell('ROI',           fmtPct(roi),        roiColor(roi), fmtTrend(roi, prevROI))}
          ${kpiCell('CPL',           cpl ? fmtEur(cpl) : '–', '#F1F5F9', '')}
          ${kpiCell('Cost/Close',    cpc ? fmtEur(cpc) : '–', '#F1F5F9', '')}
          ${kpiCell('Ad-Spend',      fmtEur(entry?.ad_spend), '#F59E0B', '')}
        </div>

        ${!entry ? `<div style="color:#94A3B8;font-size:.82rem;margin-top:.5rem;text-align:center">Keine Daten für aktuelle Periode</div>` : ''}
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0F0F1A;font-family:-apple-system,'Segoe UI',Roboto,Inter,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:2rem 1rem">

    <!-- Header -->
    <div style="background:#1A1A2E;border-radius:.75rem;padding:1.5rem;margin-bottom:1.5rem;border:1px solid #2D2D4E;text-align:center">
      <div style="display:inline-block;background:#7C3AED;color:#fff;font-size:.7rem;font-weight:700;padding:.3rem .8rem;border-radius:1rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:.75rem">Wochenbericht</div>
      <h1 style="color:#F1F5F9;margin:0 0 .25rem;font-size:1.5rem;font-weight:700">KPI Wochenbericht</h1>
      <div style="color:#94A3B8;font-size:.9rem">KW ${kw.week} / ${kw.year} · ${partners.length} Partner · ${new Date().toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' })}</div>
    </div>

    <!-- Gesamt-Summary -->
    ${summaryHtml}

    <!-- Partner-Karten -->
    <h2 style="color:#F1F5F9;font-size:1rem;font-weight:600;margin:0 0 .75rem">Partner-Übersicht</h2>
    ${partners.length > 0 ? partnerCardsHtml : '<div style="color:#94A3B8;text-align:center;padding:2rem">Keine Partner-Daten verfügbar</div>'}

    <!-- CTA -->
    <div style="text-align:center;margin:2rem 0 1.5rem">
      <a href="https://kpi-dashboard.netlify.app/kpi-dashboard"
         style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;padding:.8rem 2.5rem;border-radius:.5rem;font-weight:600;font-size:.95rem">
        Dashboard öffnen →
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #2D2D4E;padding-top:1rem;text-align:center">
      <div style="color:#94A3B8;font-size:.75rem">
        RealRise KPI Dashboard · Automatischer Wochenbericht
      </div>
      <div style="color:#2D2D4E;font-size:.7rem;margin-top:.25rem">
        Wird jeden Montag um 08:00 UTC versendet.
      </div>
    </div>

  </div>
</body>
</html>`;
}

// ─── HTML HILFSFUNKTIONEN ─────────────────────────────────────────────────────

function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function summaryCard(label, value, color) {
  return `
    <div style="flex:1;min-width:100px;background:#0F0F1A;border-radius:.5rem;padding:.75rem 1rem;border:1px solid #2D2D4E">
      <div style="color:#94A3B8;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.3rem">${label}</div>
      <div style="color:${color};font-size:1.1rem;font-weight:700">${value}</div>
    </div>
  `;
}

function kpiCell(label, value, color, trendHtml) {
  return `
    <div style="background:#0F0F1A;border-radius:.4rem;padding:.6rem .75rem;border:1px solid #2D2D4E">
      <div style="color:#94A3B8;font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.25rem">${label}</div>
      <div style="color:${color};font-size:.95rem;font-weight:600">${value}${trendHtml}</div>
    </div>
  `;
}

function statusBadge(label, value, color) {
  return `
    <div style="background:#0F0F1A;border:1px solid ${color};border-radius:.4rem;padding:.3rem .7rem;display:inline-flex;align-items:center;gap:.3rem">
      <span style="color:#94A3B8;font-size:.72rem">${label}:</span>
      <span style="color:${color};font-size:.82rem;font-weight:700">${value}</span>
    </div>
  `;
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export const handler = async () => {
  console.log('weekly-report: Starte Wochenbericht-Generierung...');

  // Env-Check
  const missingEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'RESEND_API_KEY', 'REPORT_RECIPIENT_EMAIL']
    .filter(k => !process.env[k]);

  if (missingEnv.length > 0) {
    const msg = `Fehlende Umgebungsvariablen: ${missingEnv.join(', ')}`;
    console.error('weekly-report:', msg);
    return { statusCode: 500, body: JSON.stringify({ error: msg }) };
  }

  // Daten laden
  let partners;
  try {
    partners = await loadAllPartnersWithEntries();
    console.log(`weekly-report: ${partners.length} Partner geladen`);
  } catch (err) {
    console.error('weekly-report: Supabase-Fehler:', err.message);
    return { statusCode: 502, body: JSON.stringify({ error: 'Supabase-Fehler', detail: err.message }) };
  }

  if (partners.length === 0) {
    console.warn('weekly-report: Keine Partner in Supabase gefunden');
    return { statusCode: 200, body: JSON.stringify({ ok: true, partnersReported: 0, warning: 'Keine Partner' }) };
  }

  // KW berechnen
  const kw = getKW();
  const subject = `KPI Wochenbericht — KW ${kw.week} / ${kw.year}`;

  // E-Mail aufbauen
  const html = buildEmailHtml(partners, kw);

  // Senden via Resend
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const recipientEmail = process.env.REPORT_RECIPIENT_EMAIL;

  const payload = {
    from: `KPI Dashboard <${fromAddress}>`,
    to:   [recipientEmail],
    subject,
    html,
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();

    if (!response.ok) {
      console.error('weekly-report: Resend-Fehler:', resData);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'E-Mail-Versand fehlgeschlagen', details: resData })
      };
    }

    console.log(`weekly-report: Bericht gesendet an ${recipientEmail}, Resend-ID: ${resData.id}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, partnersReported: partners.length, resendId: resData.id })
    };

  } catch (err) {
    console.error('weekly-report: Netzwerkfehler:', err.message);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Netzwerkfehler beim E-Mail-Versand', detail: err.message })
    };
  }
};
