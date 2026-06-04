# KPI Dashboard — Spec & Roadmap

**Datei:** `kpi-dashboard.html` im Projektroot  
**Status:** Phase 1 live (manuelle Eingabe + localStorage)  
**Ziel:** Sales- und Affiliate-Partner tracken ihren Funnel täglich, identifizieren Conversion-Lücken und steigern Abschlüsse.

---

## Phase 1 — Fertig (lokal, manuell)

### Features
- **Admin-Modus**: Alle Partner auf einen Blick, sortierbare Tabelle, Drill-Down per Klick
- **Partner-Modus**: Einzelansicht mit vollem Funnel, KPI-Cards, Advanced KPIs, History
- **Funnel-Stufen** (Sales + Affiliate kombiniert):
  - Reach / Traffic → Klicks → Leads / Opt-ins → Calls gebucht → Calls erschienen → Abschlüsse → Umsatz → Provision
- **KPI-Berechnungen** (automatisch):
  - CTR, Opt-in Rate, Show-Rate, Close Rate, CPL, Cost per Close, Revenue per Lead, ROI %
- **Funnel-Leck-Finder**: Automatische Analyse der schwächsten Conversion-Stufe mit Handlungsempfehlung
- **Trend-Pfeile**: Vergleich zur Vorperiode bei allen KPI-Cards
- **Dateneingabe-Modal**: Formular für alle 8 Funnel-Stufen + Ad-Spend + Zeitraum (Tag / Woche / Monat)
- **Export**: JSON-Download aller Partnerdaten (Vorbereitung Remote-Monitoring)
- **Demo-Daten**: Sofort-Seed mit 3 Beispielpartnern
- **Persistenz**: localStorage, Daten überleben Browser-Neustart

### Datenmodell
```json
{
  "partners": [
    {
      "id": "p-xxx",
      "name": "Max Müller",
      "type": "sales",
      "email": "max@beispiel.de",
      "note": "Instagram DE",
      "entries": [
        {
          "period": "2026-W23",
          "periodType": "week",
          "reach": 26500,
          "clicks": 1190,
          "leads": 138,
          "callsBooked": 51,
          "callsShown": 41,
          "closes": 14,
          "revenue": 16800,
          "adSpend": 850,
          "commission": 0
        }
      ]
    }
  ]
}
```

---

## Phase 2 — Remote-Monitoring (nächste Schritte)

### 2a. Shareable Partner-URLs
- `kpi-dashboard.html?partner=max-mueller` öffnet direkt die Einzelansicht
- Kein Login nötig — Partner bookmarken ihren Link
- **Implementierung**: URL-Parameter auslesen → `selectedPartnerId` setzen → Mode auf `partner`

### 2b. Google Sheets Sync (kein Backend nötig)
- Partner füllen ein Google Sheet → Dashboard liest live via Sheets API v4
- Sheet-Struktur: eine Zeile = ein Eintrag (Partner, Periode, alle 8 Funnel-Felder)
- **Implementierung**:
  1. Google Cloud Project + Sheets API Key (read-only, kein OAuth nötig für public Sheets)
  2. `fetch()` beim Laden + alle 5 Minuten
  3. Daten ins localStorage mergen (lokale Einträge + Sheet-Einträge)
  4. Sheet-ID in `kpi-dashboard.html` als Config-Variable

### 2c. Daniel-Admin-Zugang (passwortgeschützt)
- Admin-Modus hinter simplem PIN (kein Server nötig)
- **Implementierung**: `sessionStorage`-Flag, Hash-Vergleich (SHA-256 via SubtleCrypto)
- Partner-Modus bleibt immer offen

### 2d. Alert-Schwellen
- Wenn Close Rate < 20% oder Show-Rate < 40% → visueller Alert im Dashboard
- Optionale Slack-Webhook-Integration: tägliche Summary um 9 Uhr
- **Implementierung**: Config-Objekt mit Schwellwerten + Webhook-URL in localStore

### 2e. Automatischer Wochenbericht (PDF / HTML)
- Button "Wochenbericht generieren" → druckbares HTML in neuem Tab
- Enthält: alle Partner, KPI-Tabelle, Funnel-Charts, Top-3-Optimierungshinweise
- **Implementierung**: `window.print()` mit `@media print` Styles oder html2canvas + jsPDF

### 2f. CRM-Integration (Webhook)
- HubSpot / Close.com → Zapier / Make Webhook → JSON-Payload ins Sheet schreiben
- Vollautomatisch: kein manuelles Eingeben mehr nötig
- **Datenformat**: Webhook-Payload → Sheet-Zeile (Mapping-Config in Phase 2b Sheet)

### 2g. Mehrperioden-Trends (Chart)
- Chart.js einbinden: Liniendiagramm für Leads, Abschlüsse, Umsatz über Zeit
- Vergleich: aktueller Partner vs. Durchschnitt aller Partner
- **Implementierung**: Chart.js CDN + `renderChart()` Funktion nach `renderPartner()`

---

## Benchmarks (Richtwerte für Funnel-Leck-Finder)

| Metrik         | Rot (<)  | Gelb     | Grün (>) |
|----------------|----------|----------|----------|
| CTR            | 1%       | 1–3%     | 3%       |
| Opt-in Rate    | 5%       | 5–10%    | 10%      |
| Show-Rate      | 40%      | 40–60%   | 60%      |
| Close Rate     | 15%      | 15–30%   | 30%      |
| ROI            | 0%       | 0–200%   | 200%     |

---

## Zugriff & Monitoring (aktuell)

- **Admin (Daniel)**: Datei lokal öffnen → Admin-Modus
- **Export**: JSON-Download täglich/wöchentlich → per E-Mail oder Slack teilen
- **Partner**: Datei per Link teilen (Netlify/GitHub Pages Deploy) → Partner sehen eigene Daten

---

## Deployment (empfohlen für Phase 1.5)

```bash
# Netlify CLI
netlify deploy --dir . --prod

# Oder GitHub Pages
git add kpi-dashboard.html && git commit -m "KPI Dashboard deploy"
git push
# → https://realrisedani.github.io/claude-code/kpi-dashboard.html
```

Hinweis: localStorage ist browser-lokal. Für geteilte Daten → Phase 2b (Sheets Sync).
