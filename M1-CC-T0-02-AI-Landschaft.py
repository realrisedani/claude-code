from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# ── Farben ─────────────────────────────────────────────────────────────────────
C_BG        = colors.HexColor("#0F0F1A")
C_CARD      = colors.HexColor("#1A1A2E")
C_ACCENT    = colors.HexColor("#7C3AED")   # violet
C_ACCENT2   = colors.HexColor("#06B6D4")   # cyan
C_ACCENT3   = colors.HexColor("#10B981")   # green
C_WARN      = colors.HexColor("#F59E0B")   # amber
C_RED       = colors.HexColor("#EF4444")
C_WHITE     = colors.HexColor("#F1F5F9")
C_MUTED     = colors.HexColor("#94A3B8")
C_BORDER    = colors.HexColor("#2D2D4E")
C_CHATGPT   = colors.HexColor("#10A37F")
C_CLAUDE    = colors.HexColor("#D97706")
C_GEMINI    = colors.HexColor("#4285F4")
C_MANUS     = colors.HexColor("#8B5CF6")

W, H = A4  # 595 x 842 pt

# ── Styles ─────────────────────────────────────────────────────────────────────
def mk_style(name, font="Helvetica", size=10, color=C_WHITE,
             bold=False, align=TA_LEFT, leading=None, space_before=0, space_after=0):
    fn = "Helvetica-Bold" if bold else font
    return ParagraphStyle(
        name, fontName=fn, fontSize=size,
        textColor=color, alignment=align,
        leading=leading or size * 1.35,
        spaceBefore=space_before, spaceAfter=space_after
    )

S_TITLE    = mk_style("title",    size=32, bold=True,  color=C_WHITE, align=TA_CENTER, leading=40)
S_SUBTITLE = mk_style("subtitle", size=14, color=C_ACCENT2, align=TA_CENTER, leading=20)
S_META     = mk_style("meta",     size=10, color=C_MUTED,   align=TA_CENTER)
S_H1       = mk_style("h1",       size=22, bold=True,  color=C_WHITE, space_before=8, space_after=4)
S_H2       = mk_style("h2",       size=15, bold=True,  color=C_ACCENT2, space_before=6, space_after=3)
S_H3       = mk_style("h3",       size=12, bold=True,  color=C_ACCENT, space_before=4, space_after=2)
S_BODY     = mk_style("body",     size=10, color=C_WHITE, leading=16, space_after=4)
S_MUTED    = mk_style("muted",    size=9,  color=C_MUTED, leading=14)
S_BULLET   = mk_style("bullet",   size=10, color=C_WHITE, leading=16, space_after=2)
S_LABEL    = mk_style("label",    size=8,  bold=True, color=C_MUTED)
S_TAG      = mk_style("tag",      size=9,  bold=True, color=C_ACCENT, align=TA_CENTER)
S_GREEN    = mk_style("green",    size=10, color=C_ACCENT3, leading=15)
S_WARN     = mk_style("warn",     size=10, color=C_WARN, leading=15)
S_RED      = mk_style("red",      size=10, color=C_RED, leading=15)
S_CARD_H   = mk_style("cardh",    size=13, bold=True, color=C_WHITE)
S_PRICE    = mk_style("price",    size=11, bold=True, color=C_ACCENT3, align=TA_CENTER)
S_BIG      = mk_style("big",      size=18, bold=True, color=C_WHITE, align=TA_CENTER, leading=24)
S_CENTER   = mk_style("center",   size=10, color=C_WHITE, align=TA_CENTER, leading=16)
S_MYTH_Q   = mk_style("mythq",    size=11, bold=True, color=C_WARN, leading=16)
S_MYTH_A   = mk_style("mytha",    size=10, color=C_WHITE, leading=15)

# ── Background canvas callback ─────────────────────────────────────────────────
def bg_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(C_BG)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    # subtle grid lines
    canvas.setStrokeColor(colors.HexColor("#1E1E35"))
    canvas.setLineWidth(0.3)
    for x in range(0, int(W), 40):
        canvas.line(x, 0, x, H)
    for y in range(0, int(H), 40):
        canvas.line(0, y, W, y)
    # page number
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(C_MUTED)
    canvas.drawRightString(W - 20, 15, f"M1 · CC · T0-02 · Seite {doc.page}")
    canvas.drawString(20, 15, "Die AI-Landschaft — Track 0 · L2")
    canvas.restoreState()

# ── Helper flowables ────────────────────────────────────────────────────────────
def divider(color=C_BORDER, thickness=0.5):
    return HRFlowable(width="100%", thickness=thickness, color=color, spaceAfter=6, spaceBefore=6)

def spacer(h=8):
    return Spacer(1, h)

