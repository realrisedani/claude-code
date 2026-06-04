# Track 1 — Aufnahme-Plan

Für jede Lektion: Typ, Praxis ja/nein, Overlap mit Track 0, die EINE Kernbotschaft, Dauer.
Methode siehe [AUFNAHME-METHODE.md](AUFNAHME-METHODE.md).

Legende: 🟢 RECAP (kein Demo) · 🔵 WERKZEUG (1 Demo) · 🟣 DENKEN (kein Demo)

---

## ⚠ Zuerst entscheiden: 2 Dopplungen auflösen

Es gibt 2 Paare mit gleicher Nummer und fast gleichem Thema:

1. **Phasen:** `M1-CC-02-Mental-Model` (Konzept) ↔ `M1-CC-02-Phasen-Kontrolle` (Praxis)
2. **Permissions:** `M1-CC-03-Permission-Discipline` (Konzept) ↔ `M1-CC-03-Permission-Praxis` (Praxis)

**Empfehlung:** Je Paar zu EINER Lektion zusammenlegen (Konzept + Praxis in einem).
Weniger Lektionen, keine Verwirrung. Der Plan unten geht von dieser Auflösung aus.
Die jüngeren „-Praxis/-Kontrolle"-Dateien sind die handlungsorientierten — die behalten.

---

## Der Plan (finale Reihenfolge nach Auflösung)

| Nr | Lektion | Typ | Praxis | Overlap T0 | Kernbotschaft (1 Satz) | Dauer |
|----|---------|-----|--------|-----------|------------------------|-------|
| 01 | Installation & 3 Modi | 🟢 | nein | **JA** (Install in T0-07) | "Installiert hast du — jetzt lernst du die 3 Modi, die alles steuern." | 6 |
| 02 | Mental Model & Phasen | 🟣 | klein | nein | "Claude arbeitet in 4 Phasen — du musst erkennen wo er ist." | 10 |
| 03 | Permissions & Git-Disziplin | 🔵 | ja | nein | "Accept Edits ohne sauberen git-Stand ist russisch Roulette." | 14 |
| 04 | Slash Commands Tour | 🔵 | ja | nein | "12 Befehle, die du im Schlaf kennen musst." | 14 |
| 05 | Cost & Token Economy | 🟣 | nein | leicht (T0-03 Abo) | "Du zahlst für Kontext — lern ihn schlank zu halten." | 9 |
| 06 | IDE Integration | 🔵 | ja | leicht (VS Code T0) | "Claude lebt in deinem Editor, nicht nur im Terminal." | 10 |
| 07 | CLAUDE.md ⭐ | 🔵 | ja | nein | "Eine Datei, die Claude dein Projekt versteht — das wichtigste Feature." | 16 |
| 08 | Memory | 🔵 | ja | nein | "Schreib deine Regeln einmal, Claude merkt sie sich für immer." | 13 |
| 09 | Context Management | 🟣 | klein | nein | "Volles Kontextfenster = dummer Claude. So hältst du ihn schlau." | 10 |
| 10 | Session Lifecycle | 🔵 | ja | nein | "/clear, resume, state.md — so verlierst du nie den Faden." | 13 |
| 11 | Spec-Driven Development | 🔵 | ja | nein | "Erst Spec, dann Code — sonst baut Claude das Falsche." | 15 |
| 12 | Plan Mode tief | 🔵 | ja | nein | "Bei großen Features: planen lassen, bevor er anfasst." | 14 |
| 13 | Parallele Tool-Calls | 🟣 | klein | nein | "Mehrere Reads gleichzeitig = schneller & billiger." | 9 |
| 14 | Sub-Agents | 🔵 | ja | nein | "Lass Claude Helfer losschicken statt selbst alles zu lesen." | 15 |
| 15 | Worktrees | 🔵 | ja | nein | "Großer Umbau? In eigenem Arbeitsbereich, ohne Risiko." | 13 |
| 16 | Debugging Workflow | 🔵 | ja | nein | "5 Phasen, um jeden Bug systematisch zu erlegen." | 15 |
| 17 | TDD mit Claude | 🔵 | ja | nein | "Tests zuerst — Claude tippt den Code, du tippst nichts." | 15 |
| 18 | Refactoring Patterns | 🔵 | ja | nein | "Sauber umbauen mit Tests grün und atomaren Commits." | 14 |
| 19 | MCP Intro | 🔵 | ja | nein | "MCP gibt Claude Augen & Hände in andere Tools." | 15 |
| 20 | MCP Must-Haves | 🔵 | ja | nein | "Die Server, die jede Agentur braucht — live angeschlossen." | 14 |
| 21 | Skills | 🔵 | ja | nein | "Eingebaute Superkräfte + dein eigener Skill." | 15 |
| 22 | Hooks | 🔵 | ja | nein | "Automatik: Claude formatiert/testet ohne dass du fragst." | 15 |
| 23 | Custom Slash Commands | 🔵 | ja | nein | "Deine täglichen Abläufe als ein-Wort-Befehle." | 14 |
| 24 | settings.json Mastery | 🔵 | ja | nein | "Alle Einstellungen an einem Ort — der Profi-Hebel." | 14 |
| 25 | Git Workflow | 🔵 | ja | leicht (Git T0-06) | "Profi-Commits & saubere PRs — über Basics hinaus." | 13 |
| 26 | Code Review | 🔵 | ja | nein | "/code-review vor jedem Commit — dein zweites Augenpaar." | 12 |
| 27 | PR-Babysitting | 🔵 | ja | nein | "CI rot → Claude macht sie grün, ohne dich." | 14 |
| 28 | CI/CD mit Claude | 🔵 | ja | nein | "Claude läuft in GitHub Actions — automatisch im Hintergrund." | 15 |
| 29 | Deploy Patterns | 🔵 | ja | nein | "Sicher deployen, in <5 Min zurückrollen, draus lernen." | 14 |

**Summe Track 1:** ca. 5,5 Std reine Lektions-Zeit (29 Lektionen).

---

## Cluster — am Stück aufnehmen (spart Kontext-Wechsel)

- **Setup-Cluster:** 01–03 (Installation, Phasen, Permissions)
- **Konfig-Cluster:** 07, 08, 24 (CLAUDE.md, Memory, settings.json)
- **MCP-Cluster:** 19 + 20 (zusammenhängend)
- **Qualitäts-Cluster:** 16–18 (Debug, TDD, Refactor)
- **Ship-Cluster:** 25–29 (Git, Review, PR, CI/CD, Deploy)

---

## Die Praxis-Frage — kurz beantwortet

- **Voll-Demo zeigen:** beim ERSTEN Mal eines Mechanismus (siehe Demo-Spar-Regel).
  In Track 1 also vor allem bei 07 (CLAUDE.md), dann Tempo rausnehmen.
- **Nur drüber reden:** alle 🟣-Lektionen (02, 05, 09, 13) + die 🟢 (01).
- **Faustregel:** ~18 von 29 brauchen eine echte Demo, der Rest ist Reden über Slides.
