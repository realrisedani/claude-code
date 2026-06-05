#!/bin/bash
# ─────────────────────────────────────────────────────────────
# RealRise Claude Code — MCP Must-Haves Setup
# Richtet 6 essentielle Server automatisch ein.
# Aufruf: bash setup-mcp.sh
# ─────────────────────────────────────────────────────────────

set -e
SETTINGS="$HOME/.claude/settings.json"
BOLD='\033[1m'; CYAN='\033[0;36m'; GREEN='\033[0;32m'; WARN='\033[0;33m'; RESET='\033[0m'

echo ""
echo -e "${BOLD}RealRise · MCP Must-Haves Setup${RESET}"
echo "────────────────────────────────────"

# Settings-Datei anlegen falls nicht vorhanden
if [ ! -f "$SETTINGS" ]; then
  mkdir -p "$HOME/.claude"
  echo '{"mcpServers":{}}' > "$SETTINGS"
  echo -e "${GREEN}✓ settings.json angelegt${RESET}"
fi

# GitHub Token holen
GH_TOKEN=""
if command -v gh &> /dev/null; then
  GH_TOKEN=$(gh auth token 2>/dev/null || echo "")
fi
if [ -z "$GH_TOKEN" ]; then
  echo ""
  echo -e "${WARN}GitHub Personal Access Token:${RESET}"
  echo "  → github.com → Settings → Developer settings → Personal access tokens"
  read -p "  Token eingeben (oder Enter zum Überspringen): " GH_TOKEN
fi

# Python-Script für die JSON-Manipulation
python3 << PYEOF
import json, os, sys

settings_path = os.path.expanduser("~/.claude/settings.json")
user_home = os.path.expanduser("~")
gh_token = os.environ.get("GH_TOKEN", "")

with open(settings_path) as f:
    config = json.load(f)

if "mcpServers" not in config:
    config["mcpServers"] = {}

servers = config["mcpServers"]
added = []
skipped = []

new_servers = {
    "memory": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "filesystem": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", f"{user_home}/Documents"]
    },
    "fetch": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "mcp-server-fetch"]
    },
    "playwright": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
}

# GitHub mit Token wenn vorhanden
gh_token_val = "${GH_TOKEN}"
if gh_token_val:
    new_servers["github"] = {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": gh_token_val}
    }

for name, cfg in new_servers.items():
    if name not in servers:
        servers[name] = cfg
        added.append(name)
    else:
        skipped.append(name)

with open(settings_path, "w") as f:
    json.dump(config, f, indent=2)

print(f"\n  Hinzugefügt:  {', '.join(added) if added else 'keine neuen'}")
print(f"  Übersprungen: {', '.join(skipped) if skipped else 'keine'}")
PYEOF

echo ""
echo -e "${BOLD}Status nach Setup:${RESET}"
echo "────────────────────────────────────"
python3 << 'STATUSEOF'
import json, os
with open(os.path.expanduser("~/.claude/settings.json")) as f:
    config = json.load(f)
servers = config.get("mcpServers", {})
for name, cfg in servers.items():
    has_token = bool(cfg.get("env") or cfg.get("headers"))
    env = cfg.get("env", {})
    token_set = any(v and "HIER" not in v and "..." not in v for v in env.values()) if env else True
    if has_token and not token_set:
        status = "⚠  Token fehlt noch"
    else:
        status = "✓  bereit"
    print(f"  {name:<22} {status}")
STATUSEOF

echo ""
echo -e "${CYAN}Nächste Schritte:${RESET}"
echo "  1. Claude Code neu starten (Strg+C → claude)"
echo "  2. Testen: 'claude mcp list' — oder direkt in einer Session fragen"
echo "  3. Für Netlify-Token: app.netlify.com/user/applications"
echo ""
echo -e "${GREEN}Setup abgeschlossen!${RESET}"
echo ""