def card_table(rows, col_widths, style_extras=None):
    base = [
        ("BACKGROUND", (0,0), (-1,-1), C_CARD),
        ("GRID",       (0,0), (-1,-1), 0.3, C_BORDER),
        ("ROWPADDING", (0,0), (-1,-1), 8),
        ("LEFTPADDING",(0,0), (-1,-1), 10),
        ("RIGHTPADDING",(0,0),(-1,-1), 10),
        ("VALIGN",     (0,0), (-1,-1), "TOP"),
    ]
    if style_extras:
        base += style_extras
    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle(base))
    return t

def header_row_style(n_cols, bg=C_ACCENT):
    return [("BACKGROUND", (0,0), (n_cols-1, 0), bg),
            ("FONTNAME",   (0,0), (n_cols-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",   (0,0), (n_cols-1, 0), 9),
            ("TEXTCOLOR",  (0,0), (n_cols-1, 0), C_WHITE),
            ("ALIGN",      (0,0), (n_cols-1, 0), "CENTER")]

def hex6(color):
    return "%06X" % int(color.hexval(), 16)

def pill(text, bg=C_ACCENT, fg=C_WHITE):
    data = [[Paragraph(f"<b>{text}</b>", ParagraphStyle("p", fontName="Helvetica-Bold",
             fontSize=8, textColor=fg, alignment=TA_CENTER))]]
    t = Table(data, colWidths=[None])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg),
        ("ROWPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING",(0,0), (-1,-1), 8),
        ("RIGHTPADDING",(0,0),(-1,-1), 8),
        ("ROUNDEDCORNERS", [4]),
    ]))
    return t

def bullet(text, icon="▸", color=C_ACCENT2):
    ico = f'<font color="#{hex6(color)}">{icon}</font>'
    return Paragraph(f"{ico} {text}", S_BULLET)

def check(text):   return bullet(text, "✓", C_ACCENT3)
def cross(text):   return bullet(text, "✗", C_RED)
def warn_b(text):  return bullet(text, "⚠", C_WARN)

# ── Build content ───────────────────────────────────────────────────────────────
story = []

# ═══════════════════════════════════════════════════════════════════════════════
# SEITE 1 – Titelseite
# ═══════════════════════════════════════════════════════════════════════════════
story += [
    spacer(60),
    Paragraph("Track 0 · L2", S_MUTED),
    spacer(10),
    Paragraph("Die AI-Landschaft", S_TITLE),
    spacer(8),
    Paragraph("Welches Tool für welche Aufgabe?", S_SUBTITLE),
    spacer(20),
    divider(C_ACCENT, 1),
    spacer(14),
]

# Quick-Facts Kacheln
qf_data = [
    [Paragraph("⏱  15 Min", S_CENTER),
     Paragraph("🎯  Lernziel", S_CENTER),
     Paragraph("🛠  4 Tools", S_CENTER),
     Paragraph("📋  1 Übung", S_CENTER)],
    [Paragraph("Lesedauer", S_MUTED),
     Paragraph("Klarer mentaler Stack", S_MUTED),
     Paragraph("im Vergleich", S_MUTED),
     Paragraph("Praxis heute", S_MUTED)],
]
qf_t = Table(qf_data, colWidths=[130, 130, 130, 130])
qf_t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), C_CARD),
    ("GRID",       (0,0), (-1,-1), 0.3, C_BORDER),
    ("ROWPADDING", (0,0), (-1,-1), 10),
    ("ALIGN",      (0,0), (-1,-1), "CENTER"),
    ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
]))
story += [qf_t, spacer(20)]

story += [
    Paragraph("Was dich erwartet", S_H2),
    spacer(6),
]

overview_items = [
    ("01", "4 Hauptplayer", "ChatGPT · Claude · Gemini · Manus im direkten Vergleich"),
    ("02", "Decision-Guide", "8 typische Anwendungsfälle → welches Tool ist die beste Wahl"),
    ("03", "Warum Claude?", "Gründe, warum dieser Kurs auf Claude fokussiert"),
    ("04", "Beispiel-Stack", "Wie ein Agentur-Owner ~$60/Mo für alle 4 Tools budgetiert"),
    ("05", "AI-Grenzen", "Wo du KEINE AI einsetzen solltest"),
    ("06", "4 Mythen", "Die häufigsten Missverständnisse — und die Realität"),
    ("07", "Praxis-Übung", "5 reale Wochenaufgaben auswählen und sofort mit AI erledigen"),
]
ov_rows = [[Paragraph(f'<font color="#7C3AED"><b>{n}</b></font>', S_BODY),
            Paragraph(f"<b>{t}</b>", S_BODY),
            Paragraph(d, S_MUTED)]
           for n, t, d in overview_items]
