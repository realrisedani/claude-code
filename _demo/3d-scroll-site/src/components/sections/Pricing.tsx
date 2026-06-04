"use client";

import { motion } from "framer-motion";
import { AnimatedSection, AnimatedItem } from "@/components/ui/AnimatedSection";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";

const INCLUDES = [
  "7 Module (vollständiges Operating System)",
  "Prompt-Bibliothek & Client-Templates",
  "Community-Zugang (dauerhaft)",
  "Wöchentliche Strategy Calls",
  "Sales-Skripte & Closing-Frameworks",
  "Delivery-Blueprints",
  "Setup Stack & Onboarding Layer",
  "Direkte Unterstützung",
];

export function Pricing() {
  return (
    <section id="investition" className="px-6 py-24 md:px-8 md:py-32 relative overflow-hidden">
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(245,158,11,0.07) 0%, transparent 100%)" }}
      />

      <div className="mx-auto max-w-[1200px]">
        <AnimatedSection className="flex flex-col items-center text-center mb-16">
          <AnimatedItem>
            <EyebrowBadge className="mb-5">Investition</EyebrowBadge>
          </AnimatedItem>
          <AnimatedItem index={1}>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-[1.08]">
              Phase 1 —{" "}
              <span className="gradient-text">Einmalige Investition</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem index={2}>
            <p className="mt-4 text-white/50 text-base max-w-[48ch] leading-relaxed">
              Kein Abo. Kein Massenprogramm. Einmalig investieren, dauerhaft nutzen.
            </p>
          </AnimatedItem>
        </AnimatedSection>

        <AnimatedItem index={0.3}>
          <div className="max-w-[500px] mx-auto">
            <div
              className="rounded-[24px] p-8 md:p-10 flex flex-col gap-7 relative overflow-hidden"
              style={{
                background: "var(--surface-2)",
                border: "1px solid rgba(245,158,11,0.35)",
                boxShadow: "var(--shadow-neu), 0 0 80px rgba(245,158,11,0.1)",
              }}
            >
              {/* Top gradient accent */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, var(--accent-from), var(--accent-to), transparent)" }}
              />

              {/* Scarcity badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold w-fit"
                style={{
                  background: "rgba(249,115,22,0.1)",
                  border: "1px solid rgba(249,115,22,0.25)",
                  color: "var(--accent-orange)",
                }}
              >
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-orange-400"
                />
                Limitiert auf 50 Founding Members — 12 Plätze verfügbar
              </div>

              {/* Price */}
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl md:text-6xl font-bold tracking-tighter text-white">€2.499</span>
                  <span className="text-white/30 text-sm">einmalig</span>
                </div>
                <p className="text-white/40 text-sm mt-1">danach steigt der Preis</p>
              </div>

              {/* Includes */}
              <ul className="flex flex-col gap-2.5">
                {INCLUDES.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] mt-0.5 flex-shrink-0"
                      style={{ background: "rgba(245,158,11,0.15)", color: "var(--accent-from)" }}
                    >
                      ✓
                    </span>
                    <span className="text-white/65 text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex flex-col gap-3">
                <a
                  href="#"
                  className="w-full py-4 rounded-2xl font-bold text-white text-center text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
                    boxShadow: "0 0 32px rgba(245,158,11,0.35)",
                  }}
                >
                  Jetzt einschreiben — €2.499 →
                </a>
                <a
                  href="#"
                  className="w-full py-3.5 rounded-2xl font-semibold text-white/70 text-center text-sm glass transition-all hover:bg-white/[0.07]"
                >
                  Zuerst unverbindlich sprechen — Gratis
                </a>
              </div>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-5 pt-2 border-t border-white/[0.06]">
                {["🔒 Stripe", "⚡ Sofortzugang", "🛡️ DSGVO"].map((item) => (
                  <span key={item} className="text-white/30 text-xs">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </AnimatedItem>
      </div>
    </section>
  );
}
