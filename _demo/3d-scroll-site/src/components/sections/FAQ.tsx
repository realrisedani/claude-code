"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection, AnimatedItem } from "@/components/ui/AnimatedSection";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";

const QUESTIONS = [
  {
    q: "Brauche ich technische Vorkenntnisse?",
    a: "Nein. Phase 1 ist explizit für Menschen ohne Programmierkenntnisse gebaut. Du arbeitest ausschließlich mit No-Code-Tools wie n8n, Make und Zapier — keine einzige Codezeile notwendig.",
  },
  {
    q: "Wann kann ich mit ersten Ergebnissen rechnen?",
    a: "Realistisch: 8–12 Wochen bis zum ersten zahlenden Kunden, wenn du täglich 2–3 Stunden investierst und die Module konsequent umsetzt. Module 3 und 4 bringen dich direkt in die Kundengewinnung.",
  },
  {
    q: "Was passiert nach den 90 Tagen?",
    a: "Module, Templates und die Prompt-Bibliothek bleiben dauerhaft zugänglich. Die Community läuft weiter. Phase 2 und 3 sind als Upgrades verfügbar, wenn du dich skalieren willst.",
  },
  {
    q: "Ist das nebenberuflich machbar?",
    a: "Ja. Das System ist für 2–3 Stunden täglich strukturiert und flexibel planbar. Viele Builder starten Phase 1 parallel zum Hauptberuf und wechseln erst mit konstantem Umsatz in Vollzeit.",
  },
  {
    q: "Welche Tools brauche ich?",
    a: "Mindestens ein Laptop und Internet. Den vollständigen Stack richtest du in Module 0 ein. Das monatliche Budget für alle Tools liegt unter €50.",
  },
  {
    q: "Bekomme ich persönliches Feedback?",
    a: "Ja. In den wöchentlichen Strategy Calls bekommst du direktes Feedback auf dein Angebot, dein Outreach und deine Delivery. Du bist nicht alleine in diesem Prozess.",
  },
  {
    q: "Warum RealRise und nicht ein anderes Programm?",
    a: "Drei Unterschiede: (1) Umsetzungs-System, kein reines Wissensarchiv. (2) High-Ticket-Fokus — keine €500-Freelance-Projekte. (3) Gebaut und betrieben von jemandem, der selbst aktiv als KI-Reseller arbeitet.",
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="px-6 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[800px]">
        <AnimatedSection className="flex flex-col items-center text-center mb-16">
          <AnimatedItem>
            <EyebrowBadge className="mb-5">FAQ</EyebrowBadge>
          </AnimatedItem>
          <AnimatedItem index={1}>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-[1.08]">
              Häufige <span className="gradient-text">Fragen</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem index={2}>
            <p className="mt-4 text-white/50 text-base max-w-[48ch] leading-relaxed">
              Alles, was du wissen musst — bevor du dich entscheidest.
            </p>
          </AnimatedItem>
        </AnimatedSection>

        <div className="flex flex-col gap-3">
          {QUESTIONS.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <AnimatedItem key={i} index={i * 0.08}>
                <button
                  className="w-full text-left rounded-[16px] p-5 transition-all duration-200"
                  style={{
                    background: isOpen ? "var(--surface-2)" : "var(--surface)",
                    border: isOpen ? "1px solid rgba(245,158,11,0.25)" : "1px solid var(--border)",
                  }}
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-semibold text-white text-sm md:text-base leading-snug">
                      {item.q}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-white/30 flex-shrink-0 text-lg mt-0.5"
                    >
                      +
                    </motion.span>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="overflow-hidden"
                      >
                        <p className="pt-4 mt-4 border-t border-white/[0.06] text-white/55 text-sm leading-relaxed">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </AnimatedItem>
            );
          })}
        </div>
      </div>
    </section>
  );
}