ov_t = Table(ov_rows, colWidths=[30, 120, 368])
ov_t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), C_CARD),
    ("LINEBELOW",  (0,0), (-1,-1), 0.3, C_BORDER),
    ("ROWPADDING", (0,0), (-1,-1), 7),
    ("LEFTPADDING",(0,0), (-1,-1), 10),
    ("RIGHTPADDING",(0,0),(-1,-1), 8),
    ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
]))
story += [ov_t, PageBreak()]

# ═══════════════════════════════════════════════════════════════════════════════
# SEITE 2 – 4 Hauptplayer
# ═══════════════════════════════════════════════════════════════════════════════
story += [
    Paragraph("01 · Die 4 Hauptplayer", S_H1),
    divider(C_ACCENT),
    spacer(6),
    Paragraph(
        "Der KI-Markt konzentriert sich auf wenige Plattformen, die sich stark in ihren Stärken "
        "unterscheiden. Kein Tool ist universell am besten — aber jedes hat einen klaren Sweet Spot.",
        S_BODY),
    spacer(12),
]

# ── ChatGPT ──
def tool_block(icon, name, maker, color, strengths, weaknesses, use_when, pricing):
    title_para = Paragraph(
        f'<font color="#{hex6(color)}">{icon}  {name}</font>  '
        f'<font color="#94A3B8" size="9">von {maker}</font>',
        ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=14, textColor=C_WHITE))
    rows = [
        [Paragraph("<b>✓  Stärken</b>", ParagraphStyle("sh", fontName="Helvetica-Bold", fontSize=9, textColor=C_ACCENT3)),
         Paragraph("<b>✗  Schwächen</b>", ParagraphStyle("sh2", fontName="Helvetica-Bold", fontSize=9, textColor=C_RED)),
         Paragraph("<b>⚡  Wann nutzen</b>", ParagraphStyle("sh3", fontName="Helvetica-Bold", fontSize=9, textColor=C_ACCENT2)),
         Paragraph("<b>💰  Preis</b>", ParagraphStyle("sh4", fontName="Helvetica-Bold", fontSize=9, textColor=C_WARN))],
        [Paragraph(strengths, S_MUTED),
         Paragraph(weaknesses, S_MUTED),
         Paragraph(use_when, S_MUTED),
         Paragraph(pricing, S_MUTED)],
    ]
    inner = Table(rows, colWidths=[125, 115, 140, 108])
    inner.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#0F0F1A")),
        ("BACKGROUND", (0,1), (-1,1), C_CARD),
        ("GRID",       (0,0), (-1,-1), 0.3, C_BORDER),
        ("ROWPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",(0,0), (-1,-1), 8),
        ("VALIGN",     (0,0), (-1,-1), "TOP"),
    ]))
    outer_rows = [[title_para], [inner]]
    outer = Table(outer_rows, colWidths=[W - 60])
    outer.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), color),
        ("BACKGROUND", (0,1), (-1,1), C_CARD),
        ("LEFTPADDING",(0,0), (-1,-1), 12),
        ("RIGHTPADDING",(0,0),(-1,-1), 0),
        ("TOPPADDING", (0,0), (-1,-1), 8),
        ("BOTTOMPADDING",(0,0),(-1,-1), 8),
        ("LINEBELOW",  (0,0), (-1,-1), 1, color),
    ]))
    return [outer, spacer(10)]

story += tool_block(
    "🟢", "ChatGPT", "OpenAI", C_CHATGPT,
    "Größtes Ökosystem, DALL-E Bildgenerierung, Code Interpreter, GPTs (App-Store), Voice-Modus, Web-Suche, File-Uploads",
    "Teils oberflächliche Antworten bei komplexen Aufgaben, Halluzinationen bei Fakten, Tonalität wirkt generisch",
    "Bilder generieren, schnelle Allroundfragen, OpenAI-Plugins nutzen, Sprachaufgaben via Voice, GPT-Bots bauen",
    "Free: GPT-3.5\nPlus: $20/Mo\nTeam: $30/Mo\nAPI: variabel"
)
story += tool_block(
    "🟠", "Claude", "Anthropic", C_CLAUDE,
    "Überlegenes Reasoning, exzellentes Coding (Python, JS, SQL), langer Kontext (200k Token), natürliche Tonalität, sicherer & ehrlicher",
    "Kein Bildgenerator, kleineres Plugin-Ökosystem, gelegentlich zu vorsichtig/ablehend bei Grenzfällen",
    "Code schreiben & reviewen, lange Dokumente analysieren, Texte mit Persönlichkeit, Strategie-Denken, AI-Agents bauen",
    "Free: Claude Sonnet\nPro: $20/Mo\nAPI: ab $3/MTok\nTeams: $25/Mo"
)
story += tool_block(
    "🔵", "Gemini", "Google", C_GEMINI,
    "Tief in Google-Suite integriert (Docs, Gmail, Drive), Multimodal (Text+Bild+Audio+Video), Echtzeit-Websuche, 1M-Token-Kontext",
    "Reasoning schwächer als Claude/GPT-4o, Coding-Qualität schwankt, Datenschutz im Google-Ökosystem kritisch",
    "Google Workspace automatisieren, YouTube-Transkripte analysieren, Multimodale Aufgaben, Research mit aktuellen Daten",
    "Free: Gemini\nAdvanced: $22/Mo\nWorkspace-Add-on\nAPI: variabel"
)
story += tool_block(
    "🟣", "Manus", "Monica AI", C_MANUS,
    "Vollautonomer AI-Agent: plant, recherchiert, klickt, schreibt Code & liefert Endergebnis, Multi-Agenten-Orchestrierung",
    "Beta-Phase: unzuverlässig, langsam, teuer, keine Kontrolle über Zwischenschritte, Datenschutz unklar",
    "Komplexe mehrstufige Recherchen, Aufgaben die Browser-Steuerung erfordern, Report-Generierung von A bis Z",
    "Waitlist/Beta\nca. $39–79/Mo\n(Stand 2025)\nNoch kein API"
)

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════════════════
# SEITE 3 – Decision Guide
# ═══════════════════════════════════════════════════════════════════════════════
story += [
    Paragraph("02 · Decision-Guide", S_H1),
    divider(C_ACCENT),
    Paragraph("8 typische Anwendungsfälle — welches Tool ist die beste Wahl?", S_BODY),
    spacer(10),
]

