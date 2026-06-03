# CLAUDE.md — Projektregeln für claude-code

## Git & GitHub Workflow (immer aktiv)

Bei jedem neuen Projekt oder Unterordner **automatisch** ausführen:

### Einmaliges Setup
```bash
git init
git config --global user.name "danielstengel"
git config --global user.email "realriseag@gmail.com"
echo ".claude/settings.local.json" >> .gitignore
git add .
git commit -m "erster commit"
gh repo create <ordnername> --public --source=. --remote=origin --push
```

**GitHub Account**: `realrisedani` — Repo-Name = Ordnername

### Kontinuierliche Synchronisation (nach jeder Änderung)
```bash
git status        # Was hat sich geändert?
git add .         # Alles stagen
git commit -m ""  # Änderung beschreiben
git push          # Zu GitHub hochladen
```

## Sicherheitsregeln
- `.claude/settings.local.json` niemals committen (enthält API-Tokens)
- Diese Datei ist in `.gitignore` eingetragen

## Ziel
Doppelte Absicherung: lokal (Git) + remote (GitHub). Jederzeit und von überall zugreifbar.
