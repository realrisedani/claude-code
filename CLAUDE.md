# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt-Überblick

Dieses Repo enthält alle Kursmaterialien für den **RealRise Claude Code Kurs** — 52 interaktive HTML-Lektionen in 7 Tracks. Ziel: Deutsche 20-40-Jährige, die ein KI-Business aufbauen wollen.

- **Track 0 — Onramp** (8 Lektionen) ✅ FROZEN — nicht mehr ändern
- **Track 1 — Foundation** (29 Lektionen) 📄 Slides fertig, Videos in Aufnahme
- **Module 5/api — Anthropic API** (Lektionen 30–37) 📄 Slides fertig
- **Module 5/agency — Agency Delivery** (Lektionen 38–44) 📄 Slides fertig
- `index.html` — Recording-Cockpit mit Status-Übersicht aller Lektionen
- `CURRICULUM.md` — einzige Wahrheit über Kursstruktur und Status

## Git & GitHub Workflow

### Einmaliges Setup (neues Projekt/Unterordner)
```bash
git init
git config --global user.name "danielstengel"
git config --global user.email "realriseag@gmail.com"
echo ".claude/settings.local.json" >> .gitignore
git add .
git commit -m "erster commit"
gh repo create <ordnername> --public --source=. --remote=origin --push
```

GitHub Account: `realrisedani` — Repo-Name = Ordnername

### Nach jeder Änderung
```bash
git add . && git commit -m "<deutsch>" && git push
```

## Demo-Projekt lokal entwickeln

Das _demo/3d-scroll-site/ ist ein Next.js-Beispielprojekt (Kurs-Demo, nicht Produktion):
```bash
cd _demo/3d-scroll-site
npm install
npm run dev   # http://localhost:3000
npm run build
```

## Naming-Konvention für Lektionen

```
M[Modul]-[Track-Code]-[Nummer]-[Thema].html
```

Beispiel: `M1-CC-01-Installation.html` = Modul 1, Claude Code Track, Lektion 01

Track-Codes: `T0` = Onramp · `CC` = Claude Code · `API` = Anthropic API · `AGY` = Agency

## Design-System (alle Lektionen)

Alle HTML-Lektionen teilen dasselbe Farbschema. Beim Erstellen oder Ändern immer diese Tokens verwenden:

```css
--bg:     #0F0F1A  /* Hintergrund */
--card:   #1A1A2E  /* Karten/Container */
--accent: #7C3AED  /* Lila (Primary) */
--cyan:   #06B6D4  /* Cyan (Secondary) */
--green:  #10B981  /* Erfolg */
--warn:   #F59E0B  /* Warnung */
--red:    #EF4444  /* Fehler */
--white:  #F1F5F9  /* Text */
--muted:  #94A3B8  /* Sekundärtext */
--border: #2D2D4E  /* Rahmen */
```

Font: `-apple-system, 'Segoe UI', Roboto, Inter` — responsive mit `clamp()`. Template: `_templates/TEMPLATE-LEKTION.html`.

## Lektion-Typen (für neue Inhalte)

Jede Lektion gehört zu einem der drei Typen aus `_kurs-produktion/AUFNAHME-METHODE.md`:

- 🟢 **RECAP** — kein Demo, reine Erklärung (Struktur: Hook → Erklärung → Konsequenz → Closing)
- 🔵 **TOOL** — 1 Demo im Claude Code Terminal (Hook → Theorie → Live-Demo → Practice → Closing)
- 🟣 **THINKING** — kein Demo, Konzept/Mindset (Hook → Konzept → Beispiele → Transfer → Closing)

Typ steht im `CURRICULUM.md` bei jeder Lektion.

## Wichtige Dateien

| Datei / Pfad | Zweck |
|---|---|
| `CURRICULUM.md` | Kursstruktur + Status-Matrix, **einzige Wahrheit** |
| `index.html` | Recording-Cockpit für Aufnahme-Workflow |
| `_templates/TEMPLATE-LEKTION.html` | Ausgangspunkt für neue Lektionen |
| `_kurs-produktion/AUFNAHME-METHODE.md` | Aufnahme-Richtlinien + Qualitätsstandards |
| `_kurs-produktion/track-1-aufnahme-plan.md` | Typ + Dauer + Core Message pro Lektion |
| `.claude/memory/project-context.md` | Kursstruktur und Design-System für Context |
| `.claude/memory/curriculum-stand.md` | Welche Lektionen fertig sind, was als nächstes kommt |

## Memory-System

Wichtige Projektentscheidungen in `.claude/memory/` speichern. Nach Änderungen an Kursstruktur oder Design-System die entsprechenden Memory-Dateien aktualisieren, damit nachfolgende Sessions direkt loslegen können.

## Sprache

- UI-Text in Lektionen: Deutsch
- Code und CSS-Variablen: Englisch
- Commit-Messages: Deutsch
- Track 0 ist FROZEN — keine inhaltlichen Änderungen mehr