def tool_badge(name, color):
    return Paragraph(
        f'<b><font color="#{hex6(color)}">{name}</font></b>',
        ParagraphStyle("badge", fontName="Helvetica-Bold", fontSize=9, textColor=color))

dg_header = [
    Paragraph("Anwendungsfall", ParagraphStyle("dgh", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE)),
    Paragraph("Best Tool", ParagraphStyle("dgh", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE)),
    Paragraph("Warum", ParagraphStyle("dgh", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE)),
    Paragraph("Alternative", ParagraphStyle("dgh", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE)),
]

dg_rows_data = [
    ("📧 Newsletter / E-Mail schreiben",        "Claude",  C_CLAUDE,   "Natürliche Tonalität, kein generischer Sound, versteht Marken-Voice",         "ChatGPT"),
    ("💻 Code schreiben & debuggen",             "Claude",  C_CLAUDE,   "Stärkstes Reasoning für Code-Logik, erklärt Fehler verständlich",              "ChatGPT"),
    ("🖼 Social-Media-Bilder generieren",        "ChatGPT", C_CHATGPT,  "Integriertes DALL-E 3, direkt im Chat nutzbar",                                "Midjourney"),
    ("📊 Google Sheet / Docs automatisieren",   "Gemini",  C_GEMINI,   "Native Google-Workspace-Integration, kein Copy-Paste nötig",                   "Claude"),
    ("🔍 Aktuelles Markt-Research",             "Gemini",  C_GEMINI,   "Echtzeit-Google-Suche, holt aktuelle Daten direkt ins Ergebnis",               "ChatGPT"),
    ("📄 Langes Dokument (100+ S.) analysieren","Claude",  C_CLAUDE,   "200k Token Kontext — liest das gesamte PDF auf einmal",                        "Gemini"),
    ("🤖 Vollautonomer Recherche-Agent",        "Manus",   C_MANUS,    "Plant und führt mehrstufige Browser-Aufgaben eigenständig aus",                "ChatGPT"),
    ("🎙 Voice-Gespräch / Audio-Aufgaben",      "ChatGPT", C_CHATGPT,  "Advanced Voice Mode: natürliche Echtzeit-Konversation",                        "Gemini"),
]

dg_rows = [dg_header]
for use, tool, color, why, alt in dg_rows_data:
    dg_rows.append([
        Paragraph(use, S_MUTED),
        tool_badge(tool, color),
        Paragraph(why, S_MUTED),
        Paragraph(alt, ParagraphStyle("alt", fontSize=8, textColor=C_MUTED)),
    ])

dg_t = Table(dg_rows, colWidths=[170, 65, 240, 65])
dg_t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), C_ACCENT),
    ("BACKGROUND", (0,1), (-1,-1), C_CARD),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [C_CARD, colors.HexColor("#1E1E35")]),
    ("GRID",       (0,0), (-1,-1), 0.3, C_BORDER),
    ("ROWPADDING", (0,0), (-1,-1), 8),
    ("LEFTPADDING",(0,0), (-1,-1), 10),
    ("RIGHTPADDING",(0,0),(-1,-1), 8),
    ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
    ("FONTNAME",   (0,0), (-1,0),  "Helvetica-Bold"),
    ("FONTSIZE",   (0,0), (-1,0),  9),
    ("TEXTCOLOR",  (0,0), (-1,0),  C_WHITE),
    ("ALIGN",      (1,0), (1,-1),  "CENTER"),
    ("ALIGN",      (3,0), (3,-1),  "CENTER"),
]))
story += [dg_t, spacer(14)]

