"use client";

import { AnimatedSection, AnimatedItem } from "@/components/ui/AnimatedSection";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";

const FOR = [
  "Digitale Builder ohne großes Startkapital",
  "KI-Interessierte ohne technische Vorkenntnisse",
  "Freelancer, die KI-Services anbieten wollen",
  "Menschen, die 2–3 Stunden täglich investieren",
  "Menschen, die verstehen: Ergebnisse erfordern Einsatz",
];

const NOT_FOR = [
  "Schnell-reich-werden-Sucher",
  "Menschen, die keine Kunden ansprechen wollen",
  "Wer erwartet, dass KI alles alleine macht",
  "Wer keine 1–2 Stunden täglich investieren kann",
  "Passive Zuschauer ohne Umsetzungsbereitschaft",
];

export function AudienceFit() {
  return (
    <section className="px-6 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <AnimatedSection className="flex flex-col items-center text-center mb-16">
          <AnimatedItem>
            <EyebrowBadge className="mb-5">Klartext</EyebrowBadge>
          </AnimatedItem>
          <AnimatedItem index={1}>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-[1.08]">
              Für wen ist das?
            </h2>
          </AnimatedItem>
          <AnimatedItem index={2}>
            <p className="mt-4 text-white/50 text-base max-w-[52ch] leading-relaxed">
              Kein Massenprogramm. Phase 1 ist für Menschen gebaut, die wirklich umsetzen wollen.
            </p>
          </AnimatedItem>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* For */}
          <AnimatedItem index={0.3}>
            <div
              className="h-full rounded-[20px] p-7 flex flex-col gap-5"
              style={{
                background: "rgba(52, 211, 153, 0.04)",
                border: "1px solid rgba(52, 211, 153, 0.15)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}
                >
                  ✅
                </div>
                <h3 className="font-semibold text-white">Perfekt für dich, wenn…</h3>
              </div>
              <ul className="flex flex-col gap-3">
                {FOR.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span style={{ color: "var(--accent-green)" }} className="mt-0.5 flex-shrink-0 text-sm font-bold">✓</span>
                    <span className="text-white/65 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedItem>

          {/* Not for */}
          <AnimatedItem index={0.45}>
            <div
              className="h-full rounded-[20px] p-7 flex flex-col gap-5"
              style={{
                background: "rgba(239, 68, 68, 0.03)",
                border: "1px solid rgba(239, 68, 68, 0.12)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  ❌
                </div>
                <h3 className="font-semibold text-white">Nicht für dich, wenn…</h3>
              </div>
              <ul className="flex flex-col gap-3">
                {NOT_FOR.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-red-400/70 mt-0.5 flex-shrink-0 text-sm font-bold">✕</span>
                    <span className="text-white/50 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedItem>
        </div>
      </div>
    </section>
  );
}
