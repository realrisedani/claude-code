"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection, AnimatedItem } from "@/components/ui/AnimatedSection";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";

const MODULES = [
  {
    id: 0,
    emoji: "🚀",
    title: "Module 0 — Quickstart & Mindset",
    timeline: "Tage 1–2",
    milestone: null,
    topics: [
      "Business-Modell verstehen",
      "Tool-Stack einrichten",
      "Community-Zugang",
      "90-Tage-Planung aufstellen",
    ],
  },
  {
    id: 1,
    emoji: "🧠",
    title: "Module 1 — KI-Grundlagen meistern",
    timeline: "Wochen 1–2",
    milestone: null,
    topics: [
      "ChatGPT / Claude / Gemini im Vergleich",
      "Prompt Engineering",
      "Automatisierungs-Plattformen",
      "No-Code KI-Assistenten",
    ],
  },
  {
    id: 2,
    emoji: "🎯",
    title: "Module 2 — Angebot & Positionierung",
    timeline: "Wochen 2–4",
    milestone: "Checkpoint: Dein Angebot steht",
    topics: [
      "Nischen-Analyse",
      "3-Stufen-Angebot erstellen",
      "Preisgestaltung & USP",
      "Case Studies & Branding",
    ],
  },
  {
    id: 3,
    emoji: "📞",
    title: "Module 3 — Kundengewinnung & Outreach",
    timeline: "Wochen 4–6",
    milestone: null,
    topics: [
      "Cold Outreach System",
      "LinkedIn-Strategie",
      "E-Mail-Kampagnen",
      "CRM & Lead-Pipeline",
    ],
  },
  {
    id: 4,
    emoji: "💰",
    title: "Module 4 — Sales & Closing",
    timeline: "Wochen 6–8",
    milestone: "Meilenstein: Erster Kunde €3–5K",
    topics: [
      "Closing-Skripte",
      "Einwandbehandlung",
      "ROI-Argumentation",
      "Vertragsabschluss",
    ],
  },
  {
    id: 5,
    emoji: "⚙️",
    title: "Module 5 — Fulfillment & Delivery",
    timeline: "Wochen 8–10",
    milestone: null,
    topics: [
      "Projekt-Setup & Onboarding",
      "KI-Assistenten bauen",
      "Workflow-Automatisierung",
      "Voice-Systeme & Kunden-Training",
    ],
  },
  {
    id: 6,
    emoji: "📈",
    title: "Module 6 — Skalierung & Systeme",
    timeline: "Wochen 10–12",
    milestone: "Meilenstein: €10K+/Monat",
    topics: [
      "Recurring-Revenue-Modelle",
      "Prozess-Dokumentation",
      "Team-Building",
      "Upselling & Referrals",
    ],
  },
];

export function Roadmap() {
  const [openId, setOpenId] = useState<number | null>(0);

  return (
    <section id="fahrplan" className="px-6 py-24 md:px-8 md:py-32 relative">
      <div className="mx-auto max-w-[1200px]">
        <AnimatedSection className="flex flex-col items-center text-center mb-16">
          <AnimatedItem>
            <EyebrowBadge className="mb-5">Phase 1 — Fahrplan</EyebrowBadge>
          </AnimatedItem>
          <AnimatedItem index={1}>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-[1.08]">
              Dein Weg zum{" "}
              <span className="gradient-text">ersten Kunden</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem index={2}>
            <p className="mt-4 text-white/50 text-base md:text-lg max-w-[52ch] leading-relaxed">
              7 Module in 90 Tagen. Jede Woche bringt dich näher an deinen ersten High-Ticket-Kunden.
            </p>
          </AnimatedItem>
        </AnimatedSection>

        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-8 top-0 bottom-0 w-px hidden md:block"
            style={{ background: "linear-gradient(180deg, var(--accent-from), var(--accent-to), transparent)" }}
          />

          <div className="flex flex-col gap-3">
            {MODULES.map((mod, i) => {
              const isOpen = openId === mod.id;
              return (
                <AnimatedItem key={mod.id} index={i * 0.5}>
                  <div className="md:pl-20 relative">
                    {/* Timeline dot */}
                    <div
                      className="absolute left-[26px] top-5 w-4 h-4 rounded-full hidden md:flex items-center justify-center"
                      style={{
                        background: isOpen
                          ? "linear-gradient(135deg, var(--accent-from), var(--accent-to))"
                          : "var(--surface-3)",
                        border: "2px solid var(--background)",
                        boxShadow: isOpen ? "0 0 12px rgba(245,158,11,0.5)" : "none",
                        transition: "all 0.3s ease",
                      }}
                    />

                    <button
                      className="w-full text-left rounded-[16px] p-5 transition-all duration-300"
                      style={{
                        background: isOpen ? "var(--surface-2)" : "var(--surface)",
                        border: isOpen ? "1px solid rgba(245,158,11,0.3)" : "1px solid var(--border)",
                        boxShadow: isOpen ? "0 0 30px rgba(245,158,11,0.06)" : "none",
                      }}
                      onClick={() => setOpenId(isOpen ? null : mod.id)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{mod.emoji}</span>
                          <div>
                            <p className="font-semibold text-white text-sm md:text-base">{mod.title}</p>
                            <p className="text-white/40 text-xs mt-0.5">{mod.timeline}</p>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.25 }}
                          className="text-white/30 flex-shrink-0"
                        >
                          ↓
                        </motion.div>
                      </div>

                      {/* Milestone badge */}
                      {mod.milestone && (
                        <div
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: "rgba(52,211,153,0.08)",
                            border: "1px solid rgba(52,211,153,0.2)",
                            color: "var(--accent-green)",
                          }}
                        >
                          ✓ {mod.milestone}
                        </div>
                      )}

                      {/* Expanded content */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 mt-4 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {mod.topics.map((topic) => (
                                <div key={topic} className="flex items-start gap-2.5">
                                  <div
                                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                    style={{ background: "var(--accent-from)" }}
                                  />
                                  <span className="text-white/60 text-sm">{topic}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </AnimatedItem>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