story += [
    Paragraph("💡  Faustregeln auf einen Blick", S_H3),
    spacer(4),
    check("Schreiben mit Persönlichkeit → <b>Claude</b>"),
    check("Code & Logik → <b>Claude</b>"),
    check("Bilder & Voice → <b>ChatGPT</b>"),
    check("Google-Umgebung & aktuelle Daten → <b>Gemini</b>"),
    check("Vollautonome Mehrstufenaufgaben → <b>Manus</b>"),
    PageBreak(),
]

# ═══════════════════════════════════════════════════════════════════════════════
# SEITE 4 – Warum Claude / Beispiel-Stack / AI-Grenzen
# ═══════════════════════════════════════════════════════════════════════════════
story += [
    Paragraph("03 · Warum dieser Kurs auf Claude fokussiert", S_H1),
    divider(C_ACCENT),
    spacer(6),
]

why_data = [
    ("🧠", "Überlegenes Reasoning",
     "Claude schneidet in Benchmarks für mehrstufiges Denken (MMLU, HumanEval) konsistent stark ab. "
     "Komplex verschachtelte Aufgaben — wie Prompt-Chains oder Agenten-Designs — gelingen zuverlässiger."),
    ("💻", "Coding-Exzellenz",
     "Im direkten Vergleich liefert Claude bei Python, JavaScript und SQL saubereren, besser kommentierten Code. "
     "Besonders stark beim Debugging: Claude erklärt nicht nur den Fix, sondern das Warum dahinter."),
    ("✍️", "Natürliche Tonalität",
     "ChatGPT-Texte klingen oft nach Muster-KI. Claude schreibt — bei richtiger Anleitung — "
     "messbar menschlicher, variationsreicher und weniger formelhaft. Entscheidend für Content-Arbeit."),
    ("🔒", "Sicherheit & Ehrlichkeit",
     "Anthropic hat Constitional AI entwickelt: Claude sagt 'ich weiß es nicht' statt zu halluzinieren, "
     "ist bei ethischen Grenzfällen konsistenter und erfindet keine Fakten oder Quellen."),
    ("📄", "Langer Kontext (200k Token)",
     "Ein ganzes Buch, ein vollständiger Code-Repo oder 500 E-Mails auf einmal analysieren — "
     "das ist mit ChatGPT Free/Plus aktuell nicht möglich. Für Agentur-Arbeit ein Game-Changer."),
    ("🔗", "API & Agents",
     "Die Claude API ist developer-freundlich, gut dokumentiert und bildet die Grundlage für "
     "viele AI-Agent-Frameworks (LangChain, AutoGPT, eigene Pipelines)."),
]
why_rows = [[
    Paragraph(icon, ParagraphStyle("ic", fontSize=16, alignment=TA_CENTER)),
    Paragraph(f"<b>{title}</b>", S_BODY),
    Paragraph(desc, S_MUTED),
] for icon, title, desc in why_data]
why_t = Table(why_rows, colWidths=[30, 130, 378])
why_t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), C_CARD),
    ("LINEBELOW",  (0,0), (-1,-1), 0.3, C_BORDER),
    ("ROWPADDING", (0,0), (-1,-1), 7),
    ("LEFTPADDING",(0,0), (-1,-1), 10),
    ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
]))
story += [why_t, spacer(20)]

# ── Beispiel-Stack ──────────────────────────────────────────────────────────────
story += [
    Paragraph("04 · Beispiel AI-Stack eines Agentur-Owners (~$60/Mo)", S_H1),
    divider(C_ACCENT),
    spacer(6),
]

