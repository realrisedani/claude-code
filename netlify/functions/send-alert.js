/**
 * Netlify Function: send-alert
 * POST /.netlify/functions/send-alert
 *
 * Sendet kritische KPI-Alerts per E-Mail via Resend API.
 *
 * Erforderliche Umgebungsvariablen (in Netlify Dashboard setzen):
 *   RESEND_API_KEY — API-Key von resend.com (kostenlos bis 3.000 E-Mails/Monat)
 *
 * Body (JSON):
 *   partnerName    {string}  Name des Partners
 *   alerts         {Array}   Alert-Objekte: { level, title, desc }
 *   recipientEmail {string}  Empfänger-E-Mail-Adresse
 *   period         {string}  Berichts-Periode (z.B. "KW 22 / 2025")
 */

// In-memory Rate-Limiting (max 1 E-Mail pro Partner pro Stunde)
// Hinweis: Wird bei Function-Cold-Start zurückgesetzt.
// TODO: Echtes Rate-Limiting via Netlify KV-Store oder Upstash implementieren.
const rateLimitMap = new Map();
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 Stunde

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRateLimited(partnerName) {
  const lastSent = rateLimitMap.get(partnerName);
  if (!lastSent) return false;
  return Date.now() - lastSent < RATE_LIMIT_MS;
}

function buildEmailHtml(partnerName, period, alerts) {
  const critAlerts = alerts.filter(a => a.level === 'crit');
  const warnAlerts = alerts.filter(a => a.level === 'warn');

  const alertRows = alerts.map(a => {
    const isCrit = a.level === 'crit';
    const color = isCrit ? '#EF4444' : '#F59E0B';
    const badge = isCrit ? 'KRITISCH' : 'WARNUNG';
    return `
      <div style="background:#1A1A2E;border-left:4px solid ${color};border-radius:.5rem;padding:1rem;margin-bottom:.75rem">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem">
          <span style="background:${color};color:#fff;font-size:.65rem;font-weight:700;padding:.2rem .5rem;border-radius:.25rem;letter-spacing:.05em">${badge}</span>
          <span style="color:#F1F5F9;font-weight:600;font-size:.9rem">${a.title}</span>
        </div>
        <div style="color:#94A3B8;font-size:.82rem;line-height:1.5">${a.desc}</div>
      </div>
    `;
  }).join('');

  const summary = critAlerts.length > 0
    ? `<span style="color:#EF4444;font-weight:700">${critAlerts.length} kritische${critAlerts.length > 1 ? '' : ''}</span>${warnAlerts.length > 0 ? ` und <span style="color:#F59E0B;font-weight:700">${warnAlerts.length} Warnungen</span>` : ''}`
    : `<span style="color:#F59E0B;font-weight:700">${warnAlerts.length} Warnung${warnAlerts.length > 1 ? 'en' : ''}</span>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KPI Alert: ${partnerName}</title>
</head>
<body style="margin:0;padding:0;background:#0F0F1A;font-family:-apple-system,'Segoe UI',Roboto,Inter,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:2rem 1rem">

    <!-- Header -->
    <div style="background:#1A1A2E;border-radius:.75rem;padding:1.5rem;margin-bottom:1.5rem;border:1px solid #2D2D4E;text-align:center">
      <div style="font-size:2rem;margin-bottom:.5rem">🚨</div>
      <h1 style="color:#F1F5F9;margin:0 0 .25rem;font-size:1.4rem;font-weight:700">KPI Alert</h1>
      <div style="color:#7C3AED;font-size:.9rem;font-weight:600">${partnerName}</div>
      <div style="color:#94A3B8;font-size:.8rem;margin-top:.25rem">Periode: ${period}</div>
    </div>

    <!-- Summary -->
    <div style="background:#1A1A2E;border-radius:.75rem;padding:1rem 1.5rem;margin-bottom:1.5rem;border:1px solid #2D2D4E">
      <p style="color:#94A3B8;margin:0;font-size:.9rem">
        Das KPI Dashboard hat ${summary} für <strong style="color:#F1F5F9">${partnerName}</strong> erkannt.
        Sofortiger Handlungsbedarf erforderlich.
      </p>
    </div>

    <!-- Alerts -->
    <div style="margin-bottom:1.5rem">
      <h2 style="color:#F1F5F9;font-size:1rem;font-weight:600;margin:0 0 .75rem">Alert-Details</h2>
      ${alertRows}
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:2rem">
      <a href="https://kpi-dashboard.netlify.app/kpi-dashboard"
         style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;padding:.75rem 2rem;border-radius:.5rem;font-weight:600;font-size:.9rem">
        Dashboard öffnen →
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #2D2D4E;padding-top:1rem;text-align:center">
      <div style="color:#94A3B8;font-size:.75rem">
        RealRise KPI Dashboard · Automatischer Alert
      </div>
      <div style="color:#2D2D4E;font-size:.7rem;margin-top:.25rem">
        Diese E-Mail wurde automatisch gesendet. Max. 1 Alert pro Partner pro Stunde.
      </div>
    </div>

  </div>
</body>
</html>`;
}

export const handler = async (event) => {
  // Nur POST erlaubt
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // API-Key prüfen
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY ist nicht gesetzt');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server-Konfigurationsfehler: RESEND_API_KEY fehlt' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ungültiges JSON' }) };
  }

  const { partnerName, alerts, recipientEmail, period = '–' } = body;

  // Validierung
  if (!recipientEmail || !EMAIL_REGEX.test(recipientEmail)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ungültige oder fehlende E-Mail-Adresse' }) };
  }

  if (!alerts || !Array.isArray(alerts) || alerts.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'alerts darf nicht leer sein' }) };
  }

  if (!partnerName) {
    return { statusCode: 400, body: JSON.stringify({ error: 'partnerName fehlt' }) };
  }

  // Rate-Limiting
  const rateLimitKey = `${partnerName}::${recipientEmail}`;
  if (isRateLimited(rateLimitKey)) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: 'Rate-Limit: Max. 1 E-Mail pro Partner pro Stunde' })
    };
  }

  const critCount = alerts.filter(a => a.level === 'crit').length;
  const subject = critCount > 0
    ? `KPI Alert: ${partnerName} — ${critCount} kritische Metrik${critCount > 1 ? 'en' : ''}`
    : `KPI Warnung: ${partnerName}`;

  // From-Adresse: Resend-verified Domain oder Fallback für Dev
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  const payload = {
    from: `KPI Dashboard <${fromAddress}>`,
    to: [recipientEmail],
    subject,
    html: buildEmailHtml(partnerName, period, alerts),
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();

    if (!response.ok) {
      console.error('Resend API Fehler:', resData);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'E-Mail-Versand fehlgeschlagen', details: resData })
      };
    }

    // Rate-Limit-Eintrag setzen
    rateLimitMap.set(rateLimitKey, Date.now());

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: resData.id })
    };

  } catch (err) {
    console.error('Fetch-Fehler bei Resend API:', err);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Netzwerkfehler beim E-Mail-Versand' })
    };
  }
};
