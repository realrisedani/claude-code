"use client";

import { motion } from "framer-motion";
import { AnimatedSection, AnimatedItem } from "@/components/ui/AnimatedSection";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";

const VALUES = [
  {
    emoji: "🖥️",
    title: "Phase-1 Operating System",
    desc: "7 Module, logisch aufgebaut — vom ersten Tag bis zum skalierbaren Umsatz.",
    value: "€2.997",
    highlight: true,
  },
  {
    emoji: "🤝",
    title: "Community & Support",
    desc: "Direktes Feedback und Aktivierungssystem mit anderen Buildern auf demselben Weg.",
    value: "€1.997/Jahr",
    highlight: false,
  },
  {
    emoji: "⚡",
    title: "Prompt OS + Client Templates",
    desc: "Kuratierte Prompts und Strukturen, die du sofort in Kundenprojekte einsetzen kannst.",
    value: "€497",
    highlight: false,
  },
  {
    emoji: "📊",
    title: "Sales Systems & Scripts",
    desc: "Bewährte Outreach-, Discovery- und Closing-Frameworks — direkt einsatzbereit.",
    value: "€997",
    highlight: false,
  },
  {
    emoji: "📅",
    title: "Weekly Strategy Calls",
    desc: "Direktes Feedback auf dein Angebot, dein Outreach und deine Delivery. Wöchentlich.",
    value: "€2.997/Jahr",
    highlight: true,
  },
  {
    emoji: "🛠️",
    title: "Setup Stack & Onboarding Layer",
    desc: "Tool-Setup und Implementierungsführung — du startest von Tag 1 an mit dem richtigen Stack.",
    value: "€297",
    highlight: false,
  },
];

export function ValueProps() {
  return (
    <section id="leistungen" className="px-6 py-24 md:px-8 md:py-32 relative overflow-hidden">
      {/* Background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(245,158,11,0.04) 0%, transparent 100%)" }}
      />

      <div className="mx-auto max-w-[1200px]">
        <AnimatedSection className="flex flex-col items-center text-center mb-16">
          <AnimatedItem>
            <EyebrowBadge className="mb-5">Was du bekommst</EyebrowBadge>
          </AnimatedItem>
          <AnimatedItem index={1}>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-[1.08] max-w-[22ch]">
              Was Phase 1{" "}
              <span className="gradient-text">wirklich liefert</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem index={2}>
            <p className="mt-4 text-white/50 text-base md:text-lg max-w-[52ch] leading-relaxed">
              Nicht eine Content-Sammlung. Ein Umsetzungs-System, das dich Schritt für Schritt zum Ergebnis führt.
            </p>
          </AnimatedItem>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {VALUES.map((val, i) => (
            <AnimatedItem key={val.title} index={i * 0.15}>
              <div
                className="h-full rounded-[20px] p-6 flex flex-col gap-4 transition-transform hover:-translate-y-1"
                style={{
                  background: val.highlight ? "var(--surface-2)" : "var(--surface)",
                  border: val.highlight
                    ? "1px solid rgba(245,158,11,0.25)"
                    : "1px solid var(--border)",
                  boxShadow: val.highlight ? "var(--shadow-neu)" : "var(--shadow-card)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      background: val.highlight ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)",
                      border: val.highlight ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {val.emoji}
                  </div>
                  <span
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: "var(--accent-from)" }}
                  >
                    Wert {val.value}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-white text-sm leading-snug">{val.title}</h3>
                  <p className="mt-1.5 text-white/50 text-sm leading-relaxed">{val.desc}</p>
                </div>
              </div>
            </AnimatedItem>
          ))}
        </div>

        {/* Total value */}
        <AnimatedItem index={6 * 0.15 + 0.2}>
          <div
            className="mt-8 rounded-[20px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(234,88,12,0.08) 100%)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <div>
              <p className="text-white/50 text-sm">Gesamtwert aller Komponenten</p>
              <p className="text-3xl font-bold tracking-tighter mt-1">
                <span className="line-through text-white/25 text-2xl mr-3">€9.782</span>
                <span className="gradient-text">€2.499</span>
              </p>
            </div>
            <a
              href="#investition"
              className="px-6 py-3 rounded-2xl font-semibold text-sm text-white whitespace-nowrap transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
            >
              Jetzt sichern →
            </a>
          </div>
        </AnimatedItem>
      </div>
    </section>
  );
}