stack_data = [
    [Paragraph("Tool", ParagraphStyle("sh", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE)),
     Paragraph("Plan", ParagraphStyle("sh", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE)),
     Paragraph("Monatl. Kosten", ParagraphStyle("sh", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE)),
     Paragraph("Primärer Use Case", ParagraphStyle("sh", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE))],
    [tool_badge("Claude Pro", C_CLAUDE), Paragraph("Pro", S_MUTED), Paragraph("$20", S_PRICE), Paragraph("Texte, Code, Strategie, Long-Docs", S_MUTED)],
    [tool_badge("ChatGPT Plus", C_CHATGPT), Paragraph("Plus", S_MUTED), Paragraph("$20", S_PRICE), Paragraph("DALL-E Bilder, Voice, GPT-Bots", S_MUTED)],
    [tool_badge("Gemini Advanced", C_GEMINI), Paragraph("Advanced", S_MUTED), Paragraph("$22", S_PRICE), Paragraph("Google Docs/Sheets, aktuelles Research", S_MUTED)],
    [tool_badge("Manus", C_MANUS), Paragraph("Beta", S_MUTED), Paragraph("~$0–20", S_PRICE), Paragraph("Gelegentlich für autonome Recherchen", S_MUTED)],
    [Paragraph("<b>GESAMT</b>", S_BODY), Paragraph("", S_MUTED), Paragraph("<b>~$62/Mo</b>", ParagraphStyle("tot", fontName="Helvetica-Bold", fontSize=11, textColor=C_ACCENT3, alignment=TA_CENTER)), Paragraph("Vollständige AI-Werkzeugkiste", S_MUTED)],
]
stack_t = Table(stack_data, colWidths=[130, 80, 100, 228])
stack_t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), C_ACCENT),
    ("BACKGROUND", (0,1), (-1,4), C_CARD),
    ("BACKGROUND", (0,5), (-1,5), colors.HexColor("#1A2E1A")),
    ("GRID",       (0,0), (-1,-1), 0.3, C_BORDER),
    ("ROWPADDING", (0,0), (-1,-1), 8),
    ("LEFTPADDING",(0,0), (-1,-1), 10),
    ("ALIGN",      (2,0), (2,-1), "CENTER"),
    ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
]))
story += [stack_t, spacer(6),
    Paragraph(
        "💡  <b>Praxis-Tipp:</b> Starte mit Claude Pro ($20). Füge ChatGPT Plus nur dazu, wenn du regelmäßig "
        "Bilder oder Voice brauchst. Gemini lohnt sich erst bei starker Google-Workspace-Nutzung.",
        ParagraphStyle("tip", fontName="Helvetica", fontSize=9, textColor=C_WARN, leading=14,
                       backColor=colors.HexColor("#1A1500"), leftPadding=10, rightPadding=10,
                       borderPadding=8)),
    PageBreak(),
]

# ═══════════════════════════════════════════════════════════════════════════════
# SEITE 5 – AI-Grenzen + Mythen
# ═══════════════════════════════════════════════════════════════════════════════
story += [
    Paragraph("05 · Wo du KEINE AI nutzen solltest", S_H1),
    divider(C_RED, 1),
    spacer(6),
]

limits = [
    ("🔐", "Vertrauliche Kundendaten",
     "Keine Namen, E-Mails, Finanzinfos, Gesundheitsdaten oder NDA-geschützte Inhalte in öffentliche KI-Systeme (ChatGPT, Claude.ai, Gemini) eingeben. "
     "Ausnahme: Self-hosted Modelle oder Enterprise-Pläne mit Datenschutzgarantie (z.B. Claude for Enterprise, Azure OpenAI)."),
    ("⚖️", "Finale rechtliche / medizinische Entscheidungen",
     "AI kann recherchieren, zusammenfassen und Optionen aufzeigen — aber KEIN Anwalt oder Arzt ersetzen. "
     "Immer Fachexpert:in für finale Entscheidung einbeziehen."),
    ("📢", "Ungecheckte Faktenaussagen öffentlich publishen",
     "AI halluziniert — vor allem bei Zahlen, Daten, Personennamen und spezifischen Quellen. "
     "Alles was öffentlich kommuniziert wird, muss geprüft werden."),
    ("🧑‍💼", "Personalentscheidungen ohne menschlichen Review",
     "Automatisches Screening von Bewerbungen per AI ohne menschliche Kontrolle ist ethisch fragwürdig "
     "und in vielen EU-Ländern rechtlich problematisch (AI Act)."),
    ("🔒", "Passwörter, API-Keys, Zugangsdaten",
     "Niemals Credentials in KI-Chats einfügen — auch nicht 'nur zum Testen'. Chat-Verläufe können in Trainings einfließen."),
]
lim_rows = [[
    Paragraph(icon, ParagraphStyle("li", fontSize=14, alignment=TA_CENTER)),
    Paragraph(f"<b>{title}</b>", S_BODY),
    Paragraph(desc, S_MUTED),
] for icon, title, desc in limits]
lim_t = Table(lim_rows, colWidths=[28, 150, 360])
lim_t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#1A0F0F")),
    ("LINEBELOW",  (0,0), (-1,-1), 0.3, colors.HexColor("#3D1515")),
    ("ROWPADDING", (0,0), (-1,-1), 7),
    ("LEFTPADDING",(0,0), (-1,-1), 10),
    ("VALIGN",     (0,0), (-1,-1), "TOP"),
    ("LINERIGHT",  (0,0), (0,-1), 2, C_RED),
]))
story += [lim_t, spacer(20)]

# ── Mythen ──────────────────────────────────────────────────────────────────────
story += [
    Paragraph("06 · 4 verbreitete Mythen — und die Realität", S_H1),
    divider(C_WARN, 1),
    spacer(6),
]

