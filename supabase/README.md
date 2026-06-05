# KPI Dashboard — Supabase Setup

Schritt-für-Schritt Anleitung, um das KPI Dashboard von localStorage auf Supabase umzustellen.

---

## Voraussetzungen

- [supabase.com](https://supabase.com) Account (kostenloser Free-Plan reicht aus)
- Das KPI Dashboard läuft lokal oder auf einem Webserver

---

## Schritt 1 — Supabase Projekt anlegen

1. Gehe zu [supabase.com](https://supabase.com) → **New Project**
2. Wähle eine Region (z. B. Frankfurt) und vergib ein Datenbank-Passwort
3. Warte bis das Projekt bereit ist (~1 Minute)

---

## Schritt 2 — Credentials kopieren

1. Öffne **Settings → API** in deinem Supabase-Projekt
2. Kopiere **Project URL** und **anon public** Key
3. Kopiere `kpi-config.example.js` → `kpi-config.js` (im Root-Verzeichnis des Projekts)
4. Füge deine Werte ein:

```js
const SUPABASE_URL      = 'https://xxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

`kpi-config.js` ist in `.gitignore` eingetragen — diese Datei wird niemals committed.

---

## Schritt 3 — Schema erstellen

1. Öffne **SQL Editor → New query** in deinem Supabase-Projekt
2. Füge den Inhalt von `supabase/schema.sql` ein
3. Klicke **Run**

Das erstellt:
- Tabelle `partners` mit RLS
- Tabelle `entries` mit RLS und CASCADE DELETE
- Hilfsfunktion `is_admin()`
- Performance-Indexes
- Realtime-Publikation für beide Tabellen

---

## Schritt 4 — Demo-Daten einspielen (optional)

1. Öffne **SQL Editor → New query**
2. Öffne `supabase/seed.sql`
3. Ersetze `<your-user-id>` mit deiner User-UUID (Authentication → Users → ID-Spalte)
4. Klicke **Run**

---

## Schritt 5 — Script-Tags in kpi-dashboard.html einfügen

Füge diese drei Script-Tags **vor dem schließenden `</body>`-Tag** ein, **in dieser Reihenfolge**:

```html
<!-- 1. Supabase CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>

<!-- 2. Deine Credentials (gitignored) -->
<script src="kpi-config.js"></script>

<!-- 3. Data Access Layer -->
<script src="supabase/kpi-data.js"></script>
```

Ersetze dann im bestehenden Dashboard-Skript die `loadData()` / `saveData()` Aufrufe durch `KpiData.*`-Funktionen (siehe Migrations-Hinweise unten).

---

## Schritt 6 — Admin-Flag setzen

Damit du als Admin alle Partner siehst (nicht nur deine eigenen), musst du dein User-Profil mit dem `is_admin`-Flag versehen.

**Option A — SQL Editor:**

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE id = '<deine-user-uuid>';
```

**Option B — Supabase Dashboard:**

Authentication → Users → Klick auf deinen User → **Edit** → Custom Claims:
```json
{ "is_admin": true }
```

---

## API-Referenz (KpiData)

| Funktion | Beschreibung |
|---|---|
| `await KpiData.loadPartners()` | Alle Partner + Einträge laden → `{ partners: [...] }` |
| `await KpiData.savePartner(partner)` | Partner INSERT oder UPDATE |
| `await KpiData.saveEntry(partnerId, entry)` | Neuen Eintrag hinzufügen |
| `await KpiData.deletePartner(id)` | Partner + alle Einträge löschen |
| `await KpiData.deleteEntry(id)` | Einzelnen Eintrag löschen |
| `KpiData.subscribeToChanges(cb)` | Realtime-Abo auf Änderungen |
| `KpiData.getStorageMode()` | Gibt `'supabase'` oder `'localStorage'` zurück |

**Fallback-Verhalten:** Wenn `kpi-config.js` fehlt oder noch Platzhalter enthält, fallen alle Funktionen automatisch auf localStorage zurück. Das Dashboard funktioniert also auch ohne Supabase-Konfiguration.

---

## Datenmodell-Mapping

| localStorage (camelCase) | Supabase-Spalte (snake_case) |
|---|---|
| `partner.id` | `partners.id` (uuid) |
| `entry.periodType` | `entries.period_type` |
| `entry.callsBooked` | `entries.calls_booked` |
| `entry.callsShown` | `entries.calls_shown` |
| `entry.adSpend` | `entries.ad_spend` |

Die `kpi-data.js` übersetzt automatisch zwischen beiden Formaten.

---

## Sicherheitsmodell

| Rolle | Zugriff |
|---|---|
| **Admin** (`is_admin = true` im JWT) | Alle Partner + Einträge lesen, schreiben, löschen |
| **Authentifizierter User** | Nur eigene Partner (`created_by = auth.uid()`) + deren Einträge |
| **Anonym (kein Login)** | Kein Zugriff (RLS blockiert alles) |

Row Level Security ist auf beiden Tabellen aktiv und kann nicht umgangen werden.
