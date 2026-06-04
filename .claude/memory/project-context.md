---
name: project-context
description: Claude Code Kurs — Struktur, Tracks, Naming-Schema, Design-System
metadata:
  type: project
---

# Claude Code Kurs — Kontext

## Was ist das?
Vollständiger Claude Code Kurs von RealRise (@daniel.realrise).
Zielgruppe: Deutsche Anfänger bis Fortgeschrittene.
Ziel: Vorzeige-Repo das als Template für zukünftige Projekte dient.

## Ordnerstruktur
- track-0-onramp/ — Vorkenntnisse (T0-02 bis T0-10 + Praxis)
- track-1-claude-code/ — Hauptkurs (CC-01 bis CC-29)
- module-5/api/ — Anthropic API Vertiefung (30-37)
- module-5/agency/ — Agency-Betrieb (38-44)
- _templates/ — TEMPLATE-LEKTION.html als Vorlage für neue Lektionen
- _demo/ — Beispiel-Outputs (nicht für Produktion)
- .claude/ — Claude Code Konfiguration

## Naming-Schema
M[Modul]-[Track]-[Nummer]-[Thema].html
Beispiel: M1-CC-01-Installation.html
- M1 = Modul 1
- CC = Track: Claude Code (T0 = Onramp)
- 01 = Lektion-Nummer (zweistellig)
- Installation = Thema (PascalCase mit Bindestrichen)

## Design-System (alle Lektionen)
- bg: #0F0F1A | cards: #1A1A2E | border: #2D2D4E
- accent: #7C3AED | secondary: #A855F7
- text: #E2E8F0 | muted: #94A3B8
- success: #10B981 | warning: #F59E0B | danger: #EF4444
- Font: Inter (Google Fonts)
- Template: _templates/TEMPLATE-LEKTION.html

## GitHub
https://github.com/realrisedani/claude-code
Account: realrisedani | Commits auf Deutsch