myths = [
    ("Mythos", '„AI ersetzt bald alle Jobs in meiner Branche vollständig.“',
     "Realität", "AI ersetzt Aufgaben, nicht Berufe. Wer AI nutzt, wird Menschen ersetzen die es nicht tun. "
     "Der Vorteil gehört denen, die das Tool frühzeitig beherrschen — nicht dem Tool selbst."),
    ("Mythos", '„ChatGPT / Claude weiß alles und ist immer korrekt.“',
     "Realität", "Alle LLMs halluzinieren. Sie sind Wahrscheinlichkeitsmaschinen, keine Datenbanken. "
     "Spezifische Fakten, aktuelle Ereignisse und Zahlen müssen immer verifiziert werden."),
    ("Mythos", '„AI-Texte erkennt man sofort — das klingt immer maschinell.“',
     "Realität", "Mit dem richtigen Prompting und einem eigenen Voice-Briefing entstehen Texte, "
     "die nicht von menschlichen zu unterscheiden sind. Das Problem ist meistens der Prompt, nicht das Modell."),
    ("Mythos", '„Je länger der Prompt, desto besser das Ergebnis.“',
     "Realität", "Qualität schlägt Quantität. Ein präziser 3-Satz-Prompt mit klarem Ziel, Kontext und Format "
     "übertrifft einen 1000-Wort-Prompt ohne Struktur. Klarheit ist die wichtigste Prompt-Tugend."),
]

myth_rows = []
for i, (m_label, myth, r_label, reality) in enumerate(myths):
    bg = colors.HexColor("#1A1500") if i % 2 == 0 else colors.HexColor("#13100A")
    myth_rows.append([
        Table([[Paragraph(f"<b>🚫 {m_label}</b>", ParagraphStyle("ml", fontName="Helvetica-Bold", fontSize=8, textColor=C_WARN))]], colWidths=[538]),
    ])
    myth_rows.append([Paragraph(f'<i>"{myth}"</i>', S_MYTH_Q)])
    myth_rows.append([
        Paragraph(f"<b>✓ {r_label}:</b>  {reality}", S_MYTH_A),
    ])
    myth_rows.append([spacer(4)])

myth_t = Table(myth_rows, colWidths=[538])
myth_t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), C_CARD),
    ("LEFTPADDING",(0,0), (-1,-1), 14),
    ("RIGHTPADDING",(0,0),(-1,-1), 14),
    ("TOPPADDING", (0,0), (-1,-1), 4),
    ("BOTTOMPADDING",(0,0),(-1,-1), 4),
    ("LINEBELOW",  (0,2), (-1,2), 0.5, C_BORDER),
    ("LINEBELOW",  (0,6), (-1,6), 0.5, C_BORDER),
    ("LINEBELOW",  (0,10), (-1,10), 0.5, C_BORDER),
]))
story += [myth_t, PageBreak()]

# ═══════════════════════════════════════════════════════════════════════════════
# SEITE 6 – Praxis-Übung
# ═══════════════════════════════════════════════════════════════════════════════
story += [
    Paragraph("07 · Praxis-Übung", S_H1),
    divider(C_ACCENT3, 1),
    Paragraph(
        "Dein mentaler Stack ist nur so gut wie deine praktische Erfahrung damit. "
        "Diese Übung bringt dich vom Wissen ins Tun — heute, nicht irgendwann.",
        S_BODY),
    spacer(12),
    Paragraph("Anleitung", S_H2),
    spacer(4),
]

steps = [
    ("1", "Liste 5 reale Aufgaben aus deiner nächsten Woche auf",
     "Z.B. Newsletter schreiben, Angebot formulieren, Meeting-Protokoll strukturieren, "
     "Konkurrenz recherchieren, Social-Post für Instagram, Code-Snippet bauen, …"),
    ("2", "Wähle für jede Aufgabe das beste Tool aus dem Decision-Guide",
     "Nutze die Tabelle auf Seite 3. Begründe kurz warum — das festigt die Logik in deinem Kopf."),
    ("3", "Erledige mindestens 2 dieser Aufgaben heute mit AI",
     "Nicht theoretisch, nicht morgen. Öffne das Tool, schreib den Prompt, schau was rauskommt. "
     "Auch ein misslungenes Ergebnis ist wertvolles Feedback."),
    ("4", "Dokumentiere: Was hat gut/schlecht funktioniert?",
     "1–2 Sätze pro Aufgabe reichen. Diese Mini-Reflexion ist die Basis für bessere Prompts in L3."),
]

for num, title, desc in steps:
    row = [[
        Paragraph(f'<font color="#7C3AED" size="18"><b>{num}</b></font>',
                  ParagraphStyle("sn", fontName="Helvetica-Bold", fontSize=18,
                                 textColor=C_ACCENT, alignment=TA_CENTER)),
        [Paragraph(f"<b>{title}</b>", S_BODY), Paragraph(desc, S_MUTED)],
    ]]
    rt = Table(row, colWidths=[40, 498])
    rt.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), C_CARD),
        ("LINEBEFORE",  (0,0), (0,-1), 3, C_ACCENT),
        ("ROWPADDING",  (0,0), (-1,-1), 10),
        ("LEFTPADDING", (0,0), (-1,-1), 12),
        ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
    ]))
    story += [rt, spacer(8)]

story += [spacer(10)]

# ── Aufgaben-Template ──────────────────────────────────────────────────────────
story += [
    Paragraph("Dein Aufgaben-Template (zum Ausfüllen)", S_H2),
    spacer(6),
]

template_header = [
    Paragraph("#", ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE)),
    Paragraph("Meine Aufgabe", ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE)),
    Paragraph("Bestes Tool", ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE)),
    Paragraph("Heute erledigt?", ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE)),
    Paragraph("Notiz / Ergebnis", ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE)),
]
template_rows = [template_header]
for i in range(1, 6):
    template_rows.append([
        Paragraph(str(i), S_MUTED),
        Paragraph("", S_MUTED),
        Paragraph("", S_MUTED),
        Paragraph("☐ Ja  ☐ Nein", S_MUTED),
        Paragraph("", S_MUTED),
    ])

tmpl_t = Table(template_rows, colWidths=[20, 170, 80, 80, 188])
tmpl_t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), C_ACCENT),
    ("BACKGROUND", (0,1), (-1,-1), C_CARD),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [C_CARD, colors.HexColor("#1E1E35")]),
    ("GRID",       (0,0), (-1,-1), 0.3, C_BORDER),
    ("ROWPADDING", (0,0), (-1,-1), 14),
    ("LEFTPADDING",(0,0), (-1,-1), 8),
    ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
]))
story += [tmpl_t, spacer(14)]

# ── Bonus-Prompts ──────────────────────────────────────────────────────────────
story += [
    Paragraph("Bonus: Starter-Prompts für deine ersten Versuche", S_H2),
    spacer(4),
]

prompts = [
    ("Claude", C_CLAUDE,
     "Schreib mir eine E-Mail an einen potenziellen Kunden. Anlass: [ANLASS]. "
     "Ton: professionell aber persönlich. Länge: max. 150 Wörter. Keine Floskeln."),
    ("ChatGPT", C_CHATGPT,
     "Generate a professional Instagram post image for [BRAND]. Style: minimalist, dark background, "
     "white text. Include: headline '[TEXT]' and a subtle logo placeholder."),
    ("Gemini", C_GEMINI,
     "Analysiere die letzten 10 E-Mails in meinem Gmail-Postfach und erstelle eine Zusammenfassung: "
     "Welche Themen sind dringend? Was kann ich delegieren?"),
]

for tool, color, prompt in prompts:
    pr_data = [[
        Paragraph(f'<b><font color="#{hex6(color)}">{tool}</font></b>',
                  ParagraphStyle("pt", fontName="Helvetica-Bold", fontSize=9, textColor=color)),
        Paragraph(f'<i>"{prompt}"</i>',
                  ParagraphStyle("pp", fontName="Helvetica-Oblique", fontSize=9,
                                 textColor=C_MUTED, leading=14)),
    ]]
    pr_t = Table(pr_data, colWidths=[65, 473])
    pr_t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#0F0F1A")),
        ("LINEBEFORE", (0,0), (0,-1), 3, color),
        ("ROWPADDING", (0,0), (-1,-1), 8),
        ("LEFTPADDING",(0,0), (-1,-1), 12),
        ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
    ]))
    story += [pr_t, spacer(5)]

story += [spacer(14), divider(C_BORDER), spacer(6),
    Paragraph(
        "🚀  <b>Dein Ziel für heute:</b>  Mindestens 2 echte Aufgaben mit AI erledigen. "
        "Perfekte Ergebnisse sind kein Ziel — Erfahrung sammeln ist das Ziel.",
        ParagraphStyle("cta", fontName="Helvetica-Bold", fontSize=11, textColor=C_ACCENT3,
                       leading=16, backColor=colors.HexColor("#0A1A0A"),
                       borderPadding=12, leftPadding=14)),
    spacer(8),
    Paragraph("Weiter mit: M1-CC-T0-03 · Prompt-Engineering Grundlagen →", S_MUTED),
]

# ── Build PDF ──────────────────────────────────────────────────────────────────
out = "/Users/danielstengel/claude-code/M1-CC-T0-02-AI-Landschaft.pdf"
doc = SimpleDocTemplate(
    out, pagesize=A4,
    leftMargin=30, rightMargin=30,
    topMargin=28, bottomMargin=28,
    title="Die AI-Landschaft — M1 CC T0-02",
    author="Claude Code",
)
doc.build(story, onFirstPage=bg_page, onLaterPages=bg_page)
print(f"PDF erstellt: {out}")
